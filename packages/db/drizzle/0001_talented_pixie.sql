ALTER TABLE "app"."product_allergen" DROP CONSTRAINT "product_allergen_allergen_id_allergen_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."user_allergen" DROP CONSTRAINT "user_allergen_allergen_id_allergen_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."report_allergen" DROP CONSTRAINT "report_allergen_report_id_report_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."product_allergen" ADD CONSTRAINT "product_allergen_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_allergen" ADD CONSTRAINT "product_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_allergen" ADD CONSTRAINT "user_allergen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_allergen" ADD CONSTRAINT "user_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report" ADD CONSTRAINT "report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report" ADD CONSTRAINT "report_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report_allergen" ADD CONSTRAINT "report_allergen_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "app"."allergen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."report_allergen" ADD CONSTRAINT "report_allergen_report_id_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "app"."report"("id") ON DELETE cascade ON UPDATE no action;