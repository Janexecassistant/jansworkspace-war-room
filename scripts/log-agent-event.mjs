#!/usr/bin/env node
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

config({ path: ".env.local" });

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!key?.startsWith("--") || typeof value === "undefined") {
      continue;
    }
    out[key.replace(/^--/, "")] = value;
  }
  return out;
};

const options = parseArgs();

const { agent, message, status, directive, stream, checkpoint } = options;
const progress = options.progress ? Number(options.progress) : undefined;

if (!agent || !message) {
  console.error("Usage: npm run log:agent -- --agent 'Draftwright' --message 'Completed UI scaffold' [--status running] [--directive text] [--progress 0.4]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pgConnection = process.env.SUPABASE_DB_URL;

const agentId = agent.toLowerCase().replace(/\s+/g, "-");
const payload = {
  id: agentId,
  name: agent,
  status: status ?? "running",
  directive: directive ?? message,
  progress: typeof progress === "number" && !Number.isNaN(progress) ? progress : 0,
  stream: stream ?? "Ops",
  checkpoint: checkpoint ?? "",
  icon: undefined,
};

if (pgConnection) {
  const url = new URL(pgConnection);
  const pool = new Pool({
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false },
  });

  let wroteViaPostgres = false;
  try {
    await pool.query(
      `insert into public.war_room_agents (id, name, status, directive, progress, checkpoint, stream, icon)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         status = excluded.status,
         directive = excluded.directive,
         progress = excluded.progress,
         checkpoint = excluded.checkpoint,
         stream = excluded.stream,
         icon = excluded.icon,
         updated_at = timezone('utc', now())`,
      [
        payload.id,
        payload.name,
        payload.status,
        payload.directive,
        payload.progress,
        payload.checkpoint,
        payload.stream,
        payload.icon ?? null,
      ]
    );

    await pool.query(
      `insert into public.war_room_events (agent, message) values ($1, $2)`,
      [agent, message]
    );

    console.log(`Logged event for ${agent} via Postgres`);
    wroteViaPostgres = true;
  } catch (error) {
    console.warn("Postgres logging failed, falling back to Supabase REST", error.message ?? error);
  } finally {
    await pool.end();
  }

  if (wroteViaPostgres) {
    process.exit(0);
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const [{ error: agentError }, { error: eventError }] = await Promise.all([
  supabase.from("war_room_agents").upsert(payload),
  supabase.from("war_room_events").insert({ agent, message }),
]);

if (agentError || eventError) {
  console.error("Failed to log event", { agentError, eventError });
  process.exit(1);
}

console.log(`Logged event for ${agent}`);
