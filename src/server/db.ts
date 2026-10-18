import "server-only";

import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

function isLocalDatabase(connectionString: string): boolean {
  return /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const local = isLocalDatabase(connectionString);
    const serverless = Boolean(process.env.VERCEL) || connectionString.includes("pooler.supabase.com");
    pool = new Pool({
      connectionString: local
        ? connectionString
        : connectionString.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, ""),
      max: serverless ? 1 : 10,
      ssl: local ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function withUser<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
