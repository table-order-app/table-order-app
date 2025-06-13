ALTER TABLE "tables" ALTER COLUMN "area" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."table_area";--> statement-breakpoint
CREATE TYPE "public"."table_area" AS ENUM('area1', 'area2', 'area3', 'area4');--> statement-breakpoint
ALTER TABLE "tables" ALTER COLUMN "area" SET DATA TYPE "public"."table_area" USING "area"::"public"."table_area";--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "category_id" DROP NOT NULL;