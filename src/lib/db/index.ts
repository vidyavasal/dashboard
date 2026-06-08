import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as trackerSchema from "./schema";
import * as externalSchema from "./external";

// Tracker-owned tables + the main site's mirrored content/auth tables. Both are
// registered so the runtime db is fully typed for content CRUD, even though
// drizzle-kit only ever migrates the tracker-owned tables (./schema.ts).
const schema = { ...trackerSchema, ...externalSchema };

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
