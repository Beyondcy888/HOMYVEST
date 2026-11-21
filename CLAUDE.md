# HOMYVEST website — agent instructions

You are building the public marketing website for **HOMYVEST**, end to end, **unattended**. The owner has handed you this folder and left. Nobody will answer questions. Everything you need is in `docs/`.

## Read first, in this order
1. `docs/00_START_HERE.md` — mission, milestones, rules, definition of done
2. `docs/01_SETUP.md` — install everything (skills, plugins, packages, Python) and verify
3. `docs/02_PROJECT_BRIEF.md` — what HOMYVEST is, who it is for, verified facts
4. `docs/03_BRAND_AND_DESIGN.md` — visual language, typography, wordmark, motion
5. `docs/04_SITE_FLOW_AND_STORY.md` — every section, in order, and how they connect
6. `docs/05_CALCULATOR_SPEC.md` — the land calculator (formulas are locked)
7. `docs/06_3D_EXPERIENCES.md` — hero story, Maxone walkthrough, padel assembly, depth effect
8. `docs/07_CONTENT_AND_COPY.md` — all text in English and Bahasa Indonesia
9. `docs/08_ASSETS.md` — the renders, the asset pipeline, captions
10. `docs/09_TECH_ARCHITECTURE.md` — stack, structure, performance
11. `docs/10_QA_AND_LAUNCH.md` — tests, reviews, final report
12. `updates/` — owner updates since the first build (`updates/Uxx/`, each starting at `Uxx_00_START.md`); `docs/` already describes the site after every applied update

## Non-negotiables
- **Never wait for input.** If something is unclear, choose the option that best serves the brief, write it in `docs/DECISIONS.md`, and continue.
- **Log progress** in `docs/PROGRESS.md` after every milestone (what's done, what's next, any problems). If your session restarts, resume from that file.
- **Never modify, move, rename or delete anything in `render/`** (the original renders). Read from it; write optimized copies elsewhere.
- **Never change the calculator formulas, defaults or rounding** in `docs/05_CALCULATOR_SPEC.md`. Its tests must pass.
- **Never invent facts or numbers** about HOMYVEST, HomyEight or Behomy. Use only the facts sheet in `docs/02_PROJECT_BRIEF.md`.
- **Never upscale an image.** Use the generated responsive variants.
- Commit to git after every milestone with a clear message.
- The finished site must work without 3D (reduced motion, no WebGL, slow phones) and be lovely with it.
- **Updates.** Owner updates live in `updates/Uxx/` and start at `Uxx_00_START.md`. Apply them in number order. An update overrides `docs/` where they conflict. After applying it, edit `docs/` so it describes the current site, log changes in `docs/DECISIONS.md`, and write `docs/REPORT_Uxx.md`.
- **Secrets.** Never read, print or commit `.env*` (except `*.example`), `supabase/.env*`, or key files. Run `node scripts/check-secrets.mjs --all` before committing.
