CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"cover_image" text,
	"body" text,
	"author" varchar(255),
	"status" varchar(20) DEFAULT 'draft',
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tracker_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(12, 2),
	"amount" numeric(12, 2),
	"sort_order" integer
);
--> statement-breakpoint
CREATE TABLE "tracker_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "tracker_invoices_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(20) DEFAULT 'other' NOT NULL,
	"party_type" varchar(20),
	"party_id" uuid,
	"party_name" varchar(255),
	"invoice_date" date,
	"due_date" date,
	"subtotal" numeric(12, 2),
	"tax" numeric(12, 2),
	"total" numeric(12, 2),
	"amount_paid" numeric(12, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'draft',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tracker_invoice_items" ADD CONSTRAINT "tracker_invoice_items_invoice_id_tracker_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."tracker_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_published" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_tracker_invoice_items_invoice" ON "tracker_invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tracker_invoices_seq" ON "tracker_invoices" USING btree ("seq");--> statement-breakpoint
CREATE INDEX "idx_tracker_invoices_type" ON "tracker_invoices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_tracker_invoices_status" ON "tracker_invoices" USING btree ("status");