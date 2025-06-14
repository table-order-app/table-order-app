# AWS デプロイメントガイド

このドキュメントでは、テーブルオーダーシステムをAWSにデプロイする手順を説明します。

## アーキテクチャ概要

```
┌─ CloudFront ─┐    ┌─ App Runner ─┐    ┌─ RDS ─┐
│ Frontend Apps │────│ Backend API  │────│ PostgreSQL │
└──────────────┘    └──────────────┘    └────────┘
        │                    │
        │                    │
   ┌─ S3 ─┐            ┌─ S3 ─┐
   │ Static │           │ Images │
   └───────┘           └────────┘
```

## 必要なAWSサービス

### 1. Amazon RDS for PostgreSQL
- **インスタンス**: db.t3.small（20-50店舗用）
- **ストレージ**: 20GB SSD
- **Multi-AZ**: 有効（高可用性）
- **自動バックアップ**: 7日間

### 2. AWS App Runner
- **ソース**: ECR（Docker）
- **CPU**: 1 vCPU
- **メモリ**: 2GB
- **スケーリング**: 1-10インスタンス

### 3. Amazon S3
- **4つのバケット**（各フロントエンドアプリ用）:
  - `your-table-app-bucket`
  - `your-admin-app-bucket`
  - `your-kitchen-app-bucket`
  - `your-staff-app-bucket`
- **1つのバケット**（画像保存用）:
  - `your-images-bucket`

### 4. Amazon CloudFront
- **4つのディストリビューション**（各フロントエンドアプリ用）
- **設定**: S3オリジン、gzip圧縮有効

### 5. Amazon ECR
- **リポジトリ**: `accorto-backend`

## デプロイ手順

### ステップ 1: AWS リソース作成

#### 1.1 RDS PostgreSQL作成
```bash
aws rds create-db-instance \
  --db-instance-identifier accorto-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username accorto_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --multi-az \
  --backup-retention-period 7
```

#### 1.2 S3バケット作成
```bash
# フロントエンドアプリ用
aws s3 mb s3://your-table-app-bucket
aws s3 mb s3://your-admin-app-bucket
aws s3 mb s3://your-kitchen-app-bucket
aws s3 mb s3://your-staff-app-bucket

# 画像保存用
aws s3 mb s3://your-images-bucket
```

#### 1.3 CloudFrontディストリビューション作成
各S3バケットに対してCloudFrontディストリビューションを作成します。

#### 1.4 ECRリポジトリ作成
```bash
aws ecr create-repository --repository-name accorto-backend
```

### ステップ 2: 環境変数設定

#### 2.1 バックエンド環境変数（App Runner）
```bash
# 必須環境変数
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://accorto_admin:PASSWORD@your-rds-endpoint:5432/accorto
ALLOWED_ORIGINS=https://table.yourdomain.com,https://admin.yourdomain.com,https://kitchen.yourdomain.com,https://staff.yourdomain.com
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your-images-bucket
CLOUDFRONT_URL=https://your-images-cloudfront.cloudfront.net
JWT_SECRET=your-super-secure-jwt-secret
```

#### 2.2 フロントエンド環境変数
各フロントエンドアプリの`.env.production`ファイルを更新:
```bash
VITE_API_BASE_URL=https://your-app-runner-domain.region.awsapprunner.com/api
```

### ステップ 3: デプロイ実行

#### 3.1 バックエンドデプロイ
```bash
# 実行権限付与
chmod +x scripts/deploy-backend.sh

# デプロイ実行
./scripts/deploy-backend.sh production
```

#### 3.2 データベースマイグレーション
```bash
cd apps/backend
DATABASE_URL=postgres://accorto_admin:PASSWORD@your-rds-endpoint:5432/accorto npm run db:migrate
DATABASE_URL=postgres://accorto_admin:PASSWORD@your-rds-endpoint:5432/accorto npm run db:seed
```

#### 3.3 フロントエンドデプロイ
```bash
# 実行権限付与
chmod +x scripts/deploy-frontend.sh

# 各アプリをデプロイ
./scripts/deploy-frontend.sh table production
./scripts/deploy-frontend.sh admin production
./scripts/deploy-frontend.sh kitchen production
./scripts/deploy-frontend.sh staff production
```

## コスト見積もり（月額）

### 20店舗での想定コスト
- **RDS db.t3.small**: ~$40
- **App Runner**: ~$25
- **S3**: ~$5
- **CloudFront**: ~$10
- **ECR**: ~$1
- **合計**: ~$81/月

### 100店舗での想定コスト
- **RDS db.t3.medium + リードレプリカ**: ~$120
- **App Runner**: ~$50
- **S3**: ~$15
- **CloudFront**: ~$30
- **ECR**: ~$2
- **合計**: ~$217/月

## 監視・運用

### CloudWatch設定
- **App Runner**: CPU使用率、メモリ使用率、リクエスト数
- **RDS**: CPU使用率、接続数、レプリケーションラグ
- **S3**: リクエスト数、エラー率

### ログ設定
- **App Runner**: CloudWatch Logsに自動出力
- **構造化ログ**: JSON形式で出力済み

### バックアップ戦略
- **RDS**: 自動バックアップ7日間
- **S3**: バージョニング有効
- **コード**: GitHubリポジトリ

## スケーリング戦略

### 50店舗まで
- 現在の構成で対応可能

### 100店舗まで
- **RDS**: db.t3.medium + リードレプリカ
- **App Runner**: インスタンス数増加

### 200店舗以上
- **Aurora PostgreSQL**への移行検討
- **複数リージョン**展開検討

## セキュリティ設定

### ネットワーク
- **VPC**: プライベートサブネット使用
- **セキュリティグループ**: 最小権限の原則

### 認証・認可
- **JWT**: 強力なシークレット
- **HTTPS**: 全通信暗号化

### データ保護
- **RDS暗号化**: 有効
- **S3暗号化**: 有効

## トラブルシューティング

### よくある問題

#### 1. CORS エラー
- `ALLOWED_ORIGINS`環境変数の確認
- CloudFrontドメインの設定確認

#### 2. データベース接続エラー
- `DATABASE_URL`の確認
- セキュリティグループの確認

#### 3. 画像アップロードエラー
- S3バケット権限の確認
- AWS認証情報の確認

### ログ確認方法
```bash
# App Runnerログ
aws logs tail /aws/apprunner/accorto-backend/application --follow

# RDSログ
aws rds describe-db-log-files --db-instance-identifier accorto-db
```

## 更新・メンテナンス

### 定期メンテナンス
- **RDS**: 月次メンテナンス窓口設定
- **App Runner**: ローリングアップデート
- **セキュリティパッチ**: 四半期ごと

### デプロイ戦略
- **Blue-Green**: 本番環境用
- **Canary**: 段階的リリース

---

## サポート

技術的な問題やデプロイに関する質問は、開発チームまでお問い合わせください。