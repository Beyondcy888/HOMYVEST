# 01 — Setup (Milestone M0)

Do every step in order. After each step, run its **Verify** check and record the result in `docs/PROGRESS.md`. If a step fails, try its fallbacks in order. If every fallback fails, log it and continue: only Node and npm are truly blocking.

> **Important for an unattended run:** interactive prompts will hang you. Run installers with `CI=1`, feed them no input (`< /dev/null`), and wrap long commands in a timeout (`timeout 600 ...`, or the Bash tool's own timeout). On Windows, Claude Code runs commands in Git Bash, so the bash syntax below works there too. Where paths differ, both are given.

---

## 1. Preflight

```bash
node -v        # need v20.19+ (v22 LTS ideal)
npm -v
git --version
python3 --version || python --version || py --version   # 3.10+ wanted, optional
claude --version
```

**Verify:** Node ≥ 20.19 and npm present. If Node is missing or too old, **stop and write this clearly at the top of `docs/PROGRESS.md` and `docs/REPORT.md`**. Nothing else can run without it.

Detect the render folder (it must contain `maxone/` and `padel-court/`):
```bash
ls render/maxone render/padel-court 2>/dev/null || ls render/renders/maxone 2>/dev/null || ls renders/maxone 2>/dev/null
```
Record the real path in `docs/DECISIONS.md`. The scripts find it on their own.

---

## 2. Git

```bash
git init 2>/dev/null || true
```

Create `.gitignore`:
```gitignore
node_modules/
dist/
.cache/
.venv-depth/
test-results/
playwright-report/
qa/tmp/
*.log
.DS_Store
# Original renders stay on disk but out of git (large). public/media holds the web copies.
render/
renders/
```

**Verify:** `git status` works.

---

## 3. Project scaffold (written by hand, so nothing prompts)

Do **not** use `npm create vite`, because it prompts in a non-empty folder. Create these files directly.

`package.json`:
```json
{
  "name": "homyvest",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "assets:padel": "node scripts/clean-padel.mjs",
    "assets:images": "node scripts/optimize-images.mjs",
    "assets": "npm run assets:padel && npm run assets:images",
    "e2e": "playwright test",
    "shots": "playwright test qa/screenshots.spec.ts"
  }
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```
Code-split all 3D with `React.lazy(() => import(...))` (see `09` §4). Don't hand-configure chunks.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "types": ["vite/client"]
  },
  "include": ["src", "qa", "vite.config.ts", "playwright.config.ts"]
}
```

`index.html`: a minimal shell. Real meta tags come in M2 (`09` §8).
```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>HOMYVEST</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/main.jsx`:
```jsx
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
createRoot(document.getElementById('root')).render(<App />);
```
`src/App.jsx`: `export default function App() { return <main>HOMYVEST</main>; }`

**Language choice:** components are JavaScript (`.jsx`). The calculator engine and its tests are TypeScript (`src/lib/calc/*.ts`), because type safety protects the locked formulas. Vite handles both. No other language ships to the browser.

---

## 4. Install packages

```bash
CI=1 npm install react@19 react-dom@19 three @react-three/fiber@9 @react-three/drei@10 \
  @react-three/postprocessing@3 postprocessing gsap @gsap/react lenis zustand maath \
  @fontsource-variable/archivo < /dev/null

CI=1 npm install -D vite @vitejs/plugin-react typescript vitest @playwright/test sharp \
  @types/react @types/react-dom @types/three < /dev/null
```

Notes:
- React Three Fiber v9 requires React 19. Keep them paired.
- GSAP 3 includes ScrollTrigger and SplitText free of charge in the public `gsap` package. Import them from `gsap/ScrollTrigger` and `gsap/SplitText`.
- `sharp` ships prebuilt binaries. If its install fails, run `npm install --include=optional sharp` once more.
- Commit `package-lock.json`.

**Verify:**
```bash
npm ls react @react-three/fiber three gsap lenis --depth=0
timeout 20 npx vite --version
```
Then run `npm run dev` briefly, open `http://localhost:5173` with Playwright (step 7) and confirm the page shows "HOMYVEST".

---

## 5. Install the design skills

Skills live in `.claude/skills/<name>/SKILL.md`. Skills installed during this session may not appear in your skill list until Claude Code restarts. **That's fine: you can always open the `SKILL.md` file and follow it directly.** Do that whenever a skill isn't listed.

### 5.1 Impeccable (design system and design QA)
**Primary (CLI, installs the skill plus its Claude Code hooks for this project):**
```bash
CI=1 timeout 600 npx -y impeccable install --providers=claude --scope=project < /dev/null
```
**Fallback A (link from a local clone):**
```bash
git clone --depth 1 https://github.com/pbakaus/impeccable .cache/impeccable
CI=1 timeout 600 npx -y impeccable link --source=.cache/impeccable --providers=claude < /dev/null
```
**Fallback B (copy a prebuilt bundle if the clone has one):**
```bash
ls .cache/impeccable/dist/claude-code/.claude && cp -r .cache/impeccable/dist/claude-code/.claude/. .claude/
```
**Fallback C (needs the human, so just log it):** add to `REPORT.md` under "Needs you": *"Inside Claude Code run `/plugin marketplace add pbakaus/impeccable`, then open `/plugin` and install Impeccable."*

**Verify:** `find .claude -name SKILL.md | xargs grep -il impeccable` finds at least one file.

**Initialise it (the equivalent of `/impeccable init`):** invoke the Impeccable skill with the `init` command. If it's not in your skill list, open its `SKILL.md`, find the `init` instructions, and carry them out yourself. Init asks about the product and the design. **Answer every question from `02_PROJECT_BRIEF.md` and `03_BRAND_AND_DESIGN.md`. Don't wait for a human.** Init writes `PRODUCT.md` and `DESIGN.md` at the project root. Read them afterwards: where they disagree with `docs/`, **`docs/` wins**, so edit them to match.

**Hooks (the equivalent of `/impeccable hooks on`):** the CLI install already registers Impeccable's project hooks. If the skill documents a `hooks` command, run it with `on`. If no such command exists, the install is enough. Log which case applied.

### 5.2 Taste Skill (anti-generic frontend taste)
Install **only** `design-taste-frontend`. Do not install the whole collection: it contains opposing style skills (brutalist, minimalist and others) that would pull the design in different directions. Also skip the duplicate marketplace install.
```bash
CI=1 timeout 300 npx -y skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend --agent claude-code < /dev/null
```
**Fallback A:**
```bash
CI=1 timeout 300 npx -y skills add Leonxlnx/taste-skill --skill design-taste-frontend < /dev/null
```
**Fallback B (manual copy):**
```bash
git clone --depth 1 https://github.com/Leonxlnx/taste-skill .cache/taste-skill
# find the folder whose SKILL.md frontmatter says name: design-taste-frontend
grep -rl "name: *design-taste-frontend" .cache/taste-skill --include=SKILL.md
mkdir -p .claude/skills/design-taste-frontend
cp -r "$(dirname "$(grep -rl 'name: *design-taste-frontend' .cache/taste-skill --include=SKILL.md | head -1)")"/. .claude/skills/design-taste-frontend/
```
**Verify:** `.claude/skills/design-taste-frontend/SKILL.md` exists. If the `skills` CLI put it in `.agents/skills/` instead, copy it into `.claude/skills/`.

### 5.3 Playwright
**Claude Code plugin** (gives interactive browser tools after a restart; nice to have):
```bash
timeout 180 claude plugin install playwright@claude-plugins-official < /dev/null
# if it says the marketplace is unknown:
timeout 120 claude plugin marketplace add anthropics/claude-plugins-official < /dev/null && \
timeout 180 claude plugin install playwright@claude-plugins-official < /dev/null
```
The plugin's tools appear only after Claude Code restarts, so **don't depend on them**. All required testing uses the npm package below, which works immediately.

**Test runner and browser (required):**
```bash
timeout 900 npx playwright install chromium
# Linux only, if launching fails with missing libraries (may need sudo; skip if not allowed):
# npx playwright install-deps chromium
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'qa',
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: true, timeout: 240_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

**Verify:** create `qa/smoke.spec.ts` with a test that opens `/` and expects the text "HOMYVEST", then run `npx playwright test qa/smoke.spec.ts --project=desktop`. It must pass.

---

## 6. Python environment for depth maps (optional but wanted)

This env is used only at build time to create depth maps (`08` §3.3). If any step here fails, log it and continue. `scripts/depth-maps.py` writes `depth-status.json` with `available: false`, and the site simply skips the depth effect.

**macOS / Linux**
```bash
python3 -m venv .venv-depth
.venv-depth/bin/python -m pip install --upgrade pip
# Linux: CPU-only torch keeps the download small
.venv-depth/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu || .venv-depth/bin/pip install torch
# macOS: the default wheel (uses Apple GPU when available)
# .venv-depth/bin/pip install torch
.venv-depth/bin/pip install "transformers>=4.45" pillow numpy
```
**Windows (Git Bash)**
```bash
py -3 -m venv .venv-depth
.venv-depth/Scripts/python.exe -m pip install --upgrade pip
.venv-depth/Scripts/pip.exe install torch --index-url https://download.pytorch.org/whl/cpu
.venv-depth/Scripts/pip.exe install "transformers>=4.45" pillow numpy
```
**Verify:**
```bash
.venv-depth/bin/python -c "import torch, transformers, PIL, numpy; print('depth env ok', torch.__version__, transformers.__version__)"
```
The model (`depth-anything/Depth-Anything-V2-Small-hf`, ~100 MB, Apache-2.0) downloads on first run of the script. **Use only the Small model.** The Base and Large versions carry a non-commercial license.

---

## 7. Copy the kit's ready-made files into place

This kit ships tested files. If they're missing, recreate them from the code blocks in the docs.
- `scripts/clean-padel.mjs` (code in `08` §3.1)
- `scripts/optimize-images.mjs` (code in `08` §3.2)
- `scripts/depth-maps.py` (code in `08` §3.3)
- `reference/calc.ts` and `reference/calc.test.ts` (code in `05` §12). In M3, move them to `src/lib/calc/` (see `05` §12).

---

## 8. Setup report

Append to `docs/PROGRESS.md`:

```md
## M0 Setup — <date/time>
| Item | Result | Notes |
|---|---|---|
| Node / npm | ✅ v22.x / 10.x | |
| Git repo | ✅ | |
| Render folder | ✅ render/renders | |
| npm packages | ✅ | |
| Impeccable | ✅ primary CLI | hooks installed by CLI |
| Impeccable init | ✅ PRODUCT.md, DESIGN.md aligned with docs | |
| Taste Skill (design-taste-frontend) | ✅ | |
| Playwright plugin | ✅ / ⚠️ needs restart | |
| Playwright test runner + Chromium | ✅ smoke passed | |
| Python depth env | ✅ / ⚠️ skipped (reason) | |
```

Commit: `M0: project setup, skills, tooling`.
