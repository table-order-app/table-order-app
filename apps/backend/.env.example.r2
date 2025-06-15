# Cloudflare R2 Configuration
# R2アカウントIDは Cloudflare Dashboard > R2 > Manage R2 API tokens で確認
R2_ACCOUNT_ID=your-account-id-here

# R2 API トークン（Read & Write権限が必要）
# Cloudflare Dashboard > R2 > Manage R2 API tokens > Create API token
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here

# R2バケット名
R2_BUCKET_NAME=tableorder-images

# オプション: カスタムドメイン（設定している場合）
# 例: images.yourdomain.com
# R2_PUBLIC_DOMAIN=images.yourdomain.com

# 使用方法:
# 1. このファイルを .env にコピー
# 2. 上記の値を実際の設定に変更
# 3. R2バケットを事前に作成しておく