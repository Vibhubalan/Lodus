# Lodus — Architecture

**Last updated:** May 2026

This document describes how Lodus is built and how its major subsystems fit together. For step-by-step verification rules, see [verification-flows.md](./verification-flows.md). For deployment, see [DEPLOY.md](./DEPLOY.md).

---

## 1. Overview

Lodus is a private gaming community portal: membership applications, staff approval, member profiles, a public roster, shared library, games registry, social feed, Discord integration, and an admin hub. The app is a **Next.js 16** App Router project with **PostgreSQL** (Drizzle ORM), **NextAuth v5** (JWT sessions, no database adapter), and **Resend** for transactional email.

---

## 2. Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | NextAuth v5 — JWT strategy, custom `users` table |
| Database | PostgreSQL + Drizzle ORM + `pg` pool |
| Email | Resend HTTP API only (dev: console fallback) |
| Styling | Tailwind CSS v4 |
| Passwords | bcryptjs |
| Discord | discord.js v14 (voice + chat); optional worker process |
| Uploads | S3-compatible (R2) or `public/uploads/` fallback |
| Payments | Stripe Checkout (donations) |
| Tests | Vitest (unit tests for permissions / staff gates) |

`next.config.ts` marks `discord.js`, `@discordjs/ws`, and `pg` as server externals. Server Actions body limit is 6MB (avatars).

---

## 3. Application structure

### 3.1 Public routes

- **`/`** — Marketing home when logged out; member/admin **hub** when logged in (`?tab=`).
- **`/library`**, **`/games`** — Static-ish content pages (ISR `revalidate = 3600`).
- **`/login`** — Auth gateway: member sign-in, sign-up (application), forgot password, admin Gmail OAuth tab.

### 3.2 Member routes

- **`/profile`** — Settings, avatar, phone verify OTP, password reset OTP, Discord link, delete account.
- **`/profile/setup`** — Mandatory onboarding after approval (phone, birthdate, avatar, games, custom password).
- **`/login/complete`** — OAuth users missing phone before `pending_review`.

### 3.3 Hub tabs (`src/lib/hub-tabs.ts`)

Logged-in users land on **`/`** with tabs:

| Tab | Audience | Notes |
|-----|----------|--------|
| `social` | Members | Feed + Discord chat preview |
| `members` | Members | Directory / roster |
| `broadcast` | Staff | UI placeholder (mock data kept by design) |
| `leaderboard` | Staff | UI placeholder (mock data kept by design) |
| `approvals` | Approvers | Pending applications |
| `roles` | Admin | Custom roles + permissions |
| `audit` | Admin | Audit log |
| `site` | Admin | CMS / homepage content |

Access: `canAccessAdminHub()`, `canApproveMembers()`, and `isAdminEmail()` / `roleSlug === "admin"` for full admin tabs.

### 3.4 Legacy `/admin` routes

Most routes under **`/admin/*`** are thin **redirects** to `/?tab=...` or `/`. Server actions remain in `src/app/admin/`. Exceptions:

- **`/admin/approvals`** — Standalone page (same component as hub approvals tab).
- **`/admin/layout.tsx`** — Requires session; middleware also protects `/admin/:path*`.

The dead **`/admin/ips`** route (whitelist tab) was removed; there is no IP whitelist feature.

### 3.5 API routes (selected)

| Route | Role |
|-------|------|
| `/api/auth/[...nextauth]` | NextAuth |
| `/api/auth/verify-email` | Email verification link |
| `/api/auth/application/decision` | Approve/reject from email |
| `/api/admin/direct-approve` | One-click approve from admin alert |
| `/api/profile/discord/*` | Discord profile linking (not login) |
| `/api/discord/voice` | Voice channel presence |
| `/api/internal/discord/presence` | Worker → app presence push |
| `/api/presence/ping` | Updates `users.lastSeenAt` |

---

## 4. Authentication

### 4.1 No Drizzle adapter

Sessions are **JWT-only**. User records live in the custom **`users`** table. There is no NextAuth `accounts` / `sessions` table.

### 4.2 Providers

1. **Credentials** — email + password (`users.passwordHash`, bcrypt).
2. **Google OAuth** — member sign-in and admin sign-in (separate flows).

Discord OAuth is **profile linking only** (`DISCORD_CLIENT_*`), not a login provider.

### 4.3 Session enrichment

`jwt` and `session` callbacks attach `roleSlug`, `status`, and `needsProfile` from `getUserWithRole(email)`.

### 4.4 Login gates

`canUserLogin()` blocks rejected users, unverified applicants, and non-approved members ( **`ADMIN_EMAIL`** bypasses for portal admin).

### 4.5 Staff emails (env)

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Portal staff Gmail: **Admin** tab login, approval emails, delete members, full permissions |

### 4.6 Post-login routing

- **`needsProfile`** (missing phone, birthdate, or custom password) → `/profile/setup` (non-admin).
- Admin Gmail OAuth sets `lodus_admin_oauth` cookie and upserts user with admin role.

---

## 5. Membership lifecycle

```
Apply (Gmail) → email_verify link → pending_review → staff approve
  → welcome email with temporary OTP password → login → /profile/setup → hub
```

