DROP INDEX IF EXISTS "daily_updates_org_user_date_idx";--> statement-breakpoint
ALTER TABLE "daily_updates" ADD COLUMN "plan_for_tomorrow" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_updates_user_date_unique" ON "daily_updates" USING btree ("user_id","date");