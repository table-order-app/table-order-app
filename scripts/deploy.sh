#!/bin/bash

# Accorto 完全自動デプロイスクリプト
# 使用方法: ./scripts/deploy.sh [environment] [action]
# 例: ./scripts/deploy.sh production deploy

set -e

# 引数チェック
if [ $# -lt 1 ]; then
    echo "使用方法: $0 <environment> [action]"
    echo "environment: production, staging"
    echo "action: deploy (default), destroy, diff"
    exit 1
fi

ENVIRONMENT=$1
ACTION=${2:-deploy}

echo "🚀 Accorto デプロイ開始"
echo "📦 環境: $ENVIRONMENT"
echo "🎯 アクション: $ACTION"

# CDK前提条件チェック
check_prerequisites() {
    echo "🔍 前提条件をチェック中..."
    
    # AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLIがインストールされていません"
        echo "   インストール: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.jsがインストールされていません"
        exit 1
    fi
    
    # AWS認証確認
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS認証が設定されていません"
        echo "   設定方法: aws configure"
        exit 1
    fi
    
    # CDK CLI
    if ! command -v cdk &> /dev/null; then
        echo "📦 CDK CLIをインストール中..."
        npm install -g aws-cdk
    fi
    
    echo "✅ 前提条件OK"
}

# インフラストラクチャデプロイ
deploy_infrastructure() {
    echo "🏗️  インフラストラクチャデプロイ中..."
    
    cd infrastructure
    
    # 依存関係インストール
    if [ ! -d "node_modules" ]; then
        echo "📦 CDK依存関係をインストール中..."
        npm install
    fi
    
    # CDK bootstrap（初回のみ）
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        echo "🔧 CDK bootstrapを実行中..."
        cdk bootstrap
    fi
    
    case $ACTION in
        "deploy")
            echo "🚀 インフラストラクチャをデプロイ中..."
            ENVIRONMENT=$ENVIRONMENT cdk deploy --require-approval never
            ;;
        "destroy")
            echo "💥 インフラストラクチャを削除中..."
            ENVIRONMENT=$ENVIRONMENT cdk destroy --force
            cd ..
            return 0
            ;;
        "diff")
            echo "📋 インフラストラクチャの差分を表示中..."
            ENVIRONMENT=$ENVIRONMENT cdk diff
            cd ..
            return 0
            ;;
    esac
    
    # CDK出力を取得
    STACK_NAME="AccortoInfrastructure-$ENVIRONMENT"
    CDK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs' --output json)
    
    # 重要な値を抽出
    ECR_URI=$(echo $CDK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ECRRepositoryUri") | .OutputValue')
    APP_RUNNER_URL=$(echo $CDK_OUTPUTS | jq -r '.[] | select(.OutputKey=="AppRunnerServiceUrl") | .OutputValue')
    
    echo "📝 インフラストラクチャ情報:"
    echo "   ECR URI: $ECR_URI"
    echo "   App Runner URL: $APP_RUNNER_URL"
    
    cd ..
    
    # 環境変数ファイル生成
    generate_env_files "$CDK_OUTPUTS"
}

# 環境変数ファイル生成
generate_env_files() {
    local outputs=$1
    
    echo "⚙️  環境変数ファイルを生成中..."
    
    # フロントエンド用
    cat > .env.production.generated << EOF
# 自動生成された本番環境設定
VITE_API_BASE_URL=$(echo $outputs | jq -r '.[] | select(.OutputKey=="AppRunnerServiceUrl") | .OutputValue')/api

# アプリケーション個別設定
VITE_PORT_TABLE=5173
VITE_PORT_ADMIN=5174
VITE_PORT_KITCHEN=5175
VITE_PORT_STAFF=5176

# 本番環境設定
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_TABLE_NUMBER=test
EOF
    
    echo "✅ 環境変数ファイル生成完了"
}

