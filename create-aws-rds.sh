#!/bin/bash

# AWS CLI でRDS PostgreSQLを作成するスクリプト
# 使用方法: ./create-aws-rds.sh

set -e

echo "🗄️ Creating RDS PostgreSQL database..."

# 変数設定
DB_IDENTIFIER="accorto-db"
DB_NAME="accorto"
MASTER_USERNAME="postgres"
MASTER_PASSWORD="AccortoTest123!"
REGION="ap-northeast-1"

echo "📝 Database settings:"
echo "  DB Identifier: $DB_IDENTIFIER"
echo "  Database Name: $DB_NAME"
echo "  Master Username: $MASTER_USERNAME"
echo "  Region: $REGION"

# セキュリティグループ作成
echo "🔒 Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name accorto-db-sg \
  --description "Security group for Accorto PostgreSQL database" \
  --region $REGION \
  --query 'GroupId' --output text)

echo "✅ Security Group created: $SECURITY_GROUP_ID"

# PostgreSQLアクセス許可ルール追加（セキュリティ無視）
echo "🌐 Adding inbound rule for PostgreSQL..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region $REGION

echo "✅ Inbound rule added (0.0.0.0/0:5432)"

# RDS DBインスタンス作成
echo "🚀 Creating RDS DB instance..."
aws rds create-db-instance \
  --db-instance-identifier $DB_IDENTIFIER \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.8 \
  --master-username $MASTER_USERNAME \
  --master-user-password $MASTER_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name $DB_NAME \
  --vpc-security-group-ids $SECURITY_GROUP_ID \
  --publicly-accessible \
  --no-multi-az \
  --storage-encrypted \
  --backup-retention-period 0 \
  --no-deletion-protection \
  --region $REGION

echo "⏳ RDS instance creation started. This will take about 5-10 minutes..."

# 作成状況を監視
echo "📊 Monitoring creation progress..."
while true; do
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_IDENTIFIER \
    --region $REGION \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text 2>/dev/null || echo "creating")
  
  echo "   Current status: $STATUS"
  
  if [ "$STATUS" = "available" ]; then
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Database creation failed!"
    exit 1
  fi
  
  sleep 30
done

# エンドポイント取得
ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_IDENTIFIER \
  --region $REGION \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

PORT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_IDENTIFIER \
  --region $REGION \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)

# 接続文字列生成
DATABASE_URL="postgresql://$MASTER_USERNAME:$MASTER_PASSWORD@$ENDPOINT:$PORT/$DB_NAME"

echo ""
echo "🎉 RDS PostgreSQL database created successfully!"
echo ""
echo "📋 Connection Details:"
echo "  Endpoint: $ENDPOINT"
echo "  Port: $PORT"
echo "  Database: $DB_NAME"
echo "  Username: $MASTER_USERNAME"
echo "  Password: $MASTER_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "  DATABASE_URL=$DATABASE_URL"
echo ""
echo "💾 Saving connection string to .env.aws..."

# 環境変数ファイル作成
cat > apps/backend/.env.aws << EOF
# AWS環境用設定
NODE_ENV=production
DATABASE_URL=$DATABASE_URL
JWT_SECRET=aws-test-jwt-secret-key-32-characters-minimum
ALLOWED_ORIGINS=*
LOG_LEVEL=info
EOF

echo "✅ Environment file created: apps/backend/.env.aws"
echo ""
echo "🔧 Next steps:"
echo "1. Run database migration: DATABASE_URL='$DATABASE_URL' pnpm db:migrate"
echo "2. Run database seeding: DATABASE_URL='$DATABASE_URL' pnpm db:seed"
echo "3. Create App Runner service with this DATABASE_URL"