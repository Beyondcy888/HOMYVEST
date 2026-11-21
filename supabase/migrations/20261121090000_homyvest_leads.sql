-- HOMYVEST lead capture + automatic PDF report to Google Drive
-- Tables: lead_starts (phone entered in the hero), leads (completed form)
-- Security: the public (anon) key can only INSERT. Nobody can read leads except the service role.
-- Automation: after each insert, pg_net calls the `generate-report` Edge Function. A cron job retries failures.
-- Secrets are NOT in this file: the function URL and webhook secret are read from Supabase Vault at runtime
-- (see HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md, step A8).

create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------- tables
create table if not exists public.lead_starts (
  id          uuid primary key,
  created_at  timestamptz not null default now(),
  phone       text not null check (phone ~ '^\+628[0-9]{7,11}$'),
  lang        text not null default 'en' check (lang in ('en', 'id')),
  source      jsonb not null default '{}'::jsonb check (pg_column_size(source) < 4000)
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  start_id        uuid,
  lang            text not null default 'en' check (lang in ('en', 'id')),
  phone           text not null check (phone ~ '^\+628[0-9]{7,11}$'),
  funding         text not null check (funding in ('bank_loan', 'personal_funds', 'no_funds')),
  name            text not null check (char_length(btrim(name)) between 2 and 80),
  owned_assets    text[] not null default '{}'
                  check (owned_assets <@ array['kost','apartment','house','shophouse','hotel','vacant_land','unfinished_building','other']::text[]),
  owned_other     text check (owned_other is null or char_length(owned_other) <= 120),
  build_types     text[] not null default '{}'
                  check (build_types <@ array['kost','hybrid_stay','apartment','rental_houses','mixed_use','commercial','not_sure','other']::text[]),
  build_other     text check (build_other is null or char_length(build_other) <= 120),
  need            text check (need is null or need in ('rent_out','manage_kost','raise_occupancy','feasibility','other')),
  need_other      text check (need_other is null or char_length(need_other) <= 200),
  cities          text[] not null
                  check (cardinality(cities) between 1 and 12
                         and cities <@ array['jakarta','bodetabek','bandung','semarang','yogyakarta','solo','surabaya','malang','bali','bandar_lampung','medan','other']::text[]),
  city_other      text check (city_other is null or char_length(city_other) <= 80),
  calc            jsonb check (calc is null or pg_column_size(calc) < 4000),
  source          jsonb not null default '{}'::jsonb check (pg_column_size(source) < 4000),
  user_agent      text check (user_agent is null or char_length(user_agent) <= 400),
  -- managed by the server only (forced on insert by the trigger below)
  report_status   text not null default 'pending' check (report_status in ('pending','processing','done','failed')),
  report_attempts int  not null default 0,
  report_file_id  text,
  report_url      text,
  report_error    text,
  report_at       timestamptz,
  constraint leads_path_check check (
    (funding in ('bank_loan','personal_funds') and cardinality(owned_assets) > 0 and cardinality(build_types) > 0)
    or (funding = 'no_funds' and need is not null)
  )
);

create index if not exists leads_report_status_idx on public.leads (report_status, created_at);
create index if not exists leads_phone_idx on public.leads (phone, created_at desc);
create index if not exists lead_starts_phone_idx on public.lead_starts (phone, created_at desc);

-- ---------------------------------------------------------------- guards (server-managed columns + simple rate limits)
create or replace function public.leads_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at      := now();
  new.name            := btrim(new.name);
  new.report_status   := 'pending';
  new.report_attempts := 0;
  new.report_file_id  := null;
  new.report_url      := null;
  new.report_error    := null;
  new.report_at       := null;
  if (select count(*) from public.leads
      where phone = new.phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists leads_before_insert on public.leads;
create trigger leads_before_insert before insert on public.leads
  for each row execute function public.leads_before_insert();

create or replace function public.lead_starts_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  if (select count(*) from public.lead_starts
      where phone = new.phone and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists lead_starts_before_insert on public.lead_starts;
create trigger lead_starts_before_insert before insert on public.lead_starts
  for each row execute function public.lead_starts_before_insert();

-- ---------------------------------------------------------------- row level security: insert-only for the public key
alter table public.leads       enable row level security;
alter table public.lead_starts enable row level security;

revoke all on public.leads       from anon, authenticated;
revoke all on public.lead_starts from anon, authenticated;
grant insert on public.leads       to anon, authenticated;
grant insert on public.lead_starts to anon, authenticated;

drop policy if exists leads_insert_public on public.leads;
create policy leads_insert_public on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists lead_starts_insert_public on public.lead_starts;
create policy lead_starts_insert_public on public.lead_starts
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------- automation: ask the Edge Function for a report
create or replace function public.leads_request_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'report_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'report_webhook_secret';
  if v_url is null or v_secret is null then
    return new;                       -- automation not configured yet: keep the lead, the cron will pick it up later
  end if;
  perform net.http_post(
    url                  := v_url,
    body                 := jsonb_build_object('lead_id', new.id),
    headers              := jsonb_build_object('Content-Type', 'application/json', 'x-report-secret', v_secret),
    timeout_milliseconds := 30000
  );
  return new;
exception when others then
  raise warning 'leads_request_report failed: %', sqlerrm;   -- never block a lead because of the automation
  return new;
end $$;

drop trigger if exists leads_after_insert_report on public.leads;
create trigger leads_after_insert_report after insert on public.leads
  for each row execute function public.leads_request_report();

-- Retry every 10 minutes: pending/failed reports (max 5 attempts) and reports stuck in "processing".
select cron.unschedule('homyvest-retry-reports')
where exists (select 1 from cron.job where jobname = 'homyvest-retry-reports');

select cron.schedule('homyvest-retry-reports', '*/10 * * * *', $cron$
  select net.http_post(
    url                  := (select decrypted_secret from vault.decrypted_secrets where name = 'report_function_url'),
    body                 := '{"retry": true}'::jsonb,
    headers              := jsonb_build_object(
                              'Content-Type', 'application/json',
                              'x-report-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'report_webhook_secret')),
    timeout_milliseconds := 120000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'report_function_url')
    and exists (select 1 from public.leads
                where (report_status in ('pending','failed') and report_attempts < 5 and created_at < now() - interval '2 minutes')
                   or (report_status = 'processing' and report_at < now() - interval '15 minutes'));
$cron$);
