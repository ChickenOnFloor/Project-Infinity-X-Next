# Project Infinity X — Next.js (unified)

Storefront, admin panel, and backend API in **one** Next.js project, deployed
as **one** Vercel project. This replaces the earlier setup of a separate
Vite/React frontend + Express backend as two different deployments.

## Why this is simpler than the old setup

The old setup had two separate Vercel deployments (frontend + backend) on
two different domains, which meant:
- CORS configuration (`ALLOWED_ORIGIN`) had to be kept in sync
- Two separate places for Vercel's Deployment Protection / Attack Challenge
  Mode to potentially block requests
- Two sets of environment variables, two things to redeploy, two URLs to
  keep straight

Here, the storefront (`/`), the admin panel (`/admin`), and every API route
(`/api/stock`, `/api/webhook/gumroad`, `/api/admin/*`) all live on the same
domain. Requests from the storefront to `/api/stock` are same-origin —
there is no CORS involved at all, so there's nothing to misconfigure there.

## Project structure

```
app/
  page.jsx                    ← storefront (hero, games, pricing, FAQ)
  admin/page.jsx               ← admin panel UI
  layout.jsx                   ← root layout, fonts
  globals.css                  ← all styles (storefront + admin)
  api/
    stock/route.js             ← GET  /api/stock            (public)
    webhook/gumroad/route.js   ← POST /api/webhook/gumroad   (Gumroad calls this)
    admin/stock/route.js       ← GET  /api/admin/stock       (protected)
    admin/keys/import/route.js ← POST /api/admin/keys/import (protected)
lib/
  db.js       ← MongoDB connection (cached across requests/hot-reloads)
  email.js    ← Resend email sending
  adminAuth.js← shared admin key check
models/
  Key.js      ← Mongoose schema for stocked keys
scripts/
  import-keys.js ← CLI bulk-import, alternative to the /admin UI
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `MONGODB_URI` — your MongoDB connection string
- `RESEND_API_KEY`, `FROM_EMAIL` — for sending key-delivery emails
- `GUMROAD_PRODUCT_WEEKLY` / `_MONTHLY` / `_LIFETIME` — permalink slugs
  (the part after `/l/` in each product's Gumroad URL)
- `ADMIN_ALERT_EMAIL` — optional, for low/out-of-stock alerts
- `ADMIN_API_KEY` — long random secret protecting `/admin` and its API
  routes (generate with `openssl rand -hex 32`)

There's no `ALLOWED_ORIGIN` anymore — nothing to configure there.

### 3. Run locally

```bash
npm run dev
```

- Storefront: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- Stock API: `http://localhost:3000/api/stock`

### 4. Import your key stock

Either use the `/admin` page (paste keys into the textarea), or the CLI:

```bash
node scripts/import-keys.js weekly ./keys/weekly.txt
node scripts/import-keys.js monthly ./keys/monthly.txt
node scripts/import-keys.js lifetime ./keys/lifetime.txt
```

## Deploying to Vercel

1. Push this repo to GitHub, import it in Vercel (Next.js is auto-detected
   — no `vercel.json` needed at all).
2. Add every variable from `.env.example` in Settings → Environment
   Variables.
3. Deploy.
4. In each Gumroad product's Settings → Advanced → Ping, set the webhook
   URL to:
   ```
   https://your-project.vercel.app/api/webhook/gumroad
   ```
5. Check your Vercel project's **Settings → Deployment Protection** and
   **Settings → Firewall**. If either "Vercel Authentication", "Password
   Protection", or "Attack Challenge Mode" is on, it'll block requests
   before your code even runs — turn these off for a public storefront
   (the admin routes already have their own real protection via
   `ADMIN_API_KEY`).

**MongoDB Atlas:** under Network Access, allow `0.0.0.0/0` — Vercel's
serverless functions don't have a fixed IP.

## Admin panel access

`/admin` is part of the same public Next.js app, so anyone who knows the
URL can *load the page* — but they can't see stock or add keys without
your `ADMIN_API_KEY`, which is checked on every admin API request. Don't
publicly link to `/admin` from your storefront navigation.

## What happens on a sale

1. Buyer pays on Gumroad.
2. Gumroad's Ping webhook calls `/api/webhook/gumroad` with the sale
   details.
3. The route matches the product to a plan, atomically claims the oldest
   unused key for that plan in MongoDB, marks it `used`, and emails it to
   the buyer via Resend.
4. If a plan's stock hits zero, you get an out-of-stock alert email instead
   of the buyer silently getting nothing.
5. When any plan's remaining stock drops to 5 or fewer, you get a
   low-stock alert too.

## Notes

- **Idempotent:** if Gumroad retries a webhook, the route checks the sale
  ID first and won't double-assign a key.
- **Race-safe:** claiming a key uses an atomic `findOneAndUpdate`, so two
  simultaneous sales can never get the same key.
- **DNS workaround included:** `lib/db.js` forces Google/Cloudflare DNS
  servers for the MongoDB connection, which fixes `querySrv ECONNREFUSED`
  errors some local networks/ISPs cause. Harmless on Vercel.
