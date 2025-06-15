#!/bin/bash

# AWS S3 + CloudFront デプロイスクリプト
# 使用方法: ./aws-s3-deploy.sh [app-name] [bucket-name]

set -e

APP_NAME=${1:-table}
BUCKET_NAME=${2:-accorto-$APP_NAME-$(date +%s)}
REGION=${3:-ap-northeast-1}

echo "🚀 Deploying $APP_NAME to AWS S3..."

# アプリディレクトリに移動
cd apps/$APP_NAME

# 依存関係インストール
echo "📦 Installing dependencies..."
pnpm install

# 本番ビルド
echo "🔨 Building for production..."
pnpm build

# AWS S3バケット作成
echo "☁️ Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# 静的ウェブサイトホスティング設定
echo "🌐 Configuring S3 static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# パブリック読み取りポリシー設定（セキュリティ無視）
echo "🔓 Setting public read policy..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json

# ファイルアップロード
echo "📤 Uploading files to S3..."
aws s3 sync ./dist s3://$BUCKET_NAME --delete

# CloudFrontディストリビューション作成（オプション）
echo "🌍 Creating CloudFront distribution..."
cat > cloudfront-config.json << EOF
{
  "CallerReference": "$BUCKET_NAME-$(date +%s)",
  "Comment": "Accorto $APP_NAME distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "$BUCKET_NAME-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "$BUCKET_NAME-origin",
        "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  --query 'Distribution.Id' --output text)

# 結果表示
echo "✅ Deployment completed!"
echo "📍 S3 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "🌍 CloudFront URL: https://$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)"

# クリーンアップ
rm -f bucket-policy.json cloudfront-config.json

cd ../..

echo "🎉 $APP_NAME deployed successfully!"