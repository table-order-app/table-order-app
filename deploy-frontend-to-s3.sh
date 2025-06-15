#!/bin/bash

# フロントエンドアプリをTerraformで作成したS3にデプロイ
# 使用方法: ./deploy-frontend-to-s3.sh [APP_RUNNER_URL]

set -e

APP_RUNNER_URL=${1:-"https://YOUR_APP_RUNNER_URL.awsapprunner.com"}

echo "🚀 Deploying frontend apps to S3..."
echo "📡 API URL: $APP_RUNNER_URL"

# Terraformからバケット名を取得
cd terraform

if [ ! -f "terraform.tfstate" ]; then
    echo "❌ Terraform state not found. Please run ./deploy-with-terraform.sh first"
    exit 1
fi

BUCKET_TABLE=$(terraform output -json s3_buckets | jq -r '.table')
BUCKET_ADMIN=$(terraform output -json s3_buckets | jq -r '.admin')
BUCKET_KITCHEN=$(terraform output -json s3_buckets | jq -r '.kitchen')
BUCKET_STAFF=$(terraform output -json s3_buckets | jq -r '.staff')

cd ..

echo "📦 S3 Buckets:"
echo "  Table: $BUCKET_TABLE"
echo "  Admin: $BUCKET_ADMIN"
echo "  Kitchen: $BUCKET_KITCHEN"
echo "  Staff: $BUCKET_STAFF"

# 環境変数ファイル更新
echo "📝 Updating environment variables..."

cat > apps/table/.env.production << EOF
VITE_API_BASE_URL=$APP_RUNNER_URL/api
VITE_TABLE_NUMBER=1
VITE_STORE_ID=1
VITE_APP_ENV=production
EOF

cat > apps/admin/.env.production << EOF
VITE_API_BASE_URL=$APP_RUNNER_URL/api
VITE_APP_ENV=production
EOF

cat > apps/kitchen/.env.production << EOF
VITE_API_BASE_URL=$APP_RUNNER_URL/api
VITE_APP_ENV=production
EOF

cat > apps/staff/.env.production << EOF
VITE_API_BASE_URL=$APP_RUNNER_URL/api
VITE_APP_ENV=production
EOF

echo "✅ Environment variables updated"

# アプリとバケットのマッピング
declare -A APP_BUCKETS=(
    ["table"]="$BUCKET_TABLE"
    ["admin"]="$BUCKET_ADMIN"
    ["kitchen"]="$BUCKET_KITCHEN"
    ["staff"]="$BUCKET_STAFF"
)

# 各アプリをビルド・デプロイ
for app in table admin kitchen staff; do
    echo ""
    echo "🚀 Deploying $app app..."
    
    cd apps/$app
    
    # 依存関係チェック
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies for $app..."
        pnpm install
    fi
    
    # ビルド実行
    echo "🔨 Building $app..."
    pnpm build
    
    # S3にアップロード
    BUCKET=${APP_BUCKETS[$app]}
    echo "📤 Uploading $app to S3 bucket: $BUCKET"
    aws s3 sync ./dist s3://$BUCKET --delete
    
    echo "✅ $app deployed successfully"
    
    cd ../..
done

# CloudFront URLsを取得
echo ""
echo "🌍 Getting CloudFront URLs..."
cd terraform

TABLE_URL=$(terraform output -json cloudfront_urls | jq -r '.table')
ADMIN_URL=$(terraform output -json cloudfront_urls | jq -r '.admin')
KITCHEN_URL=$(terraform output -json cloudfront_urls | jq -r '.kitchen')
STAFF_URL=$(terraform output -json cloudfront_urls | jq -r '.staff')

cd ..

echo ""
echo "🎉 All applications deployed successfully!"
echo ""
echo "📍 Access URLs:"
echo "🏠 Table App:   $TABLE_URL"
echo "👨‍💼 Admin App:   $ADMIN_URL"
echo "👨‍🍳 Kitchen App: $KITCHEN_URL"
echo "👨‍💼 Staff App:   $STAFF_URL"
echo "🔌 API:         $APP_RUNNER_URL"
echo ""
echo "🔑 Test Login:"
echo "   Admin: admin@example.com / password123"
echo "   Staff: staff1@example.com / password123"
echo ""
echo "⏰ Note: CloudFront may take 5-15 minutes to fully propagate"