# Accorto Backend

Accorto バックエンドは、テーブルオーダーシステムのAPIサーバーです。Honoフレームワークを使用し、PostgreSQLデータベースと連携しています。

## 技術スタック

- [Hono](https://hono.dev/) - 高速で軽量なWebフレームワーク
- [PostgreSQL](https://www.postgresql.org/) - リレーショナルデータベース
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript用のORM
- [Zod](https://zod.dev/) - TypeScriptファーストのスキーマバリデーションライブラリ

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- pnpm
- PostgreSQL

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定

# データベースマイグレーションの実行
pnpm db:generate
pnpm db:migrate
```

### 開発サーバーの起動

```bash
pnpm dev
```

サーバーは http://localhost:3000 で起動します。

## APIエンドポイント

バックエンドは以下の主要なAPIエンドポイントを提供します：

- `/api/menu` - メニュー管理API
- `/api/order` - 注文管理API
- `/api/table` - テーブル管理API
- `/api/staff` - スタッフ管理API
- `/api/setting` - 設定管理API

詳細なAPIドキュメントは開発中です。

## データベーススキーマ

データベーススキーマは `src/db/schema` ディレクトリで定義されています。主要なテーブルは以下の通りです：

- メニュー関連: `categories`, `menu_items`, `options`, `toppings`, `allergens`
- 注文関連: `orders`, `order_items`, `order_item_options`, `order_item_toppings`
- テーブル関連: `tables`
- スタッフ関連: `staff_members`
- 設定関連: `settings`, `store_info`

## スクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - プロダクション用にビルド
- `pnpm start` - ビルドされたアプリケーションを起動
- `pnpm db:generate` - Drizzleマイグレーションファイルを生成
- `pnpm db:migrate` - データベースマイグレーションを実行
- `pnpm db:studio` - Drizzle Studioを起動してデータベースを視覚的に管理
