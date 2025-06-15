# 🚀 Terraform で AWS フルスタックデプロイ

## ⚡ 超簡単デプロイ（約10分）

### **前提条件**
```bash
# Terraform インストール
brew install terraform  # macOS
# または https://terraform.io/downloads

# AWS CLI 設定
aws configure
```

### **1コマンドでフルスタック作成**
```bash
./deploy-with-terraform.sh
```

このコマンドで以下が自動作成されます：
- ✅ RDS PostgreSQL データベース
- ✅ S3 バケット × 4個（各フロントエンドアプリ用）
- ✅ CloudFront ディストリビューション × 4個
- ✅ セキュリティグループ
- ✅ データベースマイグレーション実行
- ✅ シードデータ投入

## 📋 作成されるもの

```
🗄️ Database:
└── accorto-db (PostgreSQL 15.8, db.t3.micro)

☁️ S3 Buckets:
├── accorto-table-[random]
├── accorto-admin-[random]  
├── accorto-kitchen-[random]
└── accorto-staff-[random]

🌍 CloudFront:
├── Table App Distribution
├── Admin App Distribution
├── Kitchen App Distribution  
└── Staff App Distribution
```

## 🎯 デプロイ手順

### **Step 1: インフラ作成**
```bash
./deploy-with-terraform.sh
# 約5分で完了
```

### **Step 2: App Runner作成（手動）**
AWS Console → App Runner → Create service
- Repository: このGitHubリポジトリ
- Root directory: `apps/backend`
- Environment variable: `DATABASE_URL`（Step 1で出力）

### **Step 3: フロントエンドデプロイ**
```bash
./deploy-frontend-to-s3.sh https://your-app-runner-url.awsapprunner.com
# 約3分で完了
```

## 💰 月額コスト

| リソース | コスト |
|---------|--------|
| RDS t3.micro | 無料（12ヶ月） |
| S3 | $1-2 |
| CloudFront | $1-2 |
| App Runner | $5-10 |
| **合計** | **$7-14** |

## 🔧 カスタマイズ

### **設定変更**
```bash
# terraform/terraform.tfvars を編集
aws_region   = "ap-northeast-1"
project_name = "your-project"
db_password  = "YourSecurePassword123!"
```

### **リソース削除**
```bash
cd terraform
terraform destroy
```

## 🚨 トラブルシューティング

### **Terraform エラー**
```bash
cd terraform
terraform plan  # エラー詳細確認
```

### **AWS認証エラー**
```bash
aws sts get-caller-identity  # 認証確認
aws configure list           # 設定確認
```

### **S3アップロードエラー**
```bash
aws s3 ls  # S3アクセス確認
```

## 🎉 デプロイ完了後

アクセス可能なURL:
- 🏠 顧客アプリ: `https://[cloudfront-domain]`
- 👨‍💼 管理者アプリ: `https://[cloudfront-domain]`
- 👨‍🍳 キッチンアプリ: `https://[cloudfront-domain]`
- 👨‍💼 スタッフアプリ: `https://[cloudfront-domain]`

テストログイン:
- 管理者: `admin@example.com` / `password123`
- スタッフ: `staff1@example.com` / `password123`

---

**🎯 Terraformの利点**: 
- 1コマンドで全インフラ作成
- 設定ミスが少ない
- 簡単にリソース削除
- Infrastructure as Code