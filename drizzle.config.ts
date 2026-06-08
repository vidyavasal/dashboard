import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // IMPORTANT: this app shares its database with the main marketing site
  // (iode / Vidyavasal). Use a dedicated migrations journal table so the two
  // Drizzle codebases never clobber each other's migration history.
  migrations: {
    table: "__drizzle_migrations_tracker",
    schema: "public",
  },
});
