// Supabase Edge Function: generate-report
// Called by the database (pg_net) after each new lead, and every 10 minutes by pg_cron for retries.
// Deploy with:  npx supabase functions deploy generate-report --no-verify-jwt
// Auth: a shared secret header (x-report-secret) that matches the REPORT_WEBHOOK_SECRET function secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildReportPdf, reportFileName, type Lang, type LeadRow } from "./report.ts";
import { uploadPdfToDrive } from "./drive.ts";

const env = (k: string) => Deno.env.get(k);
const SECRET = env("REPORT_WEBHOOK_SECRET") ?? "";
const REPORT_LANG: Lang = env("REPORT_LANGUAGE") === "id" ? "id" : "en";
const TZ = env("REPORT_TIMEZONE") ?? "Asia/Jakarta";
const MAX_ATTEMPTS = 5;

const db = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pickRetryIds(): Promise<string[]> {
  const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
  const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
  const a = await db.from("leads").select("id")
    .in("report_status", ["pending", "failed"]).lt("report_attempts", MAX_ATTEMPTS).lt("created_at", twoMinAgo)
    .order("created_at", { ascending: true }).limit(10);
  const b = await db.from("leads").select("id")
    .eq("report_status", "processing").lt("report_at", fifteenMinAgo).lt("report_attempts", MAX_ATTEMPTS).limit(5);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return [...new Set([...(a.data ?? []), ...(b.data ?? [])].map((r) => r.id as string))];
}

async function processLead(id: string): Promise<{ id: string; status: string; error?: string }> {
  const { data: lead, error } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) return { id, status: "error", error: error.message };
  if (!lead) return { id, status: "not_found" };
  if (lead.report_status === "done") return { id, status: "already_done" };
  if (lead.report_attempts >= MAX_ATTEMPTS) return { id, status: "gave_up" };

  // Claim it (optimistic: only succeeds if nobody else bumped the attempt counter first).
  const { data: claimed, error: claimErr } = await db.from("leads")
    .update({ report_status: "processing", report_attempts: lead.report_attempts + 1, report_at: new Date().toISOString() })
    .eq("id", id).eq("report_attempts", lead.report_attempts)
    .select("*").maybeSingle();
  if (claimErr) return { id, status: "error", error: claimErr.message };
  if (!claimed) return { id, status: "claimed_elsewhere" };

  try {
    const bytes = await buildReportPdf(claimed as LeadRow, { lang: REPORT_LANG, timeZone: TZ });
    const file = await uploadPdfToDrive(env, bytes, reportFileName(claimed as LeadRow, TZ));
    await db.from("leads").update({
      report_status: "done", report_file_id: file.id, report_url: file.webViewLink ?? null,
      report_error: null, report_at: new Date().toISOString(),
    }).eq("id", id);
    return { id, status: "done" };
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    await db.from("leads").update({ report_status: "failed", report_error: message, report_at: new Date().toISOString() }).eq("id", id);
    console.error(`report failed for ${id}: ${message}`);
    return { id, status: "failed", error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!safeEqual(req.headers.get("x-report-secret") ?? "", SECRET)) return new Response("Unauthorized", { status: 401 });

  let body: { lead_id?: string; retry?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body */ }

  try {
    const ids = body.lead_id ? [body.lead_id] : body.retry ? await pickRetryIds() : [];
    const results = [];
    for (const id of ids) results.push(await processLead(id));
    return Response.json({ ok: true, results });
  } catch (e) {
    console.error(`generate-report error: ${e instanceof Error ? e.message : String(e)}`);
    return Response.json({ ok: false }, { status: 500 });
  }
});
