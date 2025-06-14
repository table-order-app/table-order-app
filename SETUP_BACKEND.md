# バックエンド依存関係セットアップ

## 現在のエラー修正手順

### 1. 依存関係のインストール

```bash
cd /Users/itouharuki/hukugyou/tableorder/dev/apps/backend
pnpm install
```

または、npm/yarnを使用している場合：

```bash
npm install
# または
yarn install
```

### 2. 不足している依存関係の確認

追加された依存関係：
- `winston`: 構造化ログ
- `@aws-sdk/client-s3`: S3アップロード機能

### 3. 開発環境用の緊急対応

依存関係のインストールができない場合、以下の修正により一時的に動作させることができます：

1. `src/index.ts` のインポートを変更：
```typescript
// 変更前
import { logger as structuredLogger, logError, logInfo } from './utils/logger'

// 変更後（一時的）
import { logger as structuredLogger, logError, logInfo } from './utils/logger-simple'
```

2. S3機能を無効化する環境変数設定：
```bash
# .env.development に追加
NODE_ENV=development
# S3設定をコメントアウトまたは削除
```

### 4. 開発サーバー起動

```bash
npm run dev
```

### 5. 動作確認

```bash
curl http://localhost:3000/health
```

期待される応答：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T...",
  "services": {
    "database": "healthy",
    "s3": "local"
  }
}
```