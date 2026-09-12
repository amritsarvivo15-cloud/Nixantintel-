# Radar 365 by NiXant Intelligence OS

GMV portfolio cockpit and sales lead funnel for Non-RAM / KAM accounts. React, TypeScript, Express, Tailwind CSS, and Recharts.

## What it does

- **Portfolio cockpit**: July baseline vs August / September GMV, action buckets (priority follow-up, recovery, upside, active MTD), searchable table, CSV export.
- **Lead funnel**: pipeline stages from new lead through activation, follow-up due today / overdue, duplicate checks against existing accounts, convert-to-portfolio.
- **Zeta copilot**: `/api/ask` with NVIDIA Integrate API, Gemini, or a grounded fallback when no keys are set.
- **Data hub**: Excel / CSV / paste ingest with match preview, commit, and rollback.
- **Fold layouts**: Samsung Fold cover, unfolded split, and adaptive desktop views.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

App: `http://0.0.0.0:3000`

Optional secrets in `.env`:

| Variable | Purpose |
| --- | --- |
| `NVIDIA_API_KEY` / `NVIDIA_MODEL` | Zeta via NVIDIA Integrate API |
| `GEMINI_API_KEY` | Zeta + screenshot GMV extraction |
| `LOGO_DEV_TOKEN` / `VITE_LOGO_DEV_TOKEN` | Company logos |

Diagnostics: `GET /api/status` and `GET /api/check`.

## Deploy on Vercel

This repo is a Vite SPA plus Express API routes as Vercel Node Functions (`api/status.ts`, `api/ask.ts`, and related files).

1. Push this branch to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Vercel should detect **Vite**. Confirm:
   - Build Command: `npx vite build` (from `vercel.json`)
   - Output Directory: `dist`
4. Add optional environment variables (Production + Preview):
   - `NVIDIA_API_KEY` / `NVIDIA_MODEL` — Zeta via NVIDIA
   - `GEMINI_API_KEY` — Zeta + screenshot GMV extraction
   - `LOGO_DEV_TOKEN` / `VITE_LOGO_DEV_TOKEN` — company logos
5. Deploy. The app is available without AI keys (grounded fallback). Screenshot extract needs `GEMINI_API_KEY`.

Or from the CLI after `npx vercel login`:

```bash
npx vercel --prod
```

## Scripts

```bash
npm run lint    # tsc --noEmit
npm run build   # Vite client + bundled Express server
npm start       # production server from dist/
```
