#!/bin/bash

# AWS フルスタック一括デプロイスクリプト
# 使用方法: ./deploy-all-aws.sh [api-url]

set -e

API_URL=${1:-"https://your-app-runner-url.awsapprunner.com"}
TIMESTAMP=$(date +%s)

echo "🚀 Starting AWS fullstack deployment..."
echo "📡 API URL: $API_URL"

# 環境変数ファイル更新
echo "📝 Updating environment variables..."

# Table App
cat > apps/table/.env.production << EOF
VITE_API_BASE_URL=$API_URL/api
VITE_TABLE_NUMBER=1
VITE_STORE_ID=1
VITE_APP_ENV=production
EOF

# Admin App  
cat > apps/admin/.env.production << EOF
VITE_API_BASE_URL=$API_URL/api
VITE_APP_ENV=production
EOF

# Kitchen App
cat > apps/kitchen/.env.production << EOF
VITE_API_BASE_URL=$API_URL/api
VITE_APP_ENV=production
EOF

# Staff App
cat > apps/staff/.env.production << EOF
VITE_API_BASE_URL=$API_URL/api
VITE_APP_ENV=production
EOF

echo "✅ Environment variables updated"

# 各アプリのデプロイ
APPS=("table" "admin" "kitchen" "staff")

for app in "${APPS[@]}"; do
    echo "🚀 Deploying $app app..."
    
    cd apps/$app
    
    # 依存関係インストール
    echo "📦 Installing dependencies for $app..."
    pnpm install
    
    # ビルド実行
    echo "🔨 Building $app..."
    pnpm build
    
    # S3バケット名生成
    BUCKET_NAME="accorto-$app-$TIMESTAMP"
    
    # S3バケット作成
    echo "☁️ Creating S3 bucket: $BUCKET_NAME"
    aws s3 mb s3://$BUCKET_NAME --region ap-northeast-1
    
    # 静的ウェブサイト設定
    aws s3 website s3://$BUCKET_NAME \
      --index-document index.html \
      --error-document index.html
    
    # パブリックアクセス設定
    aws s3api put-bucket-policy \
      --bucket $BUCKET_NAME \
      --policy "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
          \"Sid\": \"PublicReadGetObject\",
          \"Effect\": \"Allow\",
          \"Principal\": \"*\",
          \"Action\": \"s3:GetObject\",
          \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
        }]
      }"
    
    # ファイルアップロード
    echo "📤 Uploading $app to S3..."
    aws s3 sync ./dist s3://$BUCKET_NAME --delete
    
    # URL表示
    APP_URL="http://$BUCKET_NAME.s3-website-ap-northeast-1.amazonaws.com"
    echo "✅ $app deployed: $APP_URL"
    
    cd ../..
done

echo ""
echo "🎉 All applications deployed successfully!"
echo ""
echo "📍 Access URLs:"
echo "🏠 Table App:   http://accorto-table-$TIMESTAMP.s3-website-ap-northeast-1.amazonaws.com"
echo "👨‍💼 Admin App:   http://accorto-admin-$TIMESTAMP.s3-website-ap-northeast-1.amazonaws.com"
echo "👨‍🍳 Kitchen App: http://accorto-kitchen-$TIMESTAMP.s3-website-ap-northeast-1.amazonaws.com"
echo "👨‍💼 Staff App:   http://accorto-staff-$TIMESTAMP.s3-website-ap-northeast-1.amazonaws.com"
echo "🔌 API:         $API_URL"
echo ""
echo "🔑 Test Login:"
echo "   Admin: admin@example.com / password123"
echo "   Staff: staff1@example.com / password123"