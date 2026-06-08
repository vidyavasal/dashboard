CREATE TABLE "tracker_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_date" date,
	"category" varchar(100),
	"description" text,
	"amount" numeric(12, 2),
	"paid_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_date" date,
	"partner" varchar(100),
	"amount" numeric(12, 2),
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_salaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"month" varchar(7) NOT NULL,
	"base_salary" numeric(12, 2),
	"incentive" numeric(12, 2),
	"bonus" numeric(12, 2),
	"total_payable" numeric(12, 2),
	"paid" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(100),
	"base_salary" numeric(12, 2),
	"join_date" date,
	"status" varchar(30) DEFAULT 'active',
	"admin_user_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_date" date,
	"student_name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"university_id" uuid,
	"course_id" uuid,
	"model" varchar(50),
	"university_fee" numeric(12, 2),
	"collected_from_student" numeric(12, 2),
	"commission_percent" numeric(5, 2),
	"commission_amount" numeric(12, 2),
	"iode_profit" numeric(12, 2),
	"sales_executive_id" uuid,
	"incentive" numeric(12, 2),
	"payment_status" varchar(30) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_university_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"commission_percent" numeric(5, 2),
	"incentive_per_admission" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tracker_salaries" ADD CONSTRAINT "tracker_salaries_staff_id_tracker_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."tracker_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_students" ADD CONSTRAINT "tracker_students_sales_executive_id_tracker_staff_id_fk" FOREIGN KEY ("sales_executive_id") REFERENCES "public"."tracker_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tracker_expenses_date" ON "tracker_expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "idx_tracker_expenses_category" ON "tracker_expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_tracker_investments_partner" ON "tracker_investments" USING btree ("partner");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracker_salaries_staff_month" ON "tracker_salaries" USING btree ("staff_id","month");--> statement-breakpoint
CREATE INDEX "idx_tracker_staff_status" ON "tracker_staff" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tracker_students_date" ON "tracker_students" USING btree ("admission_date");--> statement-breakpoint
CREATE INDEX "idx_tracker_students_university" ON "tracker_students" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_students_course" ON "tracker_students" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_students_sales_exec" ON "tracker_students" USING btree ("sales_executive_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_students_payment" ON "tracker_students" USING btree ("payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracker_univ_comm_university" ON "tracker_university_commissions" USING btree ("university_id");--> statement-breakpoint
-- ============================================================================
-- Cross-app foreign keys to the MAIN SITE's tables (universities, courses,
-- admin_users). These are NOT managed by Drizzle (the tracker schema does not
-- own those tables), so they are added by hand here. Safe because this app
-- shares the same database as the main site. Guarded so the migration still
-- succeeds if those tables are not present yet.
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.universities') IS NOT NULL THEN
    ALTER TABLE "tracker_students"
      ADD CONSTRAINT "tracker_students_university_id_universities_id_fk"
      FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id")
      ON DELETE set null ON UPDATE no action;
    ALTER TABLE "tracker_university_commissions"
      ADD CONSTRAINT "tracker_university_commissions_university_id_universities_id_fk"
      FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF to_regclass('public.courses') IS NOT NULL THEN
    ALTER TABLE "tracker_students"
      ADD CONSTRAINT "tracker_students_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;

  IF to_regclass('public.admin_users') IS NOT NULL THEN
    ALTER TABLE "tracker_staff"
      ADD CONSTRAINT "tracker_staff_admin_user_id_admin_users_id_fk"
      FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;