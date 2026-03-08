#!/usr/bin/env node
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

config({ path: ".env.local" });

const agentSeed = [
  {
    id: "cask",
    name: "Cask Scribe",
    status: "running",
    directive: "Archive reset summary for 12:00 ET",
    progress: 0.68,
    checkpoint: "Next ping · 12:00",
    stream: "Ops",
    icon: "✍️",
  },
  {
    id: "draft",
    name: "Draftwright",
    status: "running",
    directive: "Scaffold War Room UI (tiles + ticker)",
    progress: 0.42,
    checkpoint: "Layout review · 13:30",
    stream: "Product",
    icon: "🧱",
  },
  {
    id: "neon",
    name: "Neon Bard",
    status: "idle",
    directive: "Waiting for tile components",
    progress: 0,
    checkpoint: "Queued",
    stream: "Comms",
    icon: "💡",
  },
  {
    id: "sentinel",
    name: "Cellar Sentinel",
    status: "idle",
    directive: "Next check at 02:00 (night watch)",
    progress: 0,
    checkpoint: "Scheduled",
    stream: "Infra",
    icon: "🛰️",
  },
];

const objectiveSeed = [
  {
    label: "Deploy neutral War Room shell",
    owner: "Draftwright",
    stream: "Product",
    status: "In flight",
  },
  {
    label: "Wire mock data to Supabase tables",
    owner: "Cask Scribe",
    stream: "Ops",
    status: "Next",
  },
  {
    label: "Prep agent-event writer script",
    owner: "Cellar Sentinel",
    stream: "Infra",
    status: "Next",
  },
  {
    label: "Copy sweep for dashboard tiles",
    owner: "Neon Bard",
    stream: "Comms",
    status: "Blocked",
  },
];

const eventSeed = [
  {
    agent: "Draftwright",
    message: "Initialized Next.js app (Tailwind, TS) for jansworkspace.net",
  },
  {
    agent: "Cask Scribe",
    message: "Logged agent roster + War Room spec into docs",
  },
  {
    agent: "Neon Bard",
    message: "Outlined hero + section copy blocks (awaiting layout)",
  },
  {
    agent: "Cellar Sentinel",
    message: "Cron swap confirmed (Archive reset reminders firing)",
  },
  {
    agent: "Tap Hunter",
    message: "No run scheduled · standing by",
  },
];

const pgConnection = process.env.SUPABASE_DB_URL;

async function seedViaPostgres() {
  const pool = new Pool({ connectionString: pgConnection, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query("begin");

    for (const agent of agentSeed) {
      await client.query(
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
          agent.id,
          agent.name,
          agent.status,
          agent.directive,
          agent.progress,
          agent.checkpoint,
          agent.stream,
          agent.icon,
        ]
      );
    }

    await client.query("delete from public.war_room_objectives");
    for (const objective of objectiveSeed) {
      await client.query(
        `insert into public.war_room_objectives (label, owner, stream, status)
         values ($1, $2, $3, $4)`,
        [objective.label, objective.owner, objective.stream, objective.status]
      );
    }

    await client.query("delete from public.war_room_events");
    for (const event of eventSeed) {
      await client.query(
        `insert into public.war_room_events (agent, message)
         values ($1, $2)`,
        [event.agent, event.message]
      );
    }

    await client.query("commit");
    console.log("Seeded War Room data via Postgres");
  } catch (error) {
    await client.query("rollback");
    console.error("Failed to seed via Postgres", error);
    process.exitCode = 1;
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedViaSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase URL/service role key.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { error: agentError } = await supabase.from("war_room_agents").upsert(agentSeed);
  if (agentError) {
    throw agentError;
  }

  const { error: objectiveError } = await supabase.from("war_room_objectives").upsert(objectiveSeed);
  if (objectiveError) {
    throw objectiveError;
  }

  await supabase.from("war_room_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: eventError } = await supabase.from("war_room_events").insert(eventSeed);
  if (eventError) {
    throw eventError;
  }

  console.log("Seeded War Room data via Supabase REST");
}

(async () => {
  if (pgConnection) {
    try {
      await seedViaPostgres();
      return;
    } catch (error) {
      console.warn("Postgres seeding failed, falling back to Supabase REST", error.message);
    }
  }

  await seedViaSupabase();
})();
