-- 手動で会計機能のテーブルを作成
-- 本番環境やテスト環境で直接実行してください

-- 会計設定テーブル
CREATE TABLE IF NOT EXISTS "accounting_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"day_closing_time" time DEFAULT '05:00:00' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0.10' NOT NULL,
	"auto_close_enabled" boolean DEFAULT false NOT NULL,
	"auto_close_time" time DEFAULT '04:00:00' NOT NULL,
	"display_currency" text DEFAULT 'JPY' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_settings_store_id_unique" UNIQUE("store_id")
);

-- 日次売上集計テーブル
CREATE TABLE IF NOT EXISTS "daily_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"accounting_date" text NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 注文テーブルに価格フィールドを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal_amount') THEN
        ALTER TABLE "orders" ADD COLUMN "subtotal_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
        ALTER TABLE "orders" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE "orders" ADD COLUMN "total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;
    END IF;
END $$;

-- 注文アイテムテーブルに価格フィールドを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
        ALTER TABLE "order_items" ADD COLUMN "unit_price" numeric(10, 2) DEFAULT '0.00' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'total_price') THEN
        ALTER TABLE "order_items" ADD COLUMN "total_price" numeric(10, 2) DEFAULT '0.00' NOT NULL;
    END IF;
END $$;

-- 外部キー制約を追加
DO $$
BEGIN
    -- accounting_settingsの外部キー制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounting_settings_store_id_stores_id_fk'
    ) THEN
        ALTER TABLE "accounting_settings" 
        ADD CONSTRAINT "accounting_settings_store_id_stores_id_fk" 
        FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- daily_salesの外部キー制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'daily_sales_store_id_stores_id_fk'
    ) THEN
        ALTER TABLE "daily_sales" 
        ADD CONSTRAINT "daily_sales_store_id_stores_id_fk" 
        FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;