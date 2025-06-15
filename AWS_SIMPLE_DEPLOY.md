# 🚀 AWS 超簡単デプロイ（セキュリティ無視版）

## 📋 前提条件
- AWSアカウント（無料枠OK）
- GitHubリポジトリ

## ⚡ App Runner デプロイ（最も簡単・約5分）

### 1. App Runner サービス作成
1. AWS Console で **App Runner** を検索
2. **"Create service"** をクリック
3. **Source**: "Source code repository" を選択
4. **Connect to GitHub** でこのリポジトリを選択
5. **Branch**: `main` または `develop`
6. **Root directory**: `apps/backend`

### 2. ビルド設定
- **Configuration file**: `apprunner-simple.yaml` を使用
- 他は全てデフォルトのまま

### 3. サービス設定
- **Service name**: `table-order-backend`
- **Virtual CPU**: 0.25 vCPU（最小）
- **Memory**: 0.5 GB（最小）
- **Port**: 3000

### 4. 環境変数（オプション）
```bash
# App Runner の環境変数セクションで設定
NODE_ENV=production
JWT_SECRET=test-secret-key-123
ALLOWED_ORIGINS=*
```

### 5. デプロイ実行
- **"Create & deploy"** をクリック
- 約3-5分で完了

### 6. 接続確認
デプロイ完了後のURL例:
```
https://xxxxxxxxx.region.awsapprunner.com/
```

## 💾 データベース（PostgreSQL）

### 簡単オプション1: Supabase（推奨）
1. [Supabase](https://supabase.com) でプロジェクト作成
2. 接続文字列をコピー
3. App Runner の環境変数に `DATABASE_URL` を設定

### 簡単オプション2: Render PostgreSQL
1. [Render](https://render.com) でPostgreSQL作成（無料）
2. 接続文字列をコピー  
3. App Runner の環境変数に設定

### 簡単オプション3: AWS RDS（有料だが統合）
1. RDS で PostgreSQL インスタンス作成
2. **パブリックアクセス**: 有効（セキュリティ無視）
3. **セキュリティグループ**: 0.0.0.0/0 許可
4. 接続文字列を App Runner に設定

## 🎯 コスト比較

| サービス | 月額コスト | セットアップ時間 | 難易度 |
|---------|-----------|----------------|---------|
| **App Runner + Supabase** | $0-5 | 5分 | ⭐☆☆☆☆ |
| **App Runner + RDS** | $15-25 | 10分 | ⭐⭐☆☆☆ |
| **EC2 + RDS** | $10-20 | 30分 | ⭐⭐⭐☆☆ |

## 🚨 セキュリティ無視設定

以下の設定で最大限簡単にしています：

```yaml
# apprunner-simple.yaml
env:
  - name: JWT_SECRET
    value: "test-secret-123"  # 固定値
  - name: ALLOWED_ORIGINS  
    value: "*"                # 全て許可
```

```sql
-- データベース（パブリック接続許可）
-- セキュリティグループ: 0.0.0.0/0
-- SSL: 無効
```

## 📝 デプロイ後の確認

1. **Health Check**:
   ```
   curl https://your-app-url.awsapprunner.com/health
   ```

2. **API テスト**:
   ```
   curl https://your-app-url.awsapprunner.com/api/menu/categories
   ```

## 🎉 フロントエンド接続

フロントエンドアプリの環境変数を更新：

```bash
# .env.production
VITE_API_BASE_URL=https://your-app-url.awsapprunner.com/api
```

## 🔧 その他のAWS簡単オプション

### AWS Amplify（フロントエンド重視）
- フロントエンド + API を同時デプロイ
- GitHub 連携で自動デプロイ
- 無料枠充実

### AWS Lambda + API Gateway（サーバーレス）
- 完全サーバーレス
- 従量課金（使用量ゼロなら無料）
- 少し設定が複雑

### AWS Lightsail（VPS風）
- 月額固定 $3.5〜
- WordPress感覚の簡単設定
- SSH アクセス可能

---

**推奨**: App Runner + Supabase の組み合わせが最も簡単で、5分でテスト環境が完成します！