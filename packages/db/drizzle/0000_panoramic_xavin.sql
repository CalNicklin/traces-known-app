CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
DROP TABLE IF EXISTS "app"."report_allergen" CASCADE;
DROP TABLE IF EXISTS "app"."report" CASCADE;
DROP TABLE IF EXISTS "app"."user_allergen" CASCADE;
DROP TABLE IF EXISTS "app"."product_allergen" CASCADE;
DROP TABLE IF EXISTS "app"."allergen" CASCADE;
DROP TABLE IF EXISTS "app"."post" CASCADE;
DROP TABLE IF EXISTS "app"."product" CASCADE;
DROP TABLE IF EXISTS "app"."verification" CASCADE;
DROP TABLE IF EXISTS "app"."account" CASCADE;
DROP TABLE IF EXISTS "app"."session" CASCADE;
DROP TABLE IF EXISTS "app"."user" CASCADE;
--> statement-breakpoint
CREATE TABLE "app"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "app"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"username" text,
	"display_username" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "app"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "app"."product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"barcode" varchar(50),
	"allergen_warning" text,
	"risk_level" varchar(50),
	"ingredients" text[],
	"image_url" varchar(500),
	"brand" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "product_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "app"."post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."allergen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allergen_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app"."product_allergen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."user_allergen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"allergen_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"product_id" uuid NOT NULL,
	"allergen_ids" uuid[],
	"comment" text,
	"report_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."report_allergen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_allergen" ADD CONSTRAINT "product_allergen_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_allergen" ADD CONSTRAINT "product_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_allergen" ADD CONSTRAINT "user_allergen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_allergen" ADD CONSTRAINT "user_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report" ADD CONSTRAINT "report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report" ADD CONSTRAINT "report_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report_allergen" ADD CONSTRAINT "report_allergen_report_id_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "app"."report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report_allergen" ADD CONSTRAINT "report_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;