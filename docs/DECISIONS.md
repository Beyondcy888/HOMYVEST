# HOMYVEST build — decisions

Each entry: date · decision · reason · how to undo.

## 2026-11-20

### D1. Project lives in the workspace root; the dev pack stays untouched
- **Decision:** the kit zip was extracted and its `CLAUDE.md`, `docs/`, `scripts/`, `reference/` and `.claude/settings.json` were placed in `d:\BEHOMY\HOMYVEST`. `HOMYVEST-DEV-PACK/` is left exactly as delivered.
- **Reason:** `00_START_HERE.md` A1 asks for this layout. The loose docs in the pack are byte-identical to the ones in the zip (hash-checked).
- **Undo:** delete the copied files; the pack still has the originals.

### D2. Render folder is `renders/`
- **Decision:** originals are read from `renders/` (contains `maxone/` and `padel-court/`). Nothing is ever written there.
- **Reason:** that is where the owner put them; the kit scripts auto-detect `renders/`.
- **Proof of no modification:** `qa/renders-originals.sha256.txt` holds SHA-256, size and timestamp of all 32 originals, taken before any work. Re-checked at M11.

### D3. `.claude/settings.json` from the kit was installed
- **Decision:** the kit's permission allowlist (npm, npx, node, git, python, basic file commands; denies `git push` and `rm -rf render`) is in `.claude/settings.json`.
- **Reason:** `00_START_HERE.md` A3 recommends it for an unattended run, and the owner asked for the whole pack to be executed.
- **Undo:** delete the `permissions` block from `.claude/settings.json`.

### D4. Unrelated folders are kept out of git
- **Decision:** `Template-Analisis-Tapak-Zoning-Site-Planning-mindelevate/` (purchased spreadsheet templates) and `HOMYVEST-DEV-PACK/` are in `.gitignore`.
- **Reason:** neither is part of the website; the template pack is third-party paid content.
- **Undo:** remove the lines from `.gitignore`.

### D5. Task list at the project root
- **Decision:** `TASKLIST.md` (root) is the at-a-glance checklist the owner asked for; `docs/PROGRESS.md` is the detailed milestone log the kit asks for.
- **Reason:** the owner asked for a task list to follow progress and to resume from.
- **Undo:** n/a.
