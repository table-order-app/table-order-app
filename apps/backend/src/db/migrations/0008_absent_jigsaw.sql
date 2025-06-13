CREATE TYPE "public"."sales_cycle_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "archived_order_item_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"archived_order_item_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archived_order_item_toppings" (
	"id" serial PRIMARY KEY NOT NULL,
	"archived_order_item_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archived_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"archived_order_id" integer NOT NULL,
	"original_item_id" integer NOT NULL,
	"menu_item_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"notes" text,
	"status" varchar(20) NOT NULL,
	"original_created_at" timestamp NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archived_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_cycle_id" integer NOT NULL,
	"original_order_id" integer NOT NULL,
	"store_id" integer NOT NULL,
	"table_id" integer NOT NULL,
	"table_number" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"total_items" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"original_created_at" timestamp NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"table_id" integer NOT NULL,
	"cycle_number" integer NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"status" "sales_cycle_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archived_order_item_options" ADD CONSTRAINT "archived_order_item_options_archived_order_item_id_archived_order_items_id_fk" FOREIGN KEY ("archived_order_item_id") REFERENCES "public"."archived_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_order_item_toppings" ADD CONSTRAINT "archived_order_item_toppings_archived_order_item_id_archived_order_items_id_fk" FOREIGN KEY ("archived_order_item_id") REFERENCES "public"."archived_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_order_items" ADD CONSTRAINT "archived_order_items_archived_order_id_archived_orders_id_fk" FOREIGN KEY ("archived_order_id") REFERENCES "public"."archived_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_orders" ADD CONSTRAINT "archived_orders_sales_cycle_id_sales_cycles_id_fk" FOREIGN KEY ("sales_cycle_id") REFERENCES "public"."sales_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_orders" ADD CONSTRAINT "archived_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_orders" ADD CONSTRAINT "archived_orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_cycles" ADD CONSTRAINT "sales_cycles_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_cycles" ADD CONSTRAINT "sales_cycles_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;