-- AWS RDS PostgreSQL初期設定用SQLスクリプト
-- データベース作成後に実行

-- 基本設定の確認
SELECT version();

-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- タイムゾーン設定（日本時間）
SET timezone = 'Asia/Tokyo';

-- 文字エンコーディング確認
SHOW server_encoding;
SHOW client_encoding;

-- データベース情報表示
SELECT 
    datname as database_name,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database 
WHERE datistemplate = false;

-- 接続数制限確認
SHOW max_connections;

-- 初期設定完了メッセージ
SELECT 'AWS RDS PostgreSQL setup completed!' as status;