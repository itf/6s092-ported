# 6.s092 Client-Side Code Checker

A browser-based port of the 6.s092 catsoop problem set autograder. Everything runs client-side — **no server needed for Python execution**. Python code runs via [Pyodide](https://pyodide.org/) (Python compiled to WebAssembly).

## Features

- **All question types** from catsoop: multiple choice (checkbox/radio/dropdown), expression, python literal, small box, number, multiexpression, python code
- **Python execution in browser** via Pyodide + WebAssembly
- **KaTeX** rendering for math
- **CodeMirror** editor for coding questions
- **Progress stored in IndexedDB** — persists across sessions, no login needed
- **Answer restoration** — typed answers and code survive page refresh

---

## Quick start

```bash
git clone <repo-url>
cd 6s079
python3 -m http.server 8080
# open http://localhost:8080/app/
```

The server **must** be started from the repo root so that both `app/` and `6s092/courses/` are accessible.

### Other local server options

```bash
# Node
npx serve .
# → http://localhost:3000/app/

# VS Code: right-click app/index.html → "Open with Live Server"
#   (must set Live Server root to the repo root, not app/)
```

---

## Deploying as a static website

No build step is required — the repo **is** the website.

### GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Source: **GitHub Actions**.
4. The workflow at `.github/workflows/deploy.yml` runs automatically on every push to `main`.
5. The site will be live at `https://<user>.github.io/<repo>/app/`.

> The root URL (`https://<user>.github.io/<repo>/`) redirects to `/app/` via the `_redirects` file (honoured by GitHub Pages via the Actions workflow).

### Cloudflare Pages

1. Connect the repo in the [Cloudflare Pages dashboard](https://dash.cloudflare.com/).
2. **Build command**: *(leave empty)*
3. **Build output directory**: `.` (a single dot — the repo root)
4. Deploy. Cloudflare reads `_redirects` and `netlify.toml` automatically, so `/` redirects to `/app/`.

### Netlify

1. Connect the repo in the [Netlify dashboard](https://app.netlify.com/).
2. **Build command**: *(leave empty)*
3. **Publish directory**: `.`
4. `netlify.toml` in the repo root handles the `/` → `/app/` redirect.

### GitLab Pages

Push the repo to GitLab. `.gitlab-ci.yml` copies the repo root into the `public/` directory that GitLab Pages requires. The site is served at `https://<namespace>.gitlab.io/<repo>/app/`.

---

## Repository layout

```
app/
  index.html          — SPA shell (CDN deps: Pyodide, KaTeX, marked, CodeMirror, idb)
  style.css           — all styles
  manifest.json       — list of courses + PSets (auto-generated)
  js/
    app.js            — routing + page rendering
    parser.js         — parse content.md → segments
    py-runner.js      — Pyodide wrapper + Python env setup
    questions.js      — question type renderers + checkers
    storage.js        — IndexedDB (scores + saved code)

6s092/courses/        — original course content (served as static files)
  IAP19/PS/PS01/content.md
  ...

tests/                — Node.js unit tests (run with `node tests/*.mjs`)
_redirects            — Cloudflare/Netlify SPA redirect rule
netlify.toml          — Netlify build + redirect config
.github/workflows/    — GitHub Actions deployment
.gitlab-ci.yml        — GitLab Pages deployment
```

---

## Regenerating the manifest

If you add new problem sets:

```bash
python3 -c "
import os, json
courses_root = '6s092/courses'
manifest = {'courses': []}
for course_id in sorted(os.listdir(courses_root)):
    course_dir = os.path.join(courses_root, course_id)
    if not os.path.isdir(course_dir): continue
    if course_id.startswith('testing'): continue
    ps_dir = os.path.join(course_dir, 'PS')
    psets = []
    if os.path.isdir(ps_dir):
        for ps in sorted(os.listdir(ps_dir)):
            if os.path.isdir(os.path.join(ps_dir, ps)) and not ps.startswith('.'):
                psets.append(ps)
    manifest['courses'].append({'id': course_id, 'name': course_id, 'psets': psets})
with open('app/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
print('manifest.json updated')
"
```

---

## Running the tests

```bash
node tests/syntax-check.mjs   # JS syntax + nullish coalescing precedence
node tests/parser.test.mjs    # content.md parser
node tests/questions.test.mjs # question renderers + expression normalizer
```

---

## Compatibility notes

- `<python>` blocks that use `cs_print()` are fully supported
- `csq_funcs` (custom functions for expression questions) are picked up from preload.py execution
- `tutor.init_random()` seeds randomness per page path
- Admin/grade-related code from preload.py is silently ignored
- Pyodide loads ~10 MB on first visit; subsequent visits are fast (browser-cached)


A browser-based port of the 6.s092 catsoop problem set autograder. Everything runs client-side — **no server needed for Python execution**. Python code runs via [Pyodide](https://pyodide.org/) (Python compiled to WebAssembly).

## Features

- **All question types** from catsoop: multiple choice (checkbox/radio/dropdown), expression, python literal, small box, number, multiexpression, python code
- **Python execution in browser** via Pyodide + WebAssembly
- **KaTeX** rendering for math
- **CodeMirror** editor for coding questions
- **Progress stored in IndexedDB** — persists across sessions, no login needed

## Running locally

You need a local HTTP server (due to `fetch()` CORS restrictions). Any of these work:

```bash
# Option 1 — Python (simplest)
cd /path/to/6s079        # the PARENT of the app/ folder
python3 -m http.server 8080
# then open http://localhost:8080/app/

# Option 2 — Node (npx serve)
npx serve .
# then open http://localhost:3000/app/

# Option 3 — VS Code Live Server extension
# Right-click app/index.html → "Open with Live Server"
```

The server must be started from the **parent directory** (`6s079/`) so that both `app/` and `6s092/courses/` are reachable.

## Architecture

```
app/
  index.html          — SPA shell (CDN deps: Pyodide, KaTeX, marked, CodeMirror, idb)
  style.css           — all styles
  manifest.json       — list of courses + PSets (auto-generated)
  js/
    app.js            — routing + page rendering
    parser.js         — parse content.md → segments
    py-runner.js      — Pyodide wrapper + Python env setup
    questions.js      — question type renderers + checkers
    storage.js        — IndexedDB (scores + saved code)

6s092/courses/        — original course content (unchanged)
  IAP19/PS/PS01/content.md
  ...
```

## Regenerating the manifest

If you add new problem sets:

```bash
cd /path/to/6s079
python3 -c "
import os, json
courses_root = '6s092/courses'
manifest = {'courses': []}
for course_id in sorted(os.listdir(courses_root)):
    course_dir = os.path.join(courses_root, course_id)
    if not os.path.isdir(course_dir): continue
    if course_id.startswith('testing'): continue
    ps_dir = os.path.join(course_dir, 'PS')
    psets = []
    if os.path.isdir(ps_dir):
        for ps in sorted(os.listdir(ps_dir)):
            if os.path.isdir(os.path.join(ps_dir, ps)) and not ps.startswith('.'):
                psets.append(ps)
    manifest['courses'].append({'id': course_id, 'name': course_id, 'psets': psets})
with open('app/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
"
```

## Notes on compatibility

- `<python>` blocks that use `cs_print()` are fully supported
- `csq_funcs` (custom functions for expression questions) are picked up from preload.py execution
- `tutor.init_random()` seeds randomness per page path
- Admin/grade-related code from preload.py is silently ignored (those features aren't ported)
- Pyodide loads ~10MB on first visit; subsequent visits are fast (cached by browser)
