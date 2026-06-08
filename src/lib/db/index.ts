import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Creates a Neon HTTP database connection.
 *
 * This app shares the SAME database as the main marketing site
 * (iode / Vidyavasal). Point DATABASE_URL at the same connection string.
 */
function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. " +
        "Copy .env.example to .env.local and fill in your NeonDB connection string " +
        "(the SAME one used by the main site)."
    );
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/** Singleton database instance — the connection is reused across imports. */
export const db = createDb();

export { schema };
export type Database = typeof db;
