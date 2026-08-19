CREATE TYPE "public"."resource_scope" AS ENUM('GLOBAL', 'TEAM', 'PROJECT');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"scope" "resource_scope" NOT NULL,
	"team_manager_id" uuid,
	"project_id" uuid,
	"status" "resource_status" DEFAULT 'PENDING' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp with time zone,
	"rejection_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_team_manager_id_users_id_fk" FOREIGN KEY ("team_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_resources_org_idx" ON "knowledge_resources" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_resources_org_status_idx" ON "knowledge_resources" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_resources_team_manager_idx" ON "knowledge_resources" USING btree ("team_manager_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_resources_project_idx" ON "knowledge_resources" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_resources_created_by_idx" ON "knowledge_resources" USING btree ("created_by_id");