## Mission
From a single **master JSON**, generate:
1. **Static web resumes (JA/EN)** — styled with **Tailwind via CDN** (no local build), delivered as single HTML files with `window.MASTER_DATA` embedded.
2. **Print‑ready A4 PDFs (JA/EN)** — generated from the web pages via **Puppeteer** with background printing and fixed margins.
3. **Paste‑ready text** for external services — **LAPRAS** and **Findy** markdown.

The JSON files are the **only source of truth**.

---

## Deliverables
- Web (JA): `dist/index.html`
- Web (EN): `dist/index_en.html`
- PDF (JA): `dist/resume_ja.pdf`
- PDF (EN): `dist/resume_en.pdf`
- LAPRAS paste: `dist/lapras.md`
- Findy paste: `dist/findy.md`
- Tooling & config: `data/*.json`, `src/*.html|js`, `schema.json`, `.github/workflows/deploy-pages.yml`, `README.md`

---

## Repository Layout
```
resume-pipeline/
  data/
    master.json        # JA (canonical)
    master_en.json     # EN (derived; consistent with JA)
  src/
    template.html      # Tailwind CDN; client-side render from JSON
    build.js           # CLI: embed JSON -> dist/*.html
    pdf.js             # CLI: render HTML -> dist/*.pdf (Puppeteer)
  dist/                # build outputs
  schema.json          # JSON Schema (Draft 2020-12)
  package.json
  README.md
  .github/workflows/deploy-pages.yml
```

---

## Commands
```bash
npm i

# Validate JSON
npm run validate:ja
npm run validate:en

# Build static pages (JA/EN)
npm run build

# Generate PDFs (JA/EN)
npm run pdf

# Local preview
npm run serve   # http://localhost:8080
```

**CLI options**
```bash
node src/build.js --data=./data/master.json --out=./dist/custom.html --title="Resume (JA)"
node src/pdf.js   --in=./dist/custom.html   --out=./dist/custom.pdf
```

---

## Data Rules
- Edit **`data/master.json`** (JA) and **`data/master_en.json`** (EN) only.  
- Do **not** hardcode resume strings anywhere else.  
- Validate with `schema.json` (Draft 2020‑12) via `ajv-cli`.

### Required (excerpt)
- `basics` (`name`, `name_en`, `title`, `email`, `profiles{}`)  
- `experience[]` (min: `company`, `title`, `start_date`)  
- `education[]`  

### Conventions
- Dates: `YYYY-MM-DD` (month precision OK). `end_date: null` = “Present”.
- Punctuation: JP uses `、` `。`; English uses ASCII punctuation. Slashes are `/`.
- **LinkedIn dates are canonical** (already applied).
- Certifications (exact names):
  - **第一級陸上無線技術士** (2024)
  - **Kaggle Competition Expert** (2021)
- Robotics wording uses **ROS** (not “ROS2”).
- Don’t overstate nav/SLAM expertise beyond provided content.

### Optional
- `skills{}`, `certifications[]`, `interests[]` (hidden if empty).

---

## Rendering Requirements

### Visual style
**High legibility, quietly stylish.**
- Tailwind CDN only.
- Base: `bg-gray-50 text-gray-900`, paragraphs with `leading-relaxed`.
- Headings:
  - H1: `text-3xl font-bold tracking-tight`
  - H2: `text-xl font-semibold border-b border-gray-200 pb-1`
  - H3: `text-lg font-semibold`
- Spacing: sections `mb-6`; page padding `p-6`.
- Badges (skills/tech):  
  `inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700`.

### Layout & print
- Single column: `max-w-4xl mx-auto`.
- Avoid page breaks inside blocks: `.page { break-inside: avoid; }`.
- **PDF**: A4, margins **14mm**, `printBackground: true`.
- H2 should not float alone at page bottom (avoid widows/orphans where feasible).

### Accessibility
- Semantic heading order (H1→H2→H3).
- Links underlined.

---

## Section Order & Behaviors (template.html)
1. **Header** (name / title / contacts)
2. **Summary** (one concise paragraph)
3. **Skills** (two-column grid if content fits)
4. **Experience** (each block has `.page`)
5. **Education**
6. **Interests** (rendered only when `interests[]` is non-empty; labeled “Interests”)

**Rules**
- Dates displayed as `YYYY年M月 〜 現在|YYYY年M月` (JP) and `MMM YYYY – Present|MMM YYYY` (EN acceptable).
- Omit empty fields entirely (no dangling labels).
- `tech[]` renders as badges.
- `responsibilities[]` renders as bullet list (up to 6 lines).

---

## Multi‑language (JA/EN)
- JA builds from `data/master.json` → `dist/index.html` → `dist/resume_ja.pdf`.
- EN builds from `data/master_en.json` → `dist/index_en.html` → `dist/resume_en.pdf`.
- Optional later: runtime language toggle (`?lang=en`) without changing current outputs.

---

## GitHub Pages
- Included workflow `.github/workflows/deploy-pages.yml`.
- Enable Pages: **Settings → Pages → Source: GitHub Actions**.
- On `main` push, publish `dist/`:
  - `/index.html` (JA)
  - `/index_en.html` (EN)

---

## External Services (LAPRAS / Findy)
- No public write APIs assumed.  
- Generate paste-ready markdown:
  - `dist/lapras.md`
  - `dist/findy.md`

---

## Backlog
- [ ] URL param toggles: `?sections=experience,skills`.
- [ ] UI language toggle (JA/EN) w/out rebuild.
- [ ] Print footer with name/email/page numbers.
- [ ] Single-page print variant (tighter spacing).
- [ ] Stricter schema for `metrics` and `tech` enums.
- [ ] EN glossary for consistent terminology.
- [ ] CI: run `validate:*` and upload PDFs as artifacts.

---

## Acceptance Criteria
- `npm run validate:*` passes.
- `npm run build` emits self-contained HTML (Tailwind CDN as only external dependency).
- `npm run pdf` produces A4 PDFs with 14mm margins, background on, clean page breaks.
- Works on latest Chrome/Edge/Safari.
- Empty `interests` hides the section.
- Dates, names, and certifications follow the rules above.

---

## Non‑Goals
- No local Tailwind build (no PostCSS).
- No asset optimization pipeline.
- No scraping or automated logins to external services (ToS compliance).

---

## Contributor Notes
- Plain JS (ES2015+) with minimal deps (`puppeteer`, `ajv-cli`, `http-server`).
- Keep `template.html` readable; small, well-named functions.
- Add sections with a “render if present” pattern for safe extensibility.
