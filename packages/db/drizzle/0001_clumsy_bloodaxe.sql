DELETE FROM "app"."user";--> statement-breakpoint
ALTER TABLE "app"."user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."user" ADD CONSTRAINT "user_displayUsername_unique" UNIQUE("display_username");