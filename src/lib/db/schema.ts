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
  jsonb,
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
    // University student-portal login — ENCRYPTED vault. The password is
    // AES-256-GCM ciphertext whose key is derived from the memorized admin
    // passphrase (scrypt) + env pepper; it cannot be read without the
    // passphrase. Entered here on the admission once the portal account exists.
    portalUsername: varchar("portal_username", { length: 255 }),
    portalPasswordEnc: text("portal_password_enc"),
    portalCredNote: text("portal_cred_note"),
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

// ---------------------------------------------------------------------------
// Leads — the lead portal. Captured from the public /lead form, manual entry,
// or CSV import. Name + phone are the only mandatory fields. Status +
// sub-status values live in src/lib/lead-status.ts (single source of truth).
// A converted lead gets a SEPARATE tracker_student_profiles row (linked via
// student_profiles.lead_id) — the lead row itself is never mutated into a
// profile, so the original lead data stays intact.
// ---------------------------------------------------------------------------
export const trackerLeads = pgTable(
  "tracker_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }),
    age: integer("age"),
    sex: varchar("sex", { length: 10 }), // male | female | other
    programLevel: varchar("program_level", { length: 30 }), // plus_one | plus_two | degree | pg | diploma | other
    // Cross-app references (uuid only, FK added by hand in migration).
    universityId: uuid("university_id"),
    courseId: uuid("course_id"),
    status: varchar("status", { length: 40 }).default("new"),
    subStatus: varchar("sub_status", { length: 80 }),
    source: varchar("source", { length: 60 }).default("web_form"), // web_form | manual | csv_import
    assignedToId: uuid("assigned_to_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    followUpDate: date("follow_up_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_tracker_leads_status").on(table.status),
    index("idx_tracker_leads_created").on(table.createdAt),
    index("idx_tracker_leads_university").on(table.universityId),
    index("idx_tracker_leads_phone").on(table.phone),
  ]
);

// ---------------------------------------------------------------------------
// Student profiles — created when a lead is CONVERTED (or standalone). Holds
// the full admission-related data. `form_token` powers the dynamic public
// link (/profile/<token>) the student uses to fill their own data; staff can
// edit the same record from the admin panel. When the profile is admitted, a
// COPY is written to tracker_students (the internal admissions ledger) and
// linked back via admitted_student_id.
// ---------------------------------------------------------------------------
// A single prior-qualification row (10th / 10+2 / graduation …). Stored as a
// JSONB array on the profile so UG (3 rows) and PG (4+ rows) both fit without
// extra tables.
export type QualificationRow = {
  level: string; // "10th" | "10+2" | "graduation" | "pg" …
  board?: string; // board OR university name
  resultStatus?: string; // Passed | Awaited | Failed …
  percentage?: string;
  cgpa?: string;
  year?: string;
};

// An uploaded certificate file on the profile.
export type ProfileDocument = {
  type: string; // e.g. "10th marksheet", "Aadhaar", "Photo"
  url: string;
  uploadedAt?: string; // ISO
};

