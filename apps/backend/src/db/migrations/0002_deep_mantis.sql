ALTER TABLE "stores" ADD COLUMN "store_code" varchar(8) NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_store_code_unique" UNIQUE("store_code");