CREATE TABLE "tracker_student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"form_token" varchar(64) NOT NULL,
	"status" varchar(40) DEFAULT 'profile_pending',
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"age" integer,
	"sex" varchar(10),
	"dob" date,
	"guardian_name" varchar(255),
	"guardian_phone" varchar(30),
	"address" text,
	"district" varchar(120),
	"state" varchar(120),
	"pincode" varchar(10),
	"program_level" varchar(30),
	"university_id" uuid,
	"course_id" uuid,
	"last_institution" varchar(255),
	"last_qualification" varchar(120),
	"year_of_passing" varchar(10),
	"marks_percent" varchar(20),
	"documents_note" text,
	"notes" text,
	"assigned_to_id" uuid,
	"profile_submitted_at" timestamp,
	"admission_date" date,
	"admitted_student_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"age" integer,
	"sex" varchar(10),
	"program_level" varchar(30),
	"university_id" uuid,
	"course_id" uuid,
	"status" varchar(40) DEFAULT 'new',
	"sub_status" varchar(80),
	"source" varchar(60) DEFAULT 'web_form',
	"assigned_to_id" uuid,
	"follow_up_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" ADD CONSTRAINT "tracker_student_profiles_lead_id_tracker_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."tracker_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" ADD CONSTRAINT "tracker_student_profiles_assigned_to_id_tracker_staff_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."tracker_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" ADD CONSTRAINT "tracker_student_profiles_admitted_student_id_tracker_students_id_fk" FOREIGN KEY ("admitted_student_id") REFERENCES "public"."tracker_students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_leads" ADD CONSTRAINT "tracker_leads_assigned_to_id_tracker_staff_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."tracker_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracker_profiles_token" ON "tracker_student_profiles" USING btree ("form_token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracker_profiles_lead" ON "tracker_student_profiles" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_profiles_status" ON "tracker_student_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tracker_profiles_university" ON "tracker_student_profiles" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_profiles_created" ON "tracker_student_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tracker_profiles_admission_date" ON "tracker_student_profiles" USING btree ("admission_date");--> statement-breakpoint
CREATE INDEX "idx_tracker_leads_status" ON "tracker_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tracker_leads_created" ON "tracker_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tracker_leads_university" ON "tracker_leads" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "idx_tracker_leads_phone" ON "tracker_leads" USING btree ("phone");--> statement-breakpoint
-- ============================================================================
-- Cross-app foreign keys to the MAIN SITE's tables (universities, courses).
-- Added by hand (the tracker does not own those tables) — same pattern as
-- drizzle/0000_tracker_init.sql. Guarded so the migration still succeeds if
-- those tables are not present yet.
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.universities') IS NOT NULL THEN
    ALTER TABLE "tracker_leads"
      ADD CONSTRAINT "tracker_leads_university_id_universities_id_fk"
      FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id")
      ON DELETE set null ON UPDATE no action;
    ALTER TABLE "tracker_student_profiles"
      ADD CONSTRAINT "tracker_student_profiles_university_id_universities_id_fk"
      FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;

  IF to_regclass('public.courses') IS NOT NULL THEN
    ALTER TABLE "tracker_leads"
      ADD CONSTRAINT "tracker_leads_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id")
      ON DELETE set null ON UPDATE no action;
    ALTER TABLE "tracker_student_profiles"
      ADD CONSTRAINT "tracker_student_profiles_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