# バックエンドデプロイ
deploy_backend() {
    echo "🔨 バックエンドをデプロイ中..."
    
    cd apps/backend
    
    # ECR URI取得
    STACK_NAME="AccortoInfrastructure-$ENVIRONMENT"
    ECR_URI=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' --output text)
    
    if [ -z "$ECR_URI" ]; then
        echo "❌ ECR URIが取得できません。インフラストラクチャが正しくデプロイされているか確認してください。"
        exit 1
    fi
    
    # ECRログイン
    echo "🔐 ECRにログイン中..."
    aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $ECR_URI
    
    # Dockerイメージビルド
    echo "🐳 Dockerイメージをビルド中..."
    IMAGE_TAG="$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
    docker build -t accorto-backend:$IMAGE_TAG .
    
    # ECRにタグ付け＆プッシュ
    docker tag accorto-backend:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
    docker tag accorto-backend:$IMAGE_TAG $ECR_URI:latest
    
    echo "☁️  ECRにプッシュ中..."
    docker push $ECR_URI:$IMAGE_TAG
    docker push $ECR_URI:latest
    
    # App Runnerサービス更新
    echo "🔄 App Runnerサービスを更新中..."
    SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='accorto-backend-$ENVIRONMENT'].ServiceArn" --output text)
    
    if [ -n "$SERVICE_ARN" ]; then
        aws apprunner start-deployment --service-arn $SERVICE_ARN
        echo "✅ バックエンドデプロイ完了（イメージ: $IMAGE_TAG）"
    else
        echo "⚠️  App Runnerサービスが見つかりません。初回デプロイ後に手動でサービスを作成してください。"
    fi
    
    cd ../..
}

# データベースマイグレーション
run_migrations() {
    echo "🗄️  データベースマイグレーションを実行中..."
    
    cd apps/backend
    
    # データベースURL取得
    STACK_NAME="AccortoInfrastructure-$ENVIRONMENT"
    DB_SECRET_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`DatabaseCredentialsSecret`].OutputValue' --output text)
    DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text)
    
    # シークレットから認証情報取得
    DB_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_ARN --query 'SecretString' --output text)
    DB_USERNAME=$(echo $DB_CREDENTIALS | jq -r '.username')
    DB_PASSWORD=$(echo $DB_CREDENTIALS | jq -r '.password')
    
    # マイグレーション実行
    export DATABASE_URL="postgres://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/accorto"
    npm run db:migrate
    
    # シードデータ（初回のみ）
    echo "🌱 シードデータを投入しますか? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        npm run db:seed
    fi
    
    cd ../..
}

# フロントエンドデプロイ
deploy_frontend() {
    echo "🎨 フロントエンドをデプロイ中..."
    
    # CDK出力から情報取得
    STACK_NAME="AccortoInfrastructure-$ENVIRONMENT"
    
    # 各アプリをデプロイ
    for app in table admin kitchen staff; do
        echo "📦 ${app}アプリをデプロイ中..."
        
        cd apps/$app
        
        # 依存関係インストール
        npm ci
        
        # ビルド（生成された環境変数ファイルを使用）
        cp ../../.env.production.generated .env.production
        npm run build -- --mode production
        
        # S3バケット名取得
        BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='${app^}BucketName'].OutputValue" --output text)
        
        # S3にアップロード
        aws s3 sync dist/ s3://$BUCKET_NAME/ --delete --cache-control "public, max-age=31536000"
        
        # index.htmlのキャッシュ設定変更
        aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html --cache-control "public, max-age=0, must-revalidate" --metadata-directive REPLACE
        
        # CloudFront無効化
        DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='${app^}CloudFrontUrl'].OutputValue" --output text | sed 's/https:\\/\\///' | sed 's/\\.cloudfront\\.net//')
        
        if [ -n "$DISTRIBUTION_ID" ]; then
            aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null
        fi
        
        cd ../..
        
        echo "✅ ${app}アプリデプロイ完了"
    done
}

# メイン実行
main() {
    check_prerequisites
    
    case $ACTION in
        "deploy")
            deploy_infrastructure
            if [ $? -eq 0 ]; then
                deploy_backend
                run_migrations
                deploy_frontend
                
                echo ""
                echo "🎉 デプロイ完了！"
                echo "🌍 アプリケーションURL:"
                
                STACK_NAME="AccortoInfrastructure-$ENVIRONMENT"
                for app in table admin kitchen staff; do
                    URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='${app^}CloudFrontUrl'].OutputValue" --output text)
                    echo "   ${app}: $URL"
                done
                
                API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='AppRunnerServiceUrl'].OutputValue" --output text)
                echo "   API: $API_URL"
            fi
            ;;
        "destroy"|"diff")
            deploy_infrastructure
            ;;
    esac
}

# 実行
main