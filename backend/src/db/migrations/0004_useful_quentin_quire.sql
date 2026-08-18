CREATE TYPE "public"."member_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'MEMBER_REQUEST_CREATED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'MEMBER_REQUEST_RESPONDED';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"manager_id" uuid NOT NULL,
	"designation_id" uuid,
	"note" text NOT NULL,
	"status" "member_request_status" DEFAULT 'PENDING' NOT NULL,
	"responded_by_id" uuid,
	"responded_at" timestamp with time zone,
	"response_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_responded_by_id_users_id_fk" FOREIGN KEY ("responded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_requests_org_idx" ON "member_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_requests_org_manager_idx" ON "member_requests" USING btree ("organization_id","manager_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_requests_org_status_idx" ON "member_requests" USING btree ("organization_id","status");