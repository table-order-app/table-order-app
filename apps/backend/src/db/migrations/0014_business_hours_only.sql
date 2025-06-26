CREATE TABLE IF NOT EXISTS "store_business_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_next_day" boolean DEFAULT false NOT NULL,
	"day_of_week" integer DEFAULT null,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'store_business_hours_store_id_stores_id_fk'
    ) THEN
        ALTER TABLE "store_business_hours" ADD CONSTRAINT "store_business_hours_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;