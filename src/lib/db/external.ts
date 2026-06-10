import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ============================================================================
// EXTERNAL MIRROR — tables OWNED BY THE MAIN SITE (iode / Vidyavasal).
//
// The tracker shares one Neon DB with the main site. These definitions mirror
// the main site's content + auth tables so the tracker can CRUD them at
// runtime, but this file is intentionally NOT referenced by drizzle.config.ts,
// so drizzle-kit never creates/alters/drops them. Tracker-owned tables live in
// ./schema.ts. If the main site changes one of these tables, update it here by
// hand to match (see PLAN.md → "Schema ownership rule").
//
// Columns are copied from the main site's src/lib/db/schema.ts.
// ============================================================================

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const universities = pgTable(
  "universities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    shortName: varchar("short_name", { length: 100 }),
    slug: varchar("slug", { length: 255 }).unique(),
    logoUrl: text("logo_url"),
    bannerImage: text("banner_image"),
    galleryImages: text("gallery_images").array(),
    highlights: jsonb("highlights"), // { naac, established, approvals, students, accreditation }
    content: text("content"), // markdown brochure body
    website: text("website"),
    universityType: varchar("university_type", { length: 100 }),
    country: varchar("country", { length: 100 }).default("India"),
    state: varchar("state", { length: 100 }),
    city: varchar("city", { length: 100 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_universities_slug").on(table.slug)]
);

export const courseCategories = pgTable("course_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    universityId: uuid("university_id"),
    categoryId: uuid("category_id"),
    name: varchar("name", { length: 255 }).notNull(),
    shortName: varchar("short_name", { length: 100 }),
    slug: varchar("slug", { length: 255 }),
    courseType: varchar("course_type", { length: 100 }),
    deliveryMode: varchar("delivery_mode", { length: 100 }),
    durationYears: numeric("duration_years", { precision: 4, scale: 2 }),
    totalSemesters: integer("total_semesters"),
    eligibility: text("eligibility"),
    description: text("description"),
    content: text("content"), // markdown brochure body
    bannerImage: text("banner_image"),
    isOnline: boolean("is_online").default(true),
    isDistance: boolean("is_distance").default(false),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_courses_university").on(table.universityId),
    index("idx_courses_category").on(table.categoryId),
  ]
);

export const courseFeeStructures = pgTable(
  "course_fee_structures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id"),
    registrationFee: numeric("registration_fee", {
      precision: 10,
      scale: 2,
    }).default("0"),
    admissionFee: numeric("admission_fee", { precision: 10, scale: 2 }).default(
      "0"
    ),
    courseFee: numeric("course_fee", { precision: 10, scale: 2 }).default("0"),
    examFee: numeric("exam_fee", { precision: 10, scale: 2 }).default("0"),
    yearlyFee: numeric("yearly_fee", { precision: 10, scale: 2 }),
    totalFee: numeric("total_fee", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 10 }).default("INR"),
    emiAvailable: boolean("emi_available").default(false),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_course_fee_total").on(table.totalFee)]
);

export const courseFeeBreakdowns = pgTable("course_fee_breakdowns", {
  id: uuid("id").primaryKey().defaultRandom(),
  feeStructureId: uuid("fee_structure_id"),
  label: varchar("label", { length: 100 }),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Analytics / tracking tables (also main-site owned) ───────────────────────
// Mirrors the main site's visitors / page_views / leads tables so the tracker
// panel can READ them for the analytics dashboard. Read-only from here.

export const visitors = pgTable("visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  country: varchar("country", { length: 2 }),
  city: varchar("city", { length: 120 }),
  region: varchar("region", { length: 120 }),
  device: varchar("device", { length: 20 }),
  browser: varchar("browser", { length: 60 }),
  os: varchar("os", { length: 60 }),
  referrer: text("referrer"),
  landingPath: text("landing_path"),
  utmSource: varchar("utm_source", { length: 120 }),
  utmMedium: varchar("utm_medium", { length: 120 }),
  utmCampaign: varchar("utm_campaign", { length: 120 }),
  visitCount: integer("visit_count").default(1),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const pageViews = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorId: uuid("visitor_id"),
  event: varchar("event", { length: 40 }).default("page_view"),
  path: text("path"),
  entityType: varchar("entity_type", { length: 20 }),
  entityId: uuid("entity_id"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  message: text("message"),
  source: varchar("source", { length: 60 }),
  status: varchar("status", { length: 30 }).default("new"),
  visitorId: uuid("visitor_id"),
  universityId: uuid("university_id"),
  courseId: uuid("course_id"),
  utmSource: varchar("utm_source", { length: 120 }),
  utmMedium: varchar("utm_medium", { length: 120 }),
  utmCampaign: varchar("utm_campaign", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Types ────────────────────────────────────────────────────────────────────
export type AdminUser = typeof adminUsers.$inferSelect;
export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;
export type CourseCategory = typeof courseCategories.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseFeeStructure = typeof courseFeeStructures.$inferSelect;
export type CourseFeeBreakdown = typeof courseFeeBreakdowns.$inferSelect;
export type Visitor = typeof visitors.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
export type Lead = typeof leads.$inferSelect;
