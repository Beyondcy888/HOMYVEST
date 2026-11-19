# HOMYVEST build — progress log

At-a-glance checklist: [../TASKLIST.md](../TASKLIST.md). This file is the detailed log, one entry per milestone.

**Resume rule:** find the last entry below, read its "Next step", re-read the matching doc section in `docs/`, continue.

- Build started: 2026-11-20 01:08 WIB
- Machine: Windows 11, Node v24.13.0, npm 11.6.2, git 2.50.1, Python 3.13.2 (`py -3`), AMD Ryzen AI 9 365 / Radeon 880M, 23 GB RAM
- Project root: `d:\BEHOMY\HOMYVEST` · originals: `renders/` (read-only) · kit source: `HOMYVEST-DEV-PACK/` (untouched)

---

## M0 Setup — 2026-11-20 01:08–01:40
| Item | Result | Notes |
|---|---|---|
| Node / npm | OK v24.13.0 / 11.6.2 | newer than the kit's v22 recommendation; everything installs and runs |
| Git repo | OK | initialised, first commit 41d06b3 |
| Render folder | OK `renders/` | 32 originals hashed into qa/renders-originals.sha256.txt |
| npm packages | OK | react 19.3, three 0.187, R3F 9.8, drei 10.7, gsap 3.15, lenis 1.3, vite 8.3, vitest 5.1, playwright 1.65, sharp 0.35, @axe-core/playwright |
| Impeccable | OK primary CLI | skill v4.10.0 in .claude/skills/impeccable, engine 0.1.27, 5 agents in .claude/agents |
| Impeccable hooks | OK installed by CLI | .claude/settings.local.json (SessionStart, PostToolUse Edit/Write, Stop). No separate `hooks on` step needed |
| Impeccable init | OK PRODUCT.md + DESIGN.md | answered from docs/02 and docs/03 (no live interview, owner away). This version's init writes only PRODUCT.md; DESIGN.md written by hand in the DESIGN.md spec format, mirroring docs/03 |
| Taste Skill (design-taste-frontend) | OK | v2.5.1 in .claude/skills/design-taste-frontend (38 MB incl. its asset kit) |
| Playwright plugin | NOT INSTALLED | The `claude` CLI is not on PATH (extension-only install). Needs the owner: `claude plugin install playwright@claude-plugins-official`. Not required for any test |
| Playwright test runner + Chromium | OK smoke passed | with GPU flags headless Chromium uses the real Radeon 880M (D3D11); default headless is SwiftShader |
| Python depth env | OK | py -3.13 venv, torch 2.15.0+cpu, transformers 5.23.0 |

## M1 Asset pipeline — 2026-11-20 01:40–01:55
- `npm run assets:padel`: 3 transparent cut-outs in .cache/padel-clean (1830x1119, 1342x895, 1341x928). Viewed: no caption text, building intact.
- `npm run assets:images`: 35 images, AVIF + WebP variants, 34 MB in public/media. Manifest has 35 entries; 3 with alpha; 3 flagged lowRes (benhil-1, benhil-2, facade-2).
- `scripts/depth-maps.py`: 28 depth maps, depth-status.json available: true. Viewed interior-3, facades/best, maxone/2: white = near.
- Known issues: none.
- Next step: M2 foundations (tokens, fonts, i18n provider, shell, wordmark, Lenis + GSAP).
