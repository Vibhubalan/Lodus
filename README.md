# Lodus

Public website for the **Lodus** friend group — scroll homepage, library, games registry, and a member admin area.

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Member login (dev)

With `AUTH_DEV_MODE=true` in `.env.local`, use **Member login** and sign in with an email from `ALLOWED_EMAILS` (e.g. `admin@lodus.local`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:setup` | Push schema + seed data |

## Env

Copy `.env.example` to `.env.local`. See file for `AUTH_SECRET`, `ALLOWED_EMAILS`, OAuth keys.