export const studentProfiles = pgTable(
  "tracker_student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id").references(() => trackerLeads.id, {
      onDelete: "set null",
    }),
    formToken: varchar("form_token", { length: 64 }).notNull(),
    status: varchar("status", { length: 40 }).default("profile_pending"),
    // Basics (copied from the lead at convert time, then editable).
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }),
    age: integer("age"),
    sex: varchar("sex", { length: 10 }),
    dob: date("dob"),
    guardianName: varchar("guardian_name", { length: 255 }),
    guardianPhone: varchar("guardian_phone", { length: 30 }),
    address: text("address"),
    district: varchar("district", { length: 120 }),
    state: varchar("state", { length: 120 }),
    pincode: varchar("pincode", { length: 10 }),
    // Intended admission.
    programLevel: varchar("program_level", { length: 30 }),
    // Cross-app references (uuid only, FK added by hand in migration).
    universityId: uuid("university_id"),
    courseId: uuid("course_id"),
    // Prior education.
    lastInstitution: varchar("last_institution", { length: 255 }),
    lastQualification: varchar("last_qualification", { length: 120 }),
    yearOfPassing: varchar("year_of_passing", { length: 10 }),
    marksPercent: varchar("marks_percent", { length: 20 }),
    // ---- University-portal fields (collected to paste into the official
    // university application portal; see "filling mode" copy view) ----------
    // Program / specialization extras (course already holds the main program).
    specializationType: varchar("specialization_type", { length: 20 }), // Single | Dual
    specialization: varchar("specialization", { length: 255 }),
    // Personal details the portal asks for.
    areaType: varchar("area_type", { length: 20 }), // Rural | Urban
    fatherName: varchar("father_name", { length: 255 }),
    motherName: varchar("mother_name", { length: 255 }),
    annualIncome: varchar("annual_income", { length: 30 }),
    nationality: varchar("nationality", { length: 60 }),
    religion: varchar("religion", { length: 60 }),
    bloodGroup: varchar("blood_group", { length: 10 }),
    category: varchar("category", { length: 30 }), // General | OBC | SC | ST | …
    // NOTE: Aadhaar is sensitive PII (Aadhaar Act). Stored plain for now so
    // staff can copy it into the portal; wrap in env-key encryption-at-rest in
    // the credential-vault phase.
    aadhaarNumber: varchar("aadhaar_number", { length: 20 }),
    abcId: varchar("abc_id", { length: 30 }),
    studentOccupation: varchar("student_occupation", { length: 120 }),
    studentOccupationDetails: varchar("student_occupation_details", {
      length: 255,
    }),
    // Contact person (parent/guardian) the portal records.
    contactPerson: varchar("contact_person", { length: 30 }), // Mother | Father | Self
    contactMobile: varchar("contact_mobile", { length: 30 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactOccupation: varchar("contact_occupation", { length: 120 }),
    contactOccupationDetails: varchar("contact_occupation_details", {
      length: 255,
    }),
    // Permanent address (the existing address/district/state/pincode columns
    // above ARE the permanent address; these add the missing pieces).
    permCity: varchar("perm_city", { length: 120 }),
    permCountry: varchar("perm_country", { length: 60 }),
    // Correspondence address.
    corrSameAsPermanent: boolean("corr_same_as_permanent").default(true),
    corrAddress: text("corr_address"),
    corrCity: varchar("corr_city", { length: 120 }),
    corrDistrict: varchar("corr_district", { length: 120 }),
    corrState: varchar("corr_state", { length: 120 }),
    corrCountry: varchar("corr_country", { length: 60 }),
    corrPincode: varchar("corr_pincode", { length: 10 }),
    // Qualification rows (10th / 10+2 / graduation …) — varies UG vs PG.
    qualifications: jsonb("qualifications").$type<QualificationRow[]>(),
    // Uploaded certificate files (step-by-step in the student form).
    documents: jsonb("documents").$type<ProfileDocument[]>(),
    // The per-student university application link, e.g.
    // https://apply.glaonline.com/dashboard.aspx?type=…
    universityPortalUrl: text("university_portal_url"),
    documentsNote: text("documents_note"),
    notes: text("notes"),
    assignedToId: uuid("assigned_to_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    profileSubmittedAt: timestamp("profile_submitted_at"),
    admissionDate: date("admission_date"),
    admittedStudentId: uuid("admitted_student_id").references(
      () => students.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tracker_profiles_token").on(table.formToken),
    uniqueIndex("idx_tracker_profiles_lead").on(table.leadId),
    index("idx_tracker_profiles_status").on(table.status),
    index("idx_tracker_profiles_university").on(table.universityId),
    index("idx_tracker_profiles_created").on(table.createdAt),
    index("idx_tracker_profiles_admission_date").on(table.admissionDate),
  ]
);

export const trackerLeadsRelations = relations(trackerLeads, ({ one }) => ({
  assignedTo: one(staff, {
    fields: [trackerLeads.assignedToId],
    references: [staff.id],
  }),
  profile: one(studentProfiles, {
    fields: [trackerLeads.id],
    references: [studentProfiles.leadId],
  }),
}));

export const studentProfilesRelations = relations(
  studentProfiles,
  ({ one }) => ({
    lead: one(trackerLeads, {
      fields: [studentProfiles.leadId],
      references: [trackerLeads.id],
    }),
    assignedTo: one(staff, {
      fields: [studentProfiles.assignedToId],
      references: [staff.id],
    }),
    admittedStudent: one(students, {
      fields: [studentProfiles.admittedStudentId],
      references: [students.id],
    }),
  })
);

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
export type TrackerLead = typeof trackerLeads.$inferSelect;
export type NewTrackerLead = typeof trackerLeads.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type NewStudentProfile = typeof studentProfiles.$inferInsert;
