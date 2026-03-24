# Startup Job Aggregator

Dark-mode job browsing dashboard for VC-sourced startup listings stored in Supabase. Includes an /admin section for pipeline history and source/filter config. A standalone Python scraper writes data to the same Supabase instance.

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values (see [Environment variables](#environment-variables) below).

### 3. Run the dev server

```bash
npm run dev
```

The app is at http://localhost:3000. All routes are password-protected — log in with the `APP_PASSWORD` you set in `.env.local`.

---

## Environment variables

### Web app — `.env.local`

Copy from `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — used server-side only |
| `APP_PASSWORD` | Yes | Password to log in to the dashboard |
| `SMTP_HOST` | No | SMTP host for email (default: `smtp.gmail.com`) |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP sender address |
| `SMTP_PASS` | No | Gmail App Password (generate at myaccount.google.com → Security → App passwords) |

> The app will not start correctly without the three Supabase vars and `APP_PASSWORD`.

### Scraper — `scraper/.env`

Copy from `scraper/.env.example`:

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Same Supabase project URL |
| `SUPABASE_KEY` | Yes | Service role key (the scraper writes to the DB) |
| `SMTP_HOST` | No | Same as above — for the weekly digest email |
| `SMTP_PORT` | No | |
| `SMTP_USER` | No | |
| `SMTP_PASS` | No | |

```bash
cp scraper/.env.example scraper/.env
# then edit scraper/.env with real values
```

---

## Running the scraper

```bash
cd scraper
pip install -r requirements.txt
python -m playwright install chromium
python scrape.py
```

The scraper fetches VC board and newsletter listings, deduplicates them, applies keyword filters, and upserts everything into the `jobs` table. It also inserts a row into `pipeline_runs` and (if SMTP is configured) sends a digest email.

---

## Build & deploy

```bash
npm run build      # must complete with zero errors
npx next start     # verify locally before deploying
```

Deploy to Vercel:

```bash
npx vercel --yes --token=$VERCEL_TOKEN
```

Make sure all variables from `.env.local` are set in your Vercel project environment (Settings → Environment Variables).

---

## Project structure

```
.
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── (main)/           # Protected routes (browse, saved, admin, login)
│   │   └── api/              # API route handlers
│   ├── components/           # React components
│   ├── lib/                  # Supabase clients, savedJobs, weekKey helpers
│   └── types/                # Shared TypeScript types
├── scraper/                  # Standalone Python scraper (not part of Next.js build)
│   ├── scrape.py             # Entry point
│   ├── scrapers/             # vc_boards.py, newsletters.py
│   ├── deduper.py
│   ├── filter.py
│   ├── config.py
│   ├── mailer.py
│   └── requirements.txt
├── .env.example              # Template for .env.local
└── scraper/.env.example      # Template for scraper/.env
```

---

## Supabase schema

The app expects these tables:

- **`jobs`** — scraped listings
- **`pipeline_runs`** — one row per scraper run
- **`app_config`** — key/value config (sources, filter_config)

Schema migrations are not included in this repo. If starting fresh, create the tables manually via the Supabase dashboard or SQL editor to match the types in `src/types/index.ts`.
