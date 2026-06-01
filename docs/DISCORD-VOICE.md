# Discord voice on production

## How it works

| Feature | Source |
|---------|--------|
| Voice channel **names** | Discord REST (`/api/discord/voice`) |
| **Who is in VC** | `services/discord-worker` → POST `/api/internal/discord/presence` → **Neon** table `discord_voice_snapshot` |

`DISCORD_WORKER_MODE=true` on Vercel stops `discord.js` from running inside serverless (prevents crashes). The worker runs elsewhere and pushes presence to your database.

## Your action items

### 1. Database (once)

From project root:

```bash
npm run db:push
```

Creates table `discord_voice_snapshot` on Neon.

### 2. Vercel environment variables

**Settings → Environment Variables → Production:**

| Variable | Value |
|----------|--------|
| `DISCORD_WORKER_MODE` | `true` |
| `DISCORD_BOT_TOKEN` | From `.env.local` |
| `NEXT_PUBLIC_DISCORD_CHANNEL_ID` | From `.env.local` |
| `NEXT_PUBLIC_DISCORD_GUILD_ID` | `867804143543517194` (optional if channel id set) |
| `DATABASE_URL` | Neon pooled URL (already set) |
| `INTERNAL_API_SECRET` | Generate (see below) |
| `LODUS_API_URL` | `https://lodus-one.vercel.app` |

Generate secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Redeploy** after saving.

### 3. Run the Discord worker (24/7)

**Quick test on your PC** (add to `.env.local` first):

```env
INTERNAL_API_SECRET=paste-same-as-vercel
LODUS_API_URL=https://lodus-one.vercel.app
```

Then:

```powershell
cd F:\Projects\Lodus
npm run discord-worker
```

Leave running. You should see `[discord-worker] Connected as ...`. No `Push failed (401)` in logs.

**Production:** deploy the same worker on [Render](https://render.com) (Background Worker) with env:

- `DISCORD_BOT_TOKEN`
- `NEXT_PUBLIC_DISCORD_GUILD_ID`
- `INTERNAL_API_SECRET` (same as Vercel)
- `LODUS_API_URL=https://lodus-one.vercel.app`

Start command: `node services/discord-worker/index.mjs`  
Root: repo root or `services/discord-worker` (run `npm install` there if needed).

### 4. Verify

1. Join a voice channel in Discord.
2. Open `https://lodus-one.vercel.app` → Community section.
3. Voice cards should show channel names **and** member avatars.

Optional: `curl.exe -sD - "https://lodus-one.vercel.app/api/discord/voice" -o NUL` → header `x-lodus-voice-stage: ok`.

## Local dev

```env
DISCORD_WORKER_MODE=false
```

```powershell
npm run dev
```

Embedded bot fills presence (DB + file). No separate worker needed locally.
