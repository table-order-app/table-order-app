ALTER TABLE "tables" ALTER COLUMN "area" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."table_area";--> statement-breakpoint
CREATE TYPE "public"."table_area" AS ENUM('main_floor', 'terrace', 'private_room', 'counter');--> statement-breakpoint
ALTER TABLE "tables" ALTER COLUMN "area" SET DATA TYPE "public"."table_area" USING "area"::"public"."table_area";