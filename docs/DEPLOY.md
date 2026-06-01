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

## Discord on Vercel (required)

On **Vercel**, always set on the web app (Production):

```env
DISCORD_WORKER_MODE=true
```

This stops `discord.js` from starting inside serverless functions (it crashes and breaks `/api/discord/voice`). The homepage still loads **voice channel names** via Discord REST. Chat uses the same `DISCORD_BOT_TOKEN` + channel id as before.

Also set: `DISCORD_BOT_TOKEN`, `NEXT_PUBLIC_DISCORD_CHANNEL_ID`, `NEXT_PUBLIC_DISCORD_GUILD_ID` (or rely on guild id resolved from the chat channel).

**Local dev:** leave `DISCORD_WORKER_MODE=false` (or unset) so the embedded bot runs with `npm run dev`.

## Discord worker (optional — live “who is in VC”)

For avatars in voice cards when people are connected, run a **second** long-lived process:

1. On **Vercel** (same values as worker):

```env
DISCORD_WORKER_MODE=true
INTERNAL_API_SECRET=your-long-random-secret
LODUS_API_URL=https://your-domain.com
```

2. On **Render / Fly / your PC** — `services/discord-worker` with `DISCORD_BOT_TOKEN`, `NEXT_PUBLIC_DISCORD_GUILD_ID`, `INTERNAL_API_SECRET`, `LODUS_API_URL`:

```bash
cd services/discord-worker && npm install && npm start
```

You do **not** need the separate worker just to show voice channel names — only for live presence updates.

Presence is stored in Neon (`discord_voice_snapshot`) so all Vercel instances see the same data. See **[DISCORD-VOICE.md](./DISCORD-VOICE.md)** for step-by-step action items.

## Object storage (optional)

When `S3_BUCKET` and `S3_ACCESS_KEY_ID` are set, avatars upload to S3/R2. Otherwise files save to `public/uploads/`.

On Vercel/Render, local disk is not persistent — use S3/R2 for production avatar uploads.

---

## Troubleshooting

### Google OAuth: `Error 400: redirect_uri_mismatch`

NextAuth sends Google a callback URL built from **`AUTH_URL`** on the server:

`{AUTH_URL}/api/auth/callback/google`

**Fix (no code change):**

1. **Vercel → Project → Settings → Environment Variables (Production)**  
   Set `AUTH_URL` to your exact public origin, **no trailing slash**, e.g.  
   `https://lodus-one.vercel.app`

2. **Google Cloud Console → APIs & Credentials → your OAuth client → Authorized redirect URIs**  
   Add the **same** URI (must match character-for-character):

   `https://lodus-one.vercel.app/api/auth/callback/google`

3. If you use a custom domain later, add that domain’s callback too and update `AUTH_URL` to match.

4. **Redeploy** Vercel after changing `AUTH_URL`.

`DISCORD_WORKER_MODE` does **not** affect Google login.

**Note:** `ADMIN_EMAIL` on Vercel must match the Gmail you sign in with (check spelling).

---

### Upper / Lower Lodus sections missing on homepage

These decks are **not** controlled by `DISCORD_WORKER_MODE`. They come from **Neon** (`users` + `members`) and **Site Settings → homepage JSON**.

| Symptom | Likely cause |
|--------|----------------|
| Whole `#team` block gone (no titles at all) | **Hide section** checked for Leadership and/or Team in Site Settings (stored in `homepageJson`) |
| Section titles show but no cards | No roster rows on **production** DB, or nobody has **Show in leadership** / **Show in team** |
| Works locally, empty on prod | Vercel `DATABASE_URL` points at a **different/empty** Neon branch than local `.env.local` |

**Checks:**

1. Open prod in **Incognito** (logged out) — `https://lodus-one.vercel.app`
2. Compare Vercel `DATABASE_URL` with the Neon project where you added members locally (same host `ep-...`?).
3. After you can sign in as admin again: **Site** tab → Leadership / Team → ensure **Hide section** is unchecked; titles can be “Upper Lodus” / “Lower Lodus”.
4. **Members** tab → each person → **Show in leadership deck** / **Show in team deck**.

Re-add members on prod if the production database never had them (admin **Add member to homepage**).
