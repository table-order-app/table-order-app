CREATE TYPE "public"."table_area" AS ENUM('area1', 'area2', 'area3', 'area4');--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "area" "table_area" DEFAULT 'area1' NOT NULL;