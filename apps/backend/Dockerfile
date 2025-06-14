# AWS App Runner対応Dockerfile

# マルチステージビルド - 依存関係のインストール
FROM node:18-alpine AS deps
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY tsconfig*.json ./

# 本番用依存関係のみインストール
RUN npm ci --only=production && npm cache clean --force

# ビルドステージ
FROM node:18-alpine AS builder
WORKDIR /app

# ソースコードをコピー
COPY package*.json ./
COPY tsconfig*.json ./
COPY src/ ./src/

# 開発依存関係を含めてインストール
RUN npm ci

# TypeScriptビルド
RUN npm run build

# 本番実行ステージ
FROM node:18-alpine AS runner
WORKDIR /app

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# 本番用依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# ビルド済みアプリケーションをコピー
COPY --from=builder /app/dist ./dist

# package.jsonをコピー（スタートスクリプト用）
COPY package*.json ./

# ログディレクトリ作成（開発環境用）
RUN mkdir -p logs && chown -R nodeuser:nodejs logs

# 権限を設定
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# App Runnerデフォルトポート
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 8080, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) { console.log('Health check passed'); process.exit(0); } \
      else { console.log('Health check failed'); process.exit(1); } \
    }); \
    req.on('error', () => { console.log('Health check error'); process.exit(1); }); \
    req.on('timeout', () => { console.log('Health check timeout'); process.exit(1); }); \
    req.end();"

# アプリケーション起動
CMD ["npm", "start"]