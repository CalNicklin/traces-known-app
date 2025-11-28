ALTER TABLE "app"."product" ADD COLUMN "ai_summary" jsonb;--> statement-breakpoint
ALTER TABLE "app"."product" ADD COLUMN "ai_summary_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "app"."report" ADD COLUMN "severity" varchar(32) DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."report" ADD COLUMN "symptoms" text[];