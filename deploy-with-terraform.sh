#!/bin/bash

# Terraform を使用したAWSフルスタックデプロイ
# 使用方法: ./deploy-with-terraform.sh

set -e

echo "🚀 Starting Terraform deployment..."

# Terraformがインストールされているかチェック
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first:"
    echo "   macOS: brew install terraform"
    echo "   Other: https://terraform.io/downloads"
    exit 1
fi

# AWS CLIがインストールされているかチェック
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   pip install awscli"
    exit 1
fi

# AWS認証情報をチェック
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Terraformディレクトリに移動
cd terraform

# Terraform初期化
echo "📦 Initializing Terraform..."
terraform init

# プランの確認
echo "📋 Creating Terraform plan..."
terraform plan

# ユーザー確認
echo ""
read -p "🤔 Do you want to apply this plan? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Terraform適用
echo "🚀 Applying Terraform configuration..."
terraform apply -auto-approve

# 出力値を取得
echo ""
echo "📋 Getting output values..."

DATABASE_URL=$(terraform output -raw database_url)
DATABASE_ENDPOINT=$(terraform output -raw database_endpoint)

echo "✅ Infrastructure deployment completed!"
echo ""
echo "📊 Infrastructure Summary:"
echo "🗄️  Database: $DATABASE_ENDPOINT"
echo "☁️  S3 Buckets: 4 buckets created"
echo "🌍 CloudFront: 4 distributions created"
echo ""

# 環境変数ファイル作成
echo "📝 Creating environment files..."

# Backend環境変数
cat > ../apps/backend/.env.aws << EOF
NODE_ENV=production
DATABASE_URL=$DATABASE_URL
JWT_SECRET=aws-test-jwt-secret-key-32-characters-minimum
ALLOWED_ORIGINS=*
LOG_LEVEL=info
EOF

echo "✅ Backend environment file created: apps/backend/.env.aws"

# S3バケット名を取得してフロントエンド用環境変数作成
BUCKET_TABLE=$(terraform output -json s3_buckets | jq -r '.table')
BUCKET_ADMIN=$(terraform output -json s3_buckets | jq -r '.admin')
BUCKET_KITCHEN=$(terraform output -json s3_buckets | jq -r '.kitchen')
BUCKET_STAFF=$(terraform output -json s3_buckets | jq -r '.staff')

# フロントエンド環境変数（App Runner URL は後で更新）
cat > ../apps/table/.env.aws << EOF
VITE_API_BASE_URL=https://YOUR_APP_RUNNER_URL.awsapprunner.com/api
VITE_TABLE_NUMBER=1
VITE_STORE_ID=1
VITE_APP_ENV=production
EOF

cat > ../apps/admin/.env.aws << EOF
VITE_API_BASE_URL=https://YOUR_APP_RUNNER_URL.awsapprunner.com/api
VITE_APP_ENV=production
EOF

cat > ../apps/kitchen/.env.aws << EOF
VITE_API_BASE_URL=https://YOUR_APP_RUNNER_URL.awsapprunner.com/api
VITE_APP_ENV=production
EOF

cat > ../apps/staff/.env.aws << EOF
VITE_API_BASE_URL=https://YOUR_APP_RUNNER_URL.awsapprunner.com/api
VITE_APP_ENV=production
EOF

echo "✅ Frontend environment files created"

# データベースマイグレーション実行
echo ""
echo "🗄️ Running database migrations..."
cd ../apps/backend

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔄 Running migrations..."
DATABASE_URL="$DATABASE_URL" pnpm db:migrate

echo "🌱 Seeding database..."
DATABASE_URL="$DATABASE_URL" pnpm db:seed

cd ../../terraform

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Create App Runner service:"
echo "   - Go to AWS Console → App Runner"
echo "   - Create service from GitHub"
echo "   - Use apps/backend directory"
echo "   - Add DATABASE_URL environment variable"
echo ""
echo "2. Deploy frontend apps:"
echo "   cd .. && ./deploy-frontend-to-s3.sh [APP_RUNNER_URL]"
echo ""
echo "3. Access your applications:"
terraform output cloudfront_urls

cd ..