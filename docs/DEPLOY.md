# Deploying Lodus

## Production MVP (public homepage + secret admin)

For the first production launch, visitors see only the public homepage. Member Sign-in, Apply, and hub tabs are hidden until you flip one flag.

### Required env (production)

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | Neon pooled URL | App runtime |
| `DATABASE_URL_UNPOOLED` | Neon direct URL | `db:push` / migrations |
| `AUTH_SECRET` | `openssl rand -base64 32` | Session signing |
| `AUTH_URL` | `https://yourdomain.com` | Must match deployed URL |
| `ADMIN_EMAIL` | your Gmail | Only this account can use Admin login |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud | Redirect: `https://yourdomain.com/api/auth/callback/google` |
| `NEXT_PUBLIC_MEMBER_AUTH_ENABLED` | **`false`** | Hides member auth UI and routes |
| `NEXT_PUBLIC_DONATIONS_ENABLED` | **`false`** | Hides footer donation QR and disables donate API |
| `ADMIN_LOGIN_SLUG` | `040903` | Secret URL: `/admin/040903` |

### Optional for MVP

- **Resend** — only needed when enrollment emails go live
- **S3/R2** — avatar uploads; without it, files save to `public/uploads/` (ephemeral on most hosts — prefer S3 for prod)
- **Discord worker** — live chat/presence; homepage works without it
- **Stripe / donations** — hidden when `NEXT_PUBLIC_DONATIONS_ENABLED=false` (recommended for MVP)

### What you do once (checklist)

1. **Neon** — create project, copy pooled + direct connection strings
2. **Google Cloud** — OAuth client with production redirect URI
3. **Deploy host** — connect GitHub repo, set env vars above
4. **Run migrations** (once per schema change):
   ```bash
   npm run db:push
   ```
   Use `DATABASE_URL_UNPOOLED` if pooled URL times out on DDL.
5. **Do not run `db:seed` on production** if you already migrated data — it can overwrite. Add members via Admin → Members → **Add member to homepage**.
6. Bookmark **`https://yourdomain.com/admin/{ADMIN_LOGIN_SLUG}`** — there is no public link to admin login.
7. After deploy: edit **Site Settings**, add roster members, confirm homepage decks (Upper / Lower Lodus).

### Turning on full member features later

Set `NEXT_PUBLIC_MEMBER_AUTH_ENABLED=true` and redeploy. Member login, Apply, Social, Broadcast, and Leaderboard tabs return for approved members.

### Turning on donations later

1. Set `NEXT_PUBLIC_DONATIONS_ENABLED=true` and redeploy.
2. Add `STRIPE_SECRET_KEY` (test or live) and ensure `AUTH_URL` matches your domain.
3. The footer shows the **$1 support QR** again (Stripe Checkout in INR at live FX rate).

Native UPI QR (GPay-style, env-based VPA) is planned but not built yet — today donations go through Stripe only.

---

## Free $0 deployment options

All of these can host the Next.js app at no cost for a small MVP. You already use **Neon free tier** for PostgreSQL (separate from the host).

| Platform | Cost | Pros | Caveats |
|----------|------|------|---------|
| **[Vercel](https://vercel.com) Hobby** | $0 | Best Next.js support, auto HTTPS, preview deploys | Serverless; long-running Discord bot needs a separate worker |
| **[Render](https://render.com) Free Web Service** | $0 | Simple Node deploy, custom domain | Spins down after ~15 min idle (cold starts); 750 hrs/mo |
| **[Railway](https://railway.app)** | $5/mo credit (often enough for tiny apps) | Easy Postgres + app in one place | Credit-based; may exceed free tier if always-on |
| **[Fly.io](https://fly.io)** | Free allowance | Full VM, good for worker + web | More setup; credit limits apply |

**Recommended stack for Lodus MVP:** **Vercel (web)** + **Neon (DB you have)** + optional **Render/Fly free tier** for `services/discord-worker` if you need live Discord chat.

Cloudflare Pages can host Next.js but requires extra adapter work — Vercel is simpler for this repo.

---

## Prerequisites (full app)

- PostgreSQL database (`DATABASE_URL`)
- Resend account (`RESEND_API_KEY`, `RESEND_FROM`) when email flows are enabled
- Production `AUTH_URL` (HTTPS)
- Optional: S3/R2 for avatars, Discord worker service

## Neon (recommended)

1. Create a project at [neon.tech](https://neon.tech) (PostgreSQL 16).
2. In **Connection details**, copy two strings into your host env:
   - **Pooled connection** → `DATABASE_URL` (used by `npm run dev` / production app)
   - **Direct connection** → `DATABASE_URL_UNPOOLED` (used by `drizzle-kit push` / `migrate`)

```env
DATABASE_URL=postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://...@ep-xxx....neon.tech/neondb?sslmode=require
```

The app uses `pg` + Drizzle (`node-postgres`). No extra Neon driver is required. SSL is enabled automatically for `*.neon.tech` hosts.

## Local PostgreSQL (optional)

```bash
docker compose up -d
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lodus
```

## Database migrations

```bash
npm run db:push
```

Run `db:seed` only on a **fresh** local database. On production with migrated data, use the admin **Add member** flow instead.

### Import from legacy SQLite (`data/lodus.db`)

Merges users, members, site content (including homepage section titles), games, resources, audit logs — without wiping existing Neon rows:

```bash
node --env-file=.env.local node_modules/tsx/dist/cli.mjs src/scripts/migrate-sqlite-to-pg.ts
```

Or: `npm run db:migrate-sqlite` (ensure `.env.local` is loaded; use the `node --env-file` form on Windows if needed).

On deploy, run `db:push` against Neon **before** the app serves traffic. Use `DATABASE_URL_UNPOOLED` when running migrations locally if the pooled URL times out on DDL.

## Email (Resend only)

```env
RESEND_API_KEY=re_xxxx
RESEND_FROM=Lodus <onboarding@yourdomain.com>
```

SMTP is no longer supported.

## Discord worker (recommended for production)

1. Set on the **web** service:

```env
DISCORD_WORKER_MODE=true
INTERNAL_API_SECRET=your-long-random-secret
LODUS_API_URL=https://your-domain.com
```

2. Run **services/discord-worker** as a second process with the same env + `DISCORD_BOT_TOKEN` and `NEXT_PUBLIC_DISCORD_GUILD_ID`:

```bash
cd services/discord-worker && npm install && npm start
```

Without the worker, set `DISCORD_WORKER_MODE=false` to use the embedded bot (dev only).

## Object storage (optional)

When `S3_BUCKET` and `S3_ACCESS_KEY_ID` are set, avatars upload to S3/R2. Otherwise files save to `public/uploads/`.

On Vercel/Render, local disk is not persistent — use S3/R2 for production avatar uploads.
