# 🚀 Railway 簡単デプロイガイド

## 📋 前提条件
- GitHubアカウント
- このコードがGitHubリポジトリにpush済み

## 🚀 デプロイ手順（約10分）

### 1. Railwayアカウント作成
1. [Railway](https://railway.app) にアクセス
2. "Login with GitHub" でログイン
3. GitHubアカウント連携を許可

### 2. プロジェクト作成
1. Railway ダッシュボードで "New Project" をクリック
2. "Deploy from GitHub repo" を選択
3. このリポジトリを選択
4. "Deploy Now" をクリック

### 3. サービス設定

#### Backendサービス設定
1. プロジェクトページで Backend サービスをクリック
2. "Settings" タブを開く
3. "Root Directory" を `apps/backend` に設定
4. "Build Command" を `pnpm build` に設定
5. "Start Command" を `pnpm start` に設定

#### PostgreSQLデータベース追加
1. プロジェクトページで "New Service" をクリック
2. "Database" → "PostgreSQL" を選択
3. データベースが自動で作成される

### 4. 環境変数設定
Backend サービスの "Variables" タブで以下を設定：

```bash
NODE_ENV=production
JWT_SECRET=your-strong-32-character-jwt-secret-key-for-production
ALLOWED_ORIGINS=*
```

**注意**: `DATABASE_URL` と `PORT` は自動で設定されるので手動設定不要

### 5. デプロイ実行
1. "Deployments" タブを開く
2. "Deploy" ボタンをクリック
3. 数分待つとデプロイ完了

### 6. 動作確認
デプロイ完了後に表示されるURLにアクセス：
```
https://your-app-name.up.railway.app/
```

レスポンス例：
```json
{
  "status": "ok", 
  "message": "Accorto API Server"
}
```

## 🎯 フロントエンドアプリのAPI接続

各フロントエンドアプリの環境変数でAPI URLを設定：

```bash
# .env.production
VITE_API_BASE_URL=https://your-app-name.up.railway.app/api
```

## 📊 コスト

- **無料枠**: $5相当/月まで無料
- **小規模利用**: 月額 $0-10
- **データベース**: PostgreSQL無料付属

## 🔧 追加設定（オプション）

### カスタムドメイン
1. "Settings" → "Domains" でカスタムドメイン追加
2. DNS設定でCNAMEレコード追加

### データベースマイグレーション
初回デプロイ後、Railway CLIでマイグレーション実行：

```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト選択
railway link

# マイグレーション実行
railway run pnpm db:migrate

# シードデータ投入（必要に応じて）
railway run pnpm db:seed
```

## 🚨 トラブルシューティング

### ビルドエラーの場合
1. "Logs" タブでエラー内容確認
2. 依存関係の問題なら `pnpm install` を確認
3. TypeScriptエラーなら `pnpm build` をローカルで確認

### データベース接続エラーの場合
1. PostgreSQL サービスが起動していることを確認
2. `DATABASE_URL` 環境変数が自動設定されていることを確認

### CORS エラーの場合
1. `ALLOWED_ORIGINS` 環境変数にフロントエンドのURLを追加
2. 複数の場合はカンマ区切りで設定

## 📝 次のステップ

1. ✅ Backend デプロイ完了
2. フロントエンドアプリをNetlify/Vercelでデプロイ
3. 画像アップロード機能をCloudflare R2で最適化
4. 監視・ログ設定の追加

これで最小限の設定でテスト環境が稼働します！