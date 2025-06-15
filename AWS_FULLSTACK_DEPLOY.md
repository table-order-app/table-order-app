# 🚀 AWS フルスタック デプロイガイド

## 📋 構成概要

```
┌─ AWS インフラ構成 ───────────────────────────┐
│                                            │
│ フロントエンド (S3 + CloudFront)             │
│ ├─ table.accorto.com    (顧客アプリ)        │
│ ├─ admin.accorto.com    (管理者)            │
│ ├─ kitchen.accorto.com  (キッチン)          │
│ └─ staff.accorto.com    (スタッフ)          │
│                                            │
│ バックエンド (App Runner)                   │
│ └─ api.accorto.com      (API サーバー)     │
│                                            │
│ データベース (RDS PostgreSQL)                │
│ └─ accorto-db           (データストレージ)   │
│                                            │
└────────────────────────────────────────────┘
```

## ⏰ 総所要時間: 約30分

| フェーズ | 時間 | 難易度 |
|---------|------|--------|
| データベース作成 | 10分 | ⭐⭐☆☆☆ |
| バックエンドデプロイ | 5分 | ⭐☆☆☆☆ |
| フロントエンドデプロイ | 15分 | ⭐⭐☆☆☆ |

## 🗃️ Phase 1: データベース (RDS PostgreSQL)

### 1.1 RDS インスタンス作成
1. AWS Console で **RDS** を検索
2. **"Create database"** をクリック
3. 以下の設定を選択：

```yaml
Engine type: PostgreSQL
Version: PostgreSQL 15.x
Templates: Free tier
DB instance identifier: accorto-db
Master username: postgres
Master password: AccortoTest123!  # セキュリティ無視

DB instance class: db.t3.micro (無料枠)
Storage type: General Purpose SSD (gp2)
Allocated storage: 20 GB

VPC: Default VPC
Subnet group: default
Public access: Yes  # セキュリティ無視
VPC security groups: Create new
  - Name: accorto-db-sg
  - Inbound rules: PostgreSQL (5432) from Anywhere (0.0.0.0/0)

Database name: accorto
```

4. **"Create database"** をクリック（約10分で完了）

### 1.2 接続文字列取得
データベース作成完了後：
```bash
# 接続文字列の形式
DATABASE_URL=postgresql://postgres:AccortoTest123!@accorto-db.xxxxxxxxx.ap-northeast-1.rds.amazonaws.com:5432/accorto
```

### 1.3 初期設定実行
```bash
# pgAdminまたはpsqlで接続してSQLスクリプト実行
psql -h accorto-db.xxxxxxxxx.ap-northeast-1.rds.amazonaws.com -U postgres -d accorto -f aws-rds-setup.sql
```

## 🖥️ Phase 2: バックエンド (App Runner)

### 2.1 App Runner サービス作成
1. AWS Console で **App Runner** を検索
2. **"Create service"** をクリック
3. 設定内容：

```yaml
Source type: Source code repository
Repository provider: GitHub
Repository: [このリポジトリを選択]
Branch: main
Source directory: apps/backend

Build settings:
  Configuration file: Use configuration file
  Configuration file path: apprunner-simple.yaml

Service settings:
  Service name: accorto-backend
  Virtual CPU: 0.25 vCPU
  Memory: 0.5 GB
  Environment variables:
    DATABASE_URL: [Phase 1で取得した接続文字列]
```

4. **"Create & deploy"** をクリック（約5分で完了）

### 2.2 API URL取得
デプロイ完了後、以下の形式でURLが生成されます：
```
https://xxxxxxxxx.ap-northeast-1.awsapprunner.com
```

### 2.3 データベースマイグレーション
```bash
# App Runnerのコンソールから実行、またはローカルから
DATABASE_URL="[RDS接続文字列]" pnpm db:migrate
DATABASE_URL="[RDS接続文字列]" pnpm db:seed
```

## 🎨 Phase 3: フロントエンド (S3 + CloudFront)

### 3.1 AWS CLI設定
```bash
# AWS CLIインストール（未インストールの場合）
pip install awscli

# 認証情報設定
aws configure
# Access Key ID: [IAMユーザーのアクセスキー]
# Secret Access Key: [IAMユーザーのシークレットキー]  
# Default region: ap-northeast-1
# Default output format: json
```

### 3.2 環境変数更新
各アプリの `.env.aws` ファイルでAPI URLを更新：

```bash
# apps/table/.env.aws
VITE_API_BASE_URL=https://xxxxxxxxx.ap-northeast-1.awsapprunner.com/api

# apps/admin/.env.aws  
VITE_API_BASE_URL=https://xxxxxxxxx.ap-northeast-1.awsapprunner.com/api

# apps/kitchen/.env.aws
VITE_API_BASE_URL=https://xxxxxxxxx.ap-northeast-1.awsapprunner.com/api

# apps/staff/.env.aws
VITE_API_BASE_URL=https://xxxxxxxxx.ap-northeast-1.awsapprunner.com/api
```

### 3.3 各アプリデプロイ実行
```bash
# デプロイスクリプトに実行権限付与
chmod +x aws-s3-deploy.sh

# 各アプリを順番にデプロイ
./aws-s3-deploy.sh table accorto-table-app
./aws-s3-deploy.sh admin accorto-admin-app  
./aws-s3-deploy.sh kitchen accorto-kitchen-app
./aws-s3-deploy.sh staff accorto-staff-app
```

## 🌐 Phase 4: カスタムドメイン設定（オプション）

### 4.1 Route 53でドメイン設定
```bash
# ホストゾーン作成
aws route53 create-hosted-zone --name accorto.com --caller-reference $(date +%s)

# CNAMEレコード追加
table.accorto.com    -> [TableアプリのCloudFront URL]
admin.accorto.com    -> [AdminアプリのCloudFront URL]
kitchen.accorto.com  -> [KitchenアプリのCloudFront URL]
staff.accorto.com    -> [StaffアプリのCloudFront URL]
api.accorto.com      -> [App Runner URL]
```

## 📊 動作確認

### 4.1 バックエンドAPI確認
```bash
# Health check
curl https://[APP_RUNNER_URL]/health

# API動作確認
curl https://[APP_RUNNER_URL]/api/menu/categories
```

### 4.2 フロントエンド確認
各アプリのS3/CloudFront URLにブラウザでアクセス：
- 顧客アプリ: メニュー表示確認
- 管理者アプリ: ログイン画面確認
- キッチンアプリ: オーダー画面確認  
- スタッフアプリ: テーブル管理確認

## 💰 コスト見積もり

| サービス | 月額コスト（小規模） |
|---------|------------------|
| RDS t3.micro | $0（12ヶ月無料） |
| App Runner | $5-10 |
| S3 + CloudFront | $1-3 |
| Route 53 | $0.5/domain |
| **合計** | **$6-14/月** |

## 🚨 セキュリティ注意事項

この構成はテスト用でセキュリティを無視しています：

⚠️ **本番運用前に必須の修正**:
- RDSのパブリックアクセス無効化
- セキュリティグループの制限
- IAMロール・ポリシーの最小権限設定
- JWT秘密鍵の強化
- HTTPS強制設定
- WAF設定

## 🎉 デプロイ完了後

全ての設定が完了すると、以下のURLでアクセス可能：

```
🏠 顧客アプリ:    https://[CLOUDFRONT_URL]
👨‍💼 管理者アプリ:  https://[CLOUDFRONT_URL]  
👨‍🍳 キッチンアプリ: https://[CLOUDFRONT_URL]
👨‍💼 スタッフアプリ:  https://[CLOUDFRONT_URL]
🔌 API:          https://[APP_RUNNER_URL]/api
```

テストデータでログイン可能：
- 管理者: admin@example.com / password123
- スタッフ: staff1@example.com / password123

---

**🎯 次のステップ**: カスタムドメイン設定、SSL証明書、監視設定を追加