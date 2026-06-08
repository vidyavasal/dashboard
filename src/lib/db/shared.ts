import { pgTable, uuid, varchar, text, boolean } from "drizzle-orm/pg-core";

// ============================================================================
// READ-ONLY declarations of tables OWNED BY THE MAIN SITE (iode / Vidyavasal).
//
// These live in a separate file that drizzle.config.ts does NOT include, so
// drizzle-kit never tries to create/alter/drop them when generating tracker
// migrations. We only ever SELECT from them (and write to admin_users never).
// Columns are a minimal subset — just what the tracker reads.
// ============================================================================

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }),
});

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 100 }),
  isActive: boolean("is_active"),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  universityId: uuid("university_id"),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 100 }),
});
