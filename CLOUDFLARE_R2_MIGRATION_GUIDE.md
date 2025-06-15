# Cloudflare R2 移行ガイド

このガイドでは、現在のローカルファイルストレージからCloudflare R2オブジェクトストレージへの移行方法について説明します。

## 📋 目次

1. [移行の概要](#移行の概要)
2. [R2の設定](#r2の設定)
3. [実装の詳細](#実装の詳細)
4. [移行手順](#移行手順)
5. [比較・評価](#比較評価)
6. [トラブルシューティング](#トラブルシューティング)

## 移行の概要

### 現在の実装
- **ストレージ**: ローカルファイルシステム (`./public/uploads/`)
- **URL形式**: `/uploads/menu/filename.jpg`
- **制限事項**: 
  - サーバーのディスク容量に依存
  - 複数サーバー環境での同期困難
  - CDN機能なし

### 移行後の実装
- **ストレージ**: Cloudflare R2
- **URL形式**: `https://pub-accountid.r2.dev/menu/filename.jpg`
- **利点**:
  - 無制限のストレージ容量
  - 高可用性・高信頼性
  - グローバルCDN
  - ゼロエグレス料金

## R2の設定

### 1. Cloudflareアカウントの準備

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 右サイドバーから「R2 Object Storage」を選択
3. 「Get Started」をクリック

### 2. R2バケットの作成

```bash
# Wranglerを使用する場合
npm install -g wrangler
wrangler r2 bucket create tableorder-images
```

または、ダッシュボードから：
1. 「Create bucket」をクリック
2. バケット名: `tableorder-images`
3. 地域: `Automatic`（推奨）

### 3. API トークンの生成

1. Dashboard > R2 > Manage R2 API tokens
2. 「Create API token」をクリック
3. 権限: `Object Read & Write`
4. 生成されたトークンを保存

### 4. 環境変数の設定

```bash
# .envファイルに追加
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=tableorder-images

# オプション: カスタムドメイン
# R2_PUBLIC_DOMAIN=images.yourdomain.com
```

## 実装の詳細

### 新しいファイル構成

```
apps/backend/src/
├── utils/
│   ├── r2.ts              # R2操作のメインユーティリティ
│   └── s3.ts              # 既存実装（後方互換性のため保持）
├── scripts/
│   └── migrate-to-r2.ts   # 移行スクリプト
└── routes/
    └── menu.ts            # R2対応済み
```

### 主要な変更点

#### 1. 依存関係の追加

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.699.0",
    "@aws-sdk/s3-request-presigner": "^3.699.0"
  }
}
```

#### 2. 新しいユーティリティ関数

```typescript
// apps/backend/src/utils/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export async function uploadImageToR2(file: File, folder: string): Promise<string>
export async function deleteImageFromR2(imagePath: string): Promise<void>
export function isR2Enabled(): boolean
```

#### 3. 自動フォールバック機能

```typescript
export async function saveImage(file: File, folder: string = 'menu'): Promise<string> {
  if (isR2Enabled()) {
    return uploadImageToR2(file, folder)
  } else {
    return saveImageLocally(file, folder)  // 従来通りローカル保存
  }
}
```

## 移行手順

### ステップ 1: 依存関係のインストール

```bash
cd apps/backend
pnpm install
```

### ステップ 2: 環境変数の設定

```bash
# .env.example.r2 を参考に .env を更新
cp .env.example.r2 .env
# 実際の値に編集
```

### ステップ 3: R2接続テスト

```bash
# 新しい画像をアップロードしてR2が動作することを確認
# 管理画面からメニュー画像を追加してみる
```

### ステップ 4: 既存データの移行

```bash
# 移行スクリプトの実行
pnpm migrate:r2
```

移行スクリプトの処理内容：
- データベースから画像パスを持つメニューアイテムを取得
- ローカルファイルをR2にアップロード
- データベースのURLをR2のURLに更新
- 進捗とエラーを詳細レポート

### ステップ 5: 動作確認

1. 管理画面で既存の画像が正常に表示されることを確認
2. 新しい画像のアップロードが正常に動作することを確認
3. 顧客向けアプリで画像が正常に表示されることを確認

### ステップ 6: ローカルファイルの削除（オプション）

```bash
# R2での動作確認後、ローカルファイルを削除
rm -rf ./public/uploads/
```

## 比較・評価

### 実装の複雑さ

| 項目 | 現在（ローカル） | R2移行後 | 評価 |
|------|------------------|----------|------|
| 初期設定 | 簡単 | 中程度 | ⚠️ Cloudflareアカウント・API設定が必要 |
| コード変更 | - | 小規模 | ✅ 既存APIとの互換性を保持 |
| 依存関係 | なし | AWS SDK追加 | ⚠️ 約10MBのサイズ増加 |

### パフォーマンス

| 項目 | 現在（ローカル） | R2移行後 | 評価 |
|------|------------------|----------|------|
| アップロード速度 | 高速 | 中速 | ⚠️ ネットワーク経由のため少し遅い |
| 画像配信速度 | サーバー依存 | 高速 | ✅ グローバルCDN利用 |
| レスポンス時間 | 低 | 低 | ✅ Cloudflareの高速ネットワーク |

### コスト

| 項目 | 現在（ローカル） | R2移行後 | 評価 |
|------|------------------|----------|------|
| ストレージ | サーバー代に含む | $0.015/GB/月 | ✅ 小規模なら無料枠内 |
| 転送量 | サーバー代に含む | **無料** | ✅ エグレス料金ゼロ |
| 運用コスト | 高（管理・バックアップ） | 低 | ✅ マネージドサービス |

### セキュリティ

| 項目 | 現在（ローカル） | R2移行後 | 評価 |
|------|------------------|----------|------|
| アクセス制御 | サーバー設定依存 | IAM・署名付きURL | ✅ 細かな権限制御 |
| 暗号化 | 設定次第 | デフォルト有効 | ✅ 保存時・転送時暗号化 |
| 可用性 | サーバー依存 | 99.9%+ | ✅ 高可用性設計 |

### 既存データの移行容易性

| 項目 | 評価 | 備考 |
|------|------|------|
| 移行ツール | ✅ 優秀 | 自動化スクリプト提供 |
| ダウンタイム | ✅ ゼロ | 段階的移行可能 |
| ロールバック | ⚠️ 注意 | URL変更のため事前バックアップ推奨 |

## 具体的な実装例

### 画像アップロード処理

```typescript
// apps/backend/src/routes/menu.ts
import { saveImage } from '../utils/r2'

// FormDataでの画像アップロード
menuRoutes.post('/items-with-file', async (c) => {
  const body = await c.req.formData()
  const imageFile = body.get('image') as File
  
  if (imageFile && imageFile.size > 0) {
    // 自動的にR2またはローカルに保存
    const imagePath = await saveImage(imageFile, 'menu')
    
    // データベースに保存
    await db.insert(menuItems).values({
      // ...
      image: imagePath  // R2のURL or ローカルパス
    })
  }
})
```

### 画像削除処理

```typescript
import { deleteOldImage } from '../utils/r2'

// メニュー削除時の画像削除
menuRoutes.delete('/items/:id', async (c) => {
  const menuItem = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id)
  })
  
  if (menuItem?.image) {
    // R2またはローカルから画像を削除
    await deleteOldImage(menuItem.image)
  }
  
  // データベースから削除
  await db.delete(menuItems).where(eq(menuItems.id, id))
})
```

## トラブルシューティング

### よくある問題

#### 1. R2接続エラー

```
Error: R2 credentials are not properly configured
```

**解決方法**:
- 環境変数が正しく設定されているか確認
- Cloudflare Dashboard でAPI トークンの権限確認

#### 2. 既存画像が表示されない

**原因**: 移行前の古いURLが残っている

**解決方法**:
```bash
# 移行スクリプトを再実行
pnpm migrate:r2
```

#### 3. アップロード速度が遅い

**原因**: ファイルサイズが大きい、ネットワーク状況

**解決方法**:
- 画像サイズの最適化
- 圧縮率の調整
- 複数ファイルの並列アップロード

### デバッグ用コマンド

```bash
# R2の接続状況確認
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/r2/buckets

# 移行状況の確認
# データベースでR2 URLと古いURLの件数を確認
```

## 推奨事項

### 移行タイミング
- **推奨**: メンテナンス時間帯
- **理由**: 移行中のURL不整合を避けるため

### 移行戦略
1. **段階的移行**: 新しいアップロードから順次R2利用
2. **一括移行**: 全データを一度に移行（推奨）

### 運用面での注意点
- 定期的なバックアップ（R2は高可用性だが念のため）
- アクセスログの監視
- コスト監視（無料枠超過時のアラート設定）

## 結論

Cloudflare R2への移行は以下の理由で推奨されます：

✅ **コスト効率**: エグレス料金ゼロで大幅なコスト削減  
✅ **パフォーマンス**: グローバルCDNによる高速配信  
✅ **可用性**: 99.9%+の高可用性  
✅ **スケーラビリティ**: 無制限のストレージ容量  
✅ **セキュリティ**: エンタープライズグレードのセキュリティ  
✅ **移行容易性**: S3互換APIによる簡単な移行  

移行によるデメリットは限定的で、長期的には大きなメリットが期待できます。