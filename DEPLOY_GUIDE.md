# 🚀 Accorto 完全自動デプロイガイド

## ✨ 100%コマンドでのデプロイ

### 🎯 ワンコマンドデプロイ

```bash
# 本番環境デプロイ
./scripts/deploy.sh production deploy

# ステージング環境デプロイ  
./scripts/deploy.sh staging deploy
```

## 🛠️ 事前準備（初回のみ）

### 1. AWS CLIセットアップ
```bash
# AWS CLI インストール
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# AWS認証設定
aws configure
```

### 2. 必要な権限
AWSアカウントに以下の権限が必要：
- **Administrator権限**（推奨）
- または個別権限：
  - CloudFormation: 全権限
  - RDS: 全権限  
  - S3: 全権限
  - CloudFront: 全権限
  - App Runner: 全権限
  - ECR: 全権限
  - IAM: ロール作成・管理
  - Secrets Manager: 全権限

### 3. JWTシークレット作成
```bash
# JWT用のシークレット作成（初回のみ）
aws secretsmanager create-secret \
  --name "accorto-jwt-secret" \
  --description "JWT secret for Accorto application" \
  --secret-string '{"secret":"your-super-secure-jwt-secret-here"}'
```

## 📋 デプロイコマンド一覧

### フルデプロイ
```bash
# 本番環境にフルデプロイ
./scripts/deploy.sh production deploy

# ステージング環境にフルデプロイ
./scripts/deploy.sh staging deploy
```

### インフラ確認
```bash
# インフラの差分確認
./scripts/deploy.sh production diff

# インフラ削除（注意！）
./scripts/deploy.sh production destroy
```

### 個別デプロイ（更新時）
```bash
# バックエンドのみ更新
cd apps/backend
docker build -t accorto-backend .
# （ECRプッシュとApp Runner更新）

# フロントエンドのみ更新
cd apps/table
npm run build
aws s3 sync dist/ s3://bucket-name/
```

## 🏗️ 自動作成されるリソース

### AWS インフラストラクチャ
1. **VPC**: 2AZ、NAT Gateway 1つ
2. **RDS PostgreSQL**: db.t3.small、Multi-AZ
3. **S3**: 画像用1つ + フロントエンド4つ
4. **CloudFront**: 画像用1つ + フロントエンド4つ  
5. **ECR**: バックエンドコンテナ用
6. **App Runner**: バックエンドAPI
7. **Secrets Manager**: DB認証情報
8. **IAM**: 必要なロール・ポリシー

### 自動設定される環境変数
```bash
# バックエンド（App Runner）
NODE_ENV=production
DATABASE_URL=（自動生成）
ALLOWED_ORIGINS=（CloudFrontドメイン自動設定）
S3_BUCKET_NAME=（自動設定）
CLOUDFRONT_URL=（自動設定）

# フロントエンド（各アプリ）
VITE_API_BASE_URL=（App Runnerドメイン自動設定）
```

## ⏱️ デプロイ時間

### 初回デプロイ
- **インフラ作成**: 約15分
- **バックエンド**: 約5分
- **フロントエンド**: 約10分
- **合計**: 約30分

### 更新デプロイ
- **バックエンドのみ**: 約3分
- **フロントエンドのみ**: 約5分

## 💰 コスト見積もり

### 20店舗運用時（月額）
```
RDS db.t3.small (Multi-AZ)   : $80
App Runner (1vCPU, 2GB)      : $25  
S3 + CloudFront             : $15
ECR                         : $1
Secrets Manager             : $1
NAT Gateway                 : $45
合計                        : $167/月
```

### 100店舗運用時（月額）
```
RDS db.t3.medium (Multi-AZ)  : $160
App Runner (スケールアップ)   : $50
S3 + CloudFront             : $30
その他                      : $47
合計                        : $287/月
```

## 🔍 監視・運用

### ログ確認
```bash
# App Runnerログ
aws logs tail /aws/apprunner/accorto-backend-production/application --follow

# RDSログ
aws rds describe-db-log-files --db-instance-identifier accorto-database-production
```

### パフォーマンス監視
- **CloudWatch**: 自動でメトリクス収集
- **RDS Performance Insights**: 有効化済み
- **App Runner**: CPU/メモリ使用率監視

### バックアップ戦略
- **RDS**: 7日間自動バックアップ
- **S3**: バージョニング有効
- **コード**: Git履歴

## 🚨 トラブルシューティング

### よくある問題

#### 1. デプロイが失敗する
```bash
# ログ確認
aws cloudformation describe-stack-events --stack-name AccortoInfrastructure-production

# 権限確認
aws sts get-caller-identity
```

#### 2. App Runnerが起動しない
```bash
# App Runnerログ確認
aws apprunner describe-service --service-arn <service-arn>

# 環境変数確認
aws apprunner describe-service --service-arn <service-arn> --query 'Service.SourceConfiguration'
```

#### 3. データベースに接続できない
```bash
# セキュリティグループ確認
aws ec2 describe-security-groups --group-names default

# 認証情報確認
aws secretsmanager get-secret-value --secret-id <secret-arn>
```

## 🔄 更新フロー

### 開発から本番まで
1. **ローカル開発**: `pnpm dev`
2. **コミット＆プッシュ**: Git
3. **本番デプロイ**: `./scripts/deploy.sh production deploy`

### ホットフィックス
```bash
# 緊急修正の場合
./scripts/deploy.sh production deploy
```

### ダウンタイムゼロ更新
- **App Runner**: ローリング更新（自動）
- **CloudFront**: キャッシュ無効化（自動）
- **RDS**: Multi-AZ（自動フェイルオーバー）

## 🔒 セキュリティ設定

### ネットワーク
- **VPC**: プライベートサブネット使用
- **RDS**: インターネットアクセス無効
- **セキュリティグループ**: 最小権限

### 暗号化
- **RDS**: 保存時暗号化
- **S3**: 保存時暗号化
- **通信**: HTTPS/TLS

### 認証
- **JWT**: Secrets Manager管理
- **データベース**: Secrets Manager管理
- **IAM**: 最小権限ロール

## 📞 サポート

### 技術サポート
- **ドキュメント**: このファイル
- **ログ**: CloudWatch Logs
- **監視**: CloudWatch Metrics

### 緊急時対応
```bash
# 全サービス停止
./scripts/deploy.sh production destroy

# 特定サービスのみ停止
aws apprunner pause-service --service-arn <service-arn>
```

---

## 🎉 完了！

これで**100%コマンドライン**でのデプロイが可能です。

```bash
# 一度だけ実行すれば全て完了
./scripts/deploy.sh production deploy
```