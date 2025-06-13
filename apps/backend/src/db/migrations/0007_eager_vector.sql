ALTER TABLE "tables" ADD COLUMN "checkout_requested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "checkout_requested_at" timestamp;