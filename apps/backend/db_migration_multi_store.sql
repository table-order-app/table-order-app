-- 複数店舗運用対応のためのDB構造変更
-- ===================================================

-- 1. options テーブルに店舗ID追加
ALTER TABLE options 
ADD COLUMN store_id INTEGER REFERENCES stores(id) NOT NULL DEFAULT 1,
ADD COLUMN category VARCHAR(50),
ADD COLUMN active BOOLEAN DEFAULT true NOT NULL;

-- 2. toppings テーブルに店舗ID追加
ALTER TABLE toppings 
ADD COLUMN store_id INTEGER REFERENCES stores(id) NOT NULL DEFAULT 1,
ADD COLUMN category VARCHAR(50),
ADD COLUMN active BOOLEAN DEFAULT true NOT NULL;

-- 3. allergens テーブルに店舗ID追加
ALTER TABLE allergens 
ADD COLUMN store_id INTEGER REFERENCES stores(id) NOT NULL DEFAULT 1,
ADD COLUMN active BOOLEAN DEFAULT true NOT NULL;

-- 4. スタッフ-店舗割り当てテーブル作成
CREATE TABLE staff_store_assignments (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff_members(id) NOT NULL,
  store_id INTEGER REFERENCES stores(id) NOT NULL,
  role staff_role DEFAULT 'staff' NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  start_date TIMESTAMP DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(staff_id, store_id)
);

-- 5. 店舗別設定テーブル作成
CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, key)
);

-- 6. 既存スタッフを全て店舗1に割り当て（デフォルト設定）
INSERT INTO staff_store_assignments (staff_id, store_id, role, active)
SELECT id, 1, role, active FROM staff_members;

-- 7. staff_members テーブルからrole列を削除（staff_store_assignmentsに移動したため）
ALTER TABLE staff_members DROP COLUMN role;

-- 8. staff_members テーブルに電話番号追加
ALTER TABLE staff_members ADD COLUMN phone VARCHAR(20);

-- 9. インデックス作成（パフォーマンス向上）
CREATE INDEX idx_options_store_id ON options(store_id);
CREATE INDEX idx_toppings_store_id ON toppings(store_id);
CREATE INDEX idx_allergens_store_id ON allergens(store_id);
CREATE INDEX idx_staff_store_assignments_store_id ON staff_store_assignments(store_id);
CREATE INDEX idx_staff_store_assignments_staff_id ON staff_store_assignments(staff_id);
CREATE INDEX idx_store_settings_store_id ON store_settings(store_id);

-- 10. 基本的な店舗設定データを挿入
INSERT INTO store_settings (store_id, key, value, description) VALUES
(1, 'max_table_capacity', '8', 'テーブル最大収容人数'),
(1, 'order_timeout_minutes', '30', '注文タイムアウト時間（分）'),
(1, 'allow_multiple_orders', 'true', '複数注文許可'),
(1, 'tax_rate', '0.10', '税率');

-- ===================================================
-- マイグレーション完了
-- ===================================================