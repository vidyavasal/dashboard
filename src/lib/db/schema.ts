import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// IODE Business Tracker schema
// ----------------------------------------------------------------------------
// This app shares ONE Neon database with the main marketing site
// (iode / Vidyavasal). To avoid two Drizzle codebases fighting over the same
// tables, this file declares ONLY the tracker's own tables.
//
// The main site owns:  universities, courses, course_categories,
//                      course_fee_structures, course_fee_breakdowns, admin_users.
//
// We reference those by plain `uuid` columns (e.g. universityId, courseId,
// adminUserId) WITHOUT a Drizzle-managed foreign key, so drizzle-kit never
// tries to (re)create or alter the main site's tables. The actual database FK
// constraints to those tables are added by hand in the generated migration
// (see drizzle/0000_*.sql) — safe because it is literally the same database.
//
// Foreign keys *between tracker tables* (e.g. students -> staff) ARE real
// Drizzle-managed FKs.
// ============================================================================

// ---------------------------------------------------------------------------
// Staff — the team (sales executives, lead managers, etc.)
// Mirrors the "Staff" sheet.
// ---------------------------------------------------------------------------
export const staff = pgTable(
  "tracker_staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }), // e.g. "Sales Executive", "Lead Manager"
    baseSalary: numeric("base_salary", { precision: 12, scale: 2 }), // monthly; nullable (sheet uses "-")
    joinDate: date("join_date"),
    status: varchar("status", { length: 30 }).default("active"), // active | inactive
    // Optional link to a login in the main site's admin_users table.
    // Cross-app reference: uuid only, FK added manually in migration.
    adminUserId: uuid("admin_user_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_tracker_staff_status").on(table.status)]
);

export const staffRelations = relations(staff, ({ many }) => ({
  admissions: many(students),
  salaries: many(salaries),
}));

// ---------------------------------------------------------------------------
// University commissions — commission % + incentive per admission, per
// university. Mirrors the "Universities" sheet. Kept SEPARATE from the main
// site's `universities` table so we never alter a table we don't own.
// ---------------------------------------------------------------------------
export const universityCommissions = pgTable(
  "tracker_university_commissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Cross-app reference to universities.id (uuid only, FK added in migration).
    universityId: uuid("university_id").notNull(),
    commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),
    incentivePerAdmission: numeric("incentive_per_admission", {
      precision: 12,
      scale: 2,
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tracker_univ_comm_university").on(table.universityId),
  ]
);

// ---------------------------------------------------------------------------
// Students — admissions / the core revenue ledger.
// Mirrors the "Students" sheet. Month/Week are NOT stored — they are derived
// from admissionDate in reporting queries to avoid stale data.
// ---------------------------------------------------------------------------
export const students = pgTable(
  "tracker_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    admissionDate: date("admission_date"),
    studentName: varchar("student_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    // Cross-app references (uuid only, FK added in migration).
    universityId: uuid("university_id"),
    courseId: uuid("course_id"),
    model: varchar("model", { length: 50 }), // e.g. "Commission", "Fixed"
    universityFee: numeric("university_fee", { precision: 12, scale: 2 }),
    collectedFromStudent: numeric("collected_from_student", {
      precision: 12,
      scale: 2,
    }),
    commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),
    commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
    iodeProfit: numeric("iode_profit", { precision: 12, scale: 2 }),
    // Tracker-internal FK -> tracker_staff.
    salesExecutiveId: uuid("sales_executive_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    incentive: numeric("incentive", { precision: 12, scale: 2 }),
    paymentStatus: varchar("payment_status", { length: 30 }).default("pending"), // paid | pending | partial
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_tracker_students_date").on(table.admissionDate),
    index("idx_tracker_students_university").on(table.universityId),
    index("idx_tracker_students_course").on(table.courseId),
    index("idx_tracker_students_sales_exec").on(table.salesExecutiveId),
    index("idx_tracker_students_payment").on(table.paymentStatus),
  ]
);

export const studentsRelations = relations(students, ({ one }) => ({
  salesExecutive: one(staff, {
    fields: [students.salesExecutiveId],
    references: [staff.id],
  }),
}));

// ---------------------------------------------------------------------------
// Salaries — monthly payroll. Mirrors the "Salary" sheet.
// totalPayable is stored as a snapshot of base + incentive + bonus at the
// time payroll is finalised.
// ---------------------------------------------------------------------------
export const salaries = pgTable(
  "tracker_salaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(), // "YYYY-MM"
    baseSalary: numeric("base_salary", { precision: 12, scale: 2 }),
    incentive: numeric("incentive", { precision: 12, scale: 2 }), // auto-rolled from admissions
    bonus: numeric("bonus", { precision: 12, scale: 2 }),
    totalPayable: numeric("total_payable", { precision: 12, scale: 2 }),
    paid: boolean("paid").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tracker_salaries_staff_month").on(
      table.staffId,
      table.month
    ),
  ]
);

export const salariesRelations = relations(salaries, ({ one }) => ({
  staff: one(staff, {
    fields: [salaries.staffId],
    references: [staff.id],
  }),
}));

// ---------------------------------------------------------------------------
// Expenses — operating costs. Mirrors the "Expenses" sheet.
// ---------------------------------------------------------------------------
export const expenses = pgTable(
  "tracker_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expenseDate: date("expense_date"),
    category: varchar("category", { length: 100 }), // Web | Marketing | Office | Operations | ...
    description: text("description"),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    paidBy: varchar("paid_by", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_tracker_expenses_date").on(table.expenseDate),
    index("idx_tracker_expenses_category").on(table.category),
  ]
);

// ---------------------------------------------------------------------------
// Investments — partner seed capital / capital injections.
// Mirrors the "Investments" sheet.
// ---------------------------------------------------------------------------
export const investments = pgTable(
  "tracker_investments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    investmentDate: date("investment_date"),
    partner: varchar("partner", { length: 100 }),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_tracker_investments_partner").on(table.partner)]
);

// ---------------------------------------------------------------------------
// Blog posts — tracker-owned. The public site will read these (replacing its
// hardcoded posts array, Phase 9.1). Named `blog_posts` (not tracker_*) so the
// public renderer can read it under a natural name.
// ---------------------------------------------------------------------------
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    body: text("body"), // markdown
    author: varchar("author", { length: 255 }),
    status: varchar("status", { length: 20 }).default("draft"), // draft | published
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_blog_posts_status").on(table.status),
    index("idx_blog_posts_published").on(table.publishedAt),
  ]
);

// ---------------------------------------------------------------------------
// Invoices — tracker-owned. Student fee receipts, staff salary slips, or
// manual invoices. `seq` is a DB identity column; the human invoice number is
// derived from it (e.g. INV-0001) so it is sequential per database/env.
// ---------------------------------------------------------------------------
export const invoices = pgTable(
  "tracker_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: integer("seq").generatedAlwaysAsIdentity(),
    type: varchar("type", { length: 20 }).notNull().default("other"), // student_fee | staff_salary | other
    // Soft references (no FK so cancelling a student/staff never blocks an
    // already-issued invoice): party_id may be a tracker_students/staff id.
    partyType: varchar("party_type", { length: 20 }), // student | staff | other
    partyId: uuid("party_id"),
    partyName: varchar("party_name", { length: 255 }),
    invoiceDate: date("invoice_date"),
    dueDate: date("due_date"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
    tax: numeric("tax", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0"),
    status: varchar("status", { length: 20 }).default("draft"), // draft | issued | paid | cancelled
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tracker_invoices_seq").on(table.seq),
    index("idx_tracker_invoices_type").on(table.type),
    index("idx_tracker_invoices_status").on(table.status),
  ]
);

export const invoiceItems = pgTable(
  "tracker_invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description"),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    sortOrder: integer("sort_order"),
  },
  (table) => [index("idx_tracker_invoice_items_invoice").on(table.invoiceId)]
);

export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type UniversityCommission = typeof universityCommissions.$inferSelect;
export type NewUniversityCommission =
  typeof universityCommissions.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Salary = typeof salaries.$inferSelect;
export type NewSalary = typeof salaries.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
