# Resume Pipeline

![Build Artifacts](https://github.com/ar90n/cv/actions/workflows/build-artifacts.yml/badge.svg)

Automated resume generation and deployment system that produces multi-language (Japanese/English) resumes in HTML and PDF formats from JSON data.

## Features

- **Single Source of Truth**: All resume content in `data/master.json` (JA) and `data/master_en.json` (EN)
- **Multi-Format Output**: HTML (web), PDF (print-ready A4), and markdown (paste-ready for external services)
- **Schema Validation**: JSON Schema validation ensures data integrity
- **Automated Deployment**: GitHub Actions automatically deploys to GitHub Pages on main branch pushes
- **Build Artifacts**: Every push generates downloadable HTML and PDF artifacts via GitHub Actions

## Quick Start

```bash
# Install dependencies
npm install

# Validate resume data
npm run validate:ja
npm run validate:en

# Build HTML files
npm run build

# Generate PDFs
npm run pdf

# Local preview
npm run serve   # http://localhost:8080
```

## Build Artifacts

Every push to any branch automatically generates build artifacts that can be downloaded from GitHub Actions:

1. Navigate to the **Actions** tab in the repository
2. Click on the workflow run for your commit
3. Scroll to **Artifacts** section
4. Download:
   - `resume-html-<branch>`: Contains `index.html` and `index_en.html`
   - `resume-pdf-<branch>`: Contains `resume_ja.pdf` and `resume_en.pdf`

Artifacts are retained for 30 days and include the branch name for easy identification.

### Downloading via GitHub CLI

```bash
# List recent workflow runs
gh run list --workflow=build-artifacts.yml

# Download artifacts from latest run
gh run download

# Download specific artifacts
gh run download --name resume-pdf-main
```

## Deployment

This resume is automatically deployed to GitHub Pages when changes are pushed to the main branch.

**Live Site**: https://cv.ar90n.net/

### Workflow Status

![Deployment Status](https://github.com/ar90n/cv/actions/workflows/deploy-pages.yml/badge.svg)

### One-Time Setup

To enable deployment, configure GitHub Pages in repository settings:

1. Navigate to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save changes

Subsequent pushes to `main` will automatically deploy.

### Deployment Process

The GitHub Actions workflow:
1. Validates JSON data against `schema.json`
2. Builds HTML files (`index.html`, `index_en.html`)
3. Generates PDFs (`resume_ja.pdf`, `resume_en.pdf`)
4. Deploys all files to GitHub Pages

## Troubleshooting Deployment

### Workflow fails at validation step

**Cause**: `data/master.json` or `data/master_en.json` doesn't match `schema.json`

**Solution**: Run `npm run validate:ja` and `npm run validate:en` locally to see specific validation errors. Fix the JSON data to match the schema requirements.

### Workflow fails at build step

**Cause**: Missing template files or build script errors

**Solution**:
- Verify `src/template.html`, `src/build.js`, and `src/pdf.js` exist
- Check workflow logs for specific build errors
- Test build locally: `npm run build && npm run pdf`

### Workflow fails at PDF generation

**Cause**: Puppeteer/Chromium error during PDF rendering

**Solution**:
- Check workflow logs for Puppeteer errors
- Ensure HTML files are valid (malformed HTML can cause rendering failures)
- Verify PDF generation works locally: `npm run pdf`

### Deployment step fails with "Resource not accessible"

**Cause**: GitHub Pages not enabled or wrong source selected

**Solution**:
- Verify Pages settings: **Settings → Pages → Source: GitHub Actions**
- Ensure repository is public (or GitHub Pages is enabled for private repos with Pro/Team plan)
- Check workflow permissions include `pages: write` and `id-token: write`

### Files show 404 after deployment

**Cause**: Deployment propagation delay or incorrect artifact path

**Solution**:
- Wait 2-3 minutes for GitHub Pages propagation
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Verify `actions/upload-pages-artifact` uses `path: dist`
- Check Actions tab for deployment completion status

### Old content still visible after update

**Cause**: Browser cache or CDN delay

**Solution**:
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Open in private/incognito window
- Clear browser cache
- Check that workflow run completed successfully in Actions tab

## Project Structure

```
.
├── data/
│   ├── master.json        # Japanese resume data
│   └── master_en.json     # English resume data
├── src/
│   ├── template.html      # HTML template (Tailwind CDN)
│   ├── build.js           # JSON → HTML embedding
│   └── pdf.js             # HTML → PDF via Puppeteer
├── dist/                  # Build outputs (published to Pages)
│   ├── index.html
│   ├── index_en.html
│   ├── resume_ja.pdf
│   ├── resume_en.pdf
│   ├── lapras.md
│   └── findy.md
├── .github/
│   └── workflows/
│       └── deploy-pages.yml   # Deployment workflow
├── schema.json            # JSON Schema validator
└── package.json           # npm scripts
```

## Data Rules

- **JSON is the only source of truth** - No hardcoded resume content in code or templates
- **Schema validation required** - All JSON must validate before build/deployment
- **Multi-language consistency** - JA and EN maintain structural parity
- **Date format**: `YYYY-MM-DD` (month precision OK), `end_date: null` = "Present"

## Output Requirements

### HTML
- Self-contained files with embedded JSON (`window.MASTER_DATA`)
- Tailwind CSS loaded via CDN only (no local build)
- Semantic HTML with proper heading hierarchy

### PDF
- A4 format with 14mm margins
- Background graphics included (`printBackground: true`)
- Clean page breaks (no orphaned headings)

## Non-Goals

- No local Tailwind build (PostCSS, bundlers)
- No asset optimization pipeline
- No automated login to external services (LAPRAS, Findy)

## Contributing

1. Edit JSON data in `data/master*.json`
2. Run validation: `npm run validate:ja` and `npm run validate:en`
3. Test build locally: `npm run build && npm run pdf`
4. Commit and push to feature branch
5. Create PR to `main`
6. Merge triggers automatic deployment

## License

Private/Personal use
