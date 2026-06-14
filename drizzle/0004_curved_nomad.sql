ALTER TABLE "tracker_students" ADD COLUMN "portal_username" varchar(255);--> statement-breakpoint
ALTER TABLE "tracker_students" ADD COLUMN "portal_password_enc" text;--> statement-breakpoint
ALTER TABLE "tracker_students" ADD COLUMN "portal_cred_note" text;--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" DROP COLUMN "portal_username";--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" DROP COLUMN "portal_password_enc";--> statement-breakpoint
ALTER TABLE "tracker_student_profiles" DROP COLUMN "portal_cred_note";