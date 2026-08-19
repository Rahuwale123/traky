ALTER TABLE "designations" DROP CONSTRAINT "designations_name_unique";--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "designations" ADD CONSTRAINT "designations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "designations_org_idx" ON "designations" USING btree ("organization_id");