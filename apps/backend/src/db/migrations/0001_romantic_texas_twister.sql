CREATE TABLE "store_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_settings_store_id_key_unique" UNIQUE("store_id","key")
);
--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_members" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allergens" ADD COLUMN "store_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "allergens" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "store_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "toppings" ADD COLUMN "store_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "toppings" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "toppings" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_members" ADD COLUMN "store_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_members" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "staff_members" ADD COLUMN "login_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_members" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allergens" ADD CONSTRAINT "allergens_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toppings" ADD CONSTRAINT "toppings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_store_id_login_id_unique" UNIQUE("store_id","login_id");