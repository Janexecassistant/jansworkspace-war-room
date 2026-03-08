import { Pool } from "pg";

const connectionString = process.env.SUPABASE_DB_URL;

function buildPool(connection?: string) {
  if (!connection) return null;
  const url = new URL(connection);
  return new Pool({
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export const pgPool = buildPool(connectionString);