- **Application:** `submitMemberApplication` — Gmail validation + MX check.
- **Approval:** Dashboard or email tokens; `approveUser()` uses optimistic locking on `pending_review`.
- **Password:** Member signs in with emailed OTP, then sets a custom password via **Profile → Security** (OTP to email).
- **Admin-assisted reset:** Staff sends OTP from member profile modal (`sendPasswordResetOTP`); member completes reset in Profile or forgot-password on login.
- **Self-service forgot password:** Login tab → email OTP → new password.

Token types are stored in **`auth_tokens`** (see schema).

---

## 6. Database

### 6.1 Connection

`DATABASE_URL` is **required** at runtime (`src/lib/db/index.ts`). Production: **Neon** pooled URL; optional `DATABASE_URL_UNPOOLED` for Drizzle migrations. Local dev: `docker compose up -d` or Neon.

### 6.2 Core tables

| Table | Purpose |
|-------|---------|
| `roles` | System + custom roles, JSON permissions |
| `users` | Auth + profile + approval workflow |
| `auth_tokens` | One-time links and OTPs |
| `members` | Public roster display (linked by email) |
| `audit_logs` | Staff actions |
| `site_content` | Homepage CMS |
| `resources`, `games`, `member_games` | Library and games |
| `social_posts`, `daily_plans`, `daily_plan_acceptances` | Hub features |

Migrations: `drizzle/` via `npx drizzle-kit generate` / `push` / `migrate`. Seed: `npm run db:seed` (system roles, owner/admin users, sample content).

### 6.3 Dual record model

- **`users`** — authentication and canonical profile fields.
- **`members`** — roster-facing row (bio, socials, team flags). Synced on approval and profile updates.

---

## 7. Email (Resend)

- **Provider:** `src/lib/email/providers.ts` — Resend REST API.
- **Production:** `RESEND_API_KEY` and `RESEND_FROM` required.
- **Development:** Without API key, payloads log to the server console.
- **Templates:** Warm minimal HTML + plain text (`src/lib/email/template.ts`).
- **Link base URL:** `AUTH_URL` (must be HTTPS in production — localhost links hurt deliverability).

SMTP is not supported.

---

## 8. Discord

### 8.1 Profile linking

OAuth connects Discord to an existing account; tokens type `discord_link`.

### 8.2 Bot features

Voice channel tracking, optional chat webhook (`DISCORD_CHAT_WEBHOOK_URL` or auto-created), public guild/channel IDs via `NEXT_PUBLIC_DISCORD_*`.

### 8.3 Worker vs embedded

| Mode | When | Behavior |
|------|------|----------|
| **Worker** | `DISCORD_WORKER_MODE=true` (production) | `services/discord-worker` runs bot; POSTs presence to `/api/internal/discord/presence` |
| **Embedded** | Worker off + `DISCORD_BOT_TOKEN` (dev) | `instrumentation.ts` starts `voice-tracker` inside Next.js |

Production should use the worker so the web process does not hold the bot connection.

---

## 9. File uploads

`saveImage()` in `src/lib/uploads/save-image.ts`:

- If `S3_BUCKET` + `S3_ACCESS_KEY_ID` → upload to S3/R2 (`S3_ENDPOINT`, `S3_PUBLIC_URL`).
- Else → `public/uploads/` via `savePublicImage()`.

Max 5MB; JPG/PNG/WebP/GIF.

---

## 10. Environment variables

See [`.env.example`](../.env.example). Critical groups:

- **Auth:** `AUTH_SECRET`, `AUTH_URL`
- **Staff:** `ADMIN_EMAIL`
- **OAuth:** `GOOGLE_*`, `DISCORD_CLIENT_*` (link only)
- **DB:** `DATABASE_URL`
- **Email:** `RESEND_*`
- **Discord bot/worker:** `DISCORD_BOT_TOKEN`, `DISCORD_WORKER_MODE`, `INTERNAL_API_SECRET`, `LODUS_API_URL`
- **Storage:** `S3_*` (optional)
- **Stripe:** `STRIPE_SECRET_KEY`

`DATABASE_PATH` and SMTP variables are obsolete after the PostgreSQL / Resend migration.

---

## 11. Deployment topology

```
┌─────────────────┐     ┌──────────────────┐
│  Next.js (web)  │────▶│   PostgreSQL     │
└────────┬────────┘     └──────────────────┘
         │
         │  Resend API
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Discord worker  │────▶│  Discord Gateway │
│  (optional)     │     └──────────────────┘
└─────────────────┘
         │
         ▼
   S3 / R2 (avatars, optional)
```

See [DEPLOY.md](./DEPLOY.md) for Railway/Render steps.

---

## 12. Testing

- `npm run test` — Vitest unit tests (`permissions`, `staff` gates).
- Integration tests against a live DB are not yet automated; use `npm run db:seed-test` for manual QA accounts.

---

## 13. Key source locations

| Area | Path |
|------|------|
| Schema | `src/lib/db/schema.ts` |
| DB client | `src/lib/db/index.ts` |
| Auth | `src/lib/auth.ts`, `src/lib/auth.config.ts` |
| User / tokens | `src/lib/auth/user-service.ts` |
| Staff rules | `src/lib/auth/staff.ts` |
| Email | `src/lib/email/` |
| Discord | `src/lib/discord/`, `services/discord-worker/` |
| Hub UI | `src/components/hub/`, `src/lib/hub-tabs.ts` |
| Seed | `src/scripts/seed.ts` |
