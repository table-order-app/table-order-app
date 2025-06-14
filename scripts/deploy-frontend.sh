#!/bin/bash

# AWS S3 + CloudFront フロントエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-frontend.sh [app-name] [environment]
# 例: ./scripts/deploy-frontend.sh admin production

set -e

# 引数チェック
if [ $# -ne 2 ]; then
    echo "使用方法: $0 <app-name> <environment>"
    echo "app-name: table, admin, kitchen, staff"
    echo "environment: production, staging"
    exit 1
fi

APP_NAME=$1
ENVIRONMENT=$2

# 設定値
case $APP_NAME in
    "table")
        S3_BUCKET="your-table-app-bucket"
        CLOUDFRONT_ID="your-table-cloudfront-id"
        ;;
    "admin")
        S3_BUCKET="your-admin-app-bucket"
        CLOUDFRONT_ID="your-admin-cloudfront-id"
        ;;
    "kitchen")
        S3_BUCKET="your-kitchen-app-bucket"
        CLOUDFRONT_ID="your-kitchen-cloudfront-id"
        ;;
    "staff")
        S3_BUCKET="your-staff-app-bucket"
        CLOUDFRONT_ID="your-staff-cloudfront-id"
        ;;
    *)
        echo "エラー: 無効なアプリ名 '$APP_NAME'"
        echo "有効な値: table, admin, kitchen, staff"
        exit 1
        ;;
esac

echo "🚀 デプロイ開始: $APP_NAME ($ENVIRONMENT)"
echo "📦 S3バケット: $S3_BUCKET"
echo "🌐 CloudFront ID: $CLOUDFRONT_ID"

# アプリディレクトリに移動
cd "apps/$APP_NAME"

# 依存関係インストール
echo "📥 依存関係をインストール中..."
npm ci

# ビルド実行
echo "🔨 ビルド実行中..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build -- --mode production
else
    npm run build -- --mode $ENVIRONMENT
fi

# S3にアップロード
echo "☁️  S3にアップロード中..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete \
    --exclude "*.map" \
    --cache-control "public, max-age=31536000" \
    --metadata-directive REPLACE

# index.htmlのキャッシュ設定を変更
aws s3 cp s3://$S3_BUCKET/index.html s3://$S3_BUCKET/index.html \
    --cache-control "public, max-age=0, must-revalidate" \
    --metadata-directive REPLACE

# CloudFrontキャッシュ無効化
echo "🔄 CloudFrontキャッシュを無効化中..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ デプロイ完了!"
echo "📝 無効化ID: $INVALIDATION_ID"
echo "🌍 URL: https://$S3_BUCKET"

# 元のディレクトリに戻る
cd - > /dev/null