# War Room Console

Live telemetry board for the Merch on Tap agent roster. Built with Next.js 16 (App Router), Tailwind v4, Supabase, and optional direct Postgres fallback for low-latency reads/writes.

## Stack

- **Frontend:** Next.js 16 / React 19, Tailwind 4
- **Data:** Supabase (tables + RPC), optional pooled Postgres connection via `SUPABASE_DB_URL`
- **Scripts:** Node utilities for logging agent events and seeding baseline data

## Environment variables

Create `.env.local` with the following keys:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DB_URL=postgresql://<user>:<pass>@<host>:<port>/<db> # optional, enables pg fallback + faster writer
```

The service role key is only used locally for scripts (agent logger + seed). Never expose it to the browser or Vercel.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. The UI will attempt to call the `war_room_snapshot` RPC first, then fall back to direct Supabase selects, then to pooled Postgres, and finally to mock data if everything else fails.

## Supabase setup

1. Run the migrations (in order):
   - `supabase/migrations/202603071445_war_room_tables.sql`
   - `supabase/migrations/202603080710_war_room_policies.sql`
2. Enable IPv4 pooled connections in Supabase (e.g. `aws-1-us-east-2.pooler.supabase.com:6543`) and drop the URL into `SUPABASE_DB_URL` once the password is confirmed.
3. After the tables exist, seed the dashboard data:

```bash
npm run seed:war-room
```

The script prefers the pooled Postgres connection; if that fails, it falls back to Supabase REST using the service role key.

4. Log new events or update agent directives on demand:

```bash
npm run log:agent -- \
  --agent "Draftwright" \
  --message "Snapshot RPC online" \
  --status running \
  --progress 0.78 \
  --checkpoint "Deploy review · 09:30" \
  --stream Product
```

## Deployment checklist

1. Push to GitHub / Vercel and set the production env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. (Optional) Add `SUPABASE_DB_URL` if you want server-side fallback inside Vercel functions.
3. Provide the service role key only to CI/seeding environments—not to the runtime.
4. Point `jansworkspace.net` (or the desired domain) at the Vercel project once the preview build is clean.

## Troubleshooting

- **Password auth failures:** regenerate the pooled password inside Supabase, update `.env.local`, and retry `npm run seed:war-room`.
- **RPC returns null:** ensure `war_room_snapshot` exists (see migrations) and that the caller role (anon) has `EXECUTE` permission.
- **UI stuck on mock data:** confirm at least one of the data providers (RPC, `select`, pgPool) succeeds. Check server logs for Supabase errors.
