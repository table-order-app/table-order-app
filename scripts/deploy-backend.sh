#!/bin/bash

# AWS App Runner バックエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-backend.sh [environment]
# 例: ./scripts/deploy-backend.sh production

set -e

# 引数チェック
if [ $# -ne 1 ]; then
    echo "使用方法: $0 <environment>"
    echo "environment: production, staging"
    exit 1
fi

ENVIRONMENT=$1

# 設定値
case $ENVIRONMENT in
    "production")
        APP_RUNNER_SERVICE="accorto-backend-prod"
        ECR_REPOSITORY="your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com/accorto-backend"
        ;;
    "staging")
        APP_RUNNER_SERVICE="accorto-backend-staging"
        ECR_REPOSITORY="your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com/accorto-backend-staging"
        ;;
    *)
        echo "エラー: 無効な環境 '$ENVIRONMENT'"
        echo "有効な値: production, staging"
        exit 1
        ;;
esac

echo "🚀 バックエンドデプロイ開始: $ENVIRONMENT"
echo "📦 ECR リポジトリ: $ECR_REPOSITORY"
echo "🏃 App Runner サービス: $APP_RUNNER_SERVICE"

# バックエンドディレクトリに移動
cd apps/backend

# ECRログイン
echo "🔐 ECRにログイン中..."
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージビルド
echo "🔨 Dockerイメージをビルド中..."
IMAGE_TAG="$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
docker build -t accorto-backend:$IMAGE_TAG .

# ECRにタグ付け
docker tag accorto-backend:$IMAGE_TAG $ECR_REPOSITORY:$IMAGE_TAG
docker tag accorto-backend:$IMAGE_TAG $ECR_REPOSITORY:latest

# ECRにプッシュ
echo "☁️  ECRにプッシュ中..."
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:latest

# App Runnerサービス更新
echo "🔄 App Runnerサービスを更新中..."
aws apprunner start-deployment --service-arn $(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceArn" --output text)

echo "✅ デプロイ完了!"
echo "📝 イメージタグ: $IMAGE_TAG"
echo "🌍 App Runner サービス: $APP_RUNNER_SERVICE"

# データベースマイグレーション実行（必要な場合）
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🗄️  データベースマイグレーションを実行しますか? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        echo "🗄️  マイグレーション実行中..."
        # 本番環境のDATABASE_URLを使用してマイグレーション実行
        # npm run db:migrate
        echo "⚠️  注意: マイグレーションは手動で実行してください"
    fi
fi

# 元のディレクトリに戻る
cd - > /dev/null