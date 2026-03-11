import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "pg";

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("SUPABASE_DB_URL is missing. Populate it in .env.local before running this script.");
  process.exit(1);
}

const tables = [
  "public.war_room_agents",
  "public.war_room_objectives",
  "public.war_room_events",
];

async function enableRealtime() {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    for (const table of tables) {
      try {
        await pool.query(`alter publication supabase_realtime add table ${table};`);
        console.log(`Added ${table} to supabase_realtime publication.`);
      } catch (error) {
        if (error.message?.includes("is already a member")) {
          console.log(`${table} already subscribed to supabase_realtime; skipping.`);
        } else {
          throw error;
        }
      }
    }
  } finally {
    await pool.end();
  }
}

enableRealtime()
  .then(() => {
    console.log("Realtime publication check complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to update supabase_realtime publication", error);
    process.exit(1);
  });
