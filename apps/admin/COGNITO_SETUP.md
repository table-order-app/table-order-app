# AWS Cognito セットアップ手順

このドキュメントでは、管理画面にAWS Cognito認証を追加するための手順を説明します。

## 1. AWS Cognitoユーザープールの作成

### AWS マネジメントコンソールでの設定

1. **AWS Console** → **Cognito** → **ユーザープールを作成**

2. **サインインエクスペリエンスを設定**
   - プロバイダーのタイプ: `Cognitoユーザープール`
   - Cognitoユーザープールのサインインオプション:
     - ✅ ユーザー名
     - ✅ Eメール
   - ユーザー名の要件: なし

3. **セキュリティ要件を設定**
   - パスワードポリシー:
     - 最小文字数: 8
     - ✅ 大文字を含む
     - ✅ 小文字を含む
     - ✅ 数字を含む
     - ✅ 特殊文字を含む
   - MFA: `オプションMFA`
   - アカウント復旧: `Eメールのみ`

4. **サインアップエクスペリエンスを設定**
   - 自己登録: `無効化`（管理者のみが追加）
   - 必須属性:
     - ✅ email
     - ✅ name
   - カスタム属性を追加:
     - 名前: `store_id`
     - タイプ: Number
     - 最小値: 1
     - 最大値: 9999
     - Mutable: Yes

5. **メッセージ配信を設定**
   - Eメール: `CognitoでEメールを送信`

6. **アプリケーションを統合**
   - ユーザープール名: `accorto-admin-pool`
   - アプリケーションクライアント:
     - アプリタイプ: `パブリッククライアント`
     - アプリクライアント名: `accorto-admin-web`
     - 認証フロー:
       - ✅ ALLOW_USER_PASSWORD_AUTH
       - ✅ ALLOW_REFRESH_TOKEN_AUTH

## 2. 環境変数の設定

作成後、以下の情報を取得して環境変数に設定:

```env
# .env.local (adminアプリ)
VITE_COGNITO_REGION=ap-northeast-1
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 3. ユーザーグループの作成

Cognitoコンソールで以下のグループを作成:

1. **super-admin**
   - 説明: 全店舗管理権限
   - IAMロール: なし
   - 優先順位: 0

2. **store-manager**
   - 説明: 店舗管理者権限
   - IAMロール: なし
   - 優先順位: 1

3. **staff**
   - 説明: スタッフ権限（読み取り専用）
   - IAMロール: なし
   - 優先順位: 2

## 4. 初期管理者の作成

AWS CLIまたはコンソールで初期管理者を作成:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-northeast-1_XXXXXXXXX \
  --username admin@accorto.com \
  --user-attributes \
    Name=email,Value=admin@accorto.com \
    Name=name,Value="システム管理者" \
    Name=custom:store_id,Value="0" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS
```

作成後、`super-admin`グループに追加:

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_XXXXXXXXX \
  --username admin@accorto.com \
  --group-name super-admin
```

## 5. セキュリティ設定

### アプリケーションクライアントの詳細設定

1. **認証フローの設定**
   - ✅ ALLOW_USER_PASSWORD_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
   - ❌ ALLOW_USER_SRP_AUTH（無効化）

2. **トークンの有効期限**
   - アクセストークン: 60分
   - IDトークン: 60分
   - リフレッシュトークン: 30日

## 6. 権限設計

### ユーザー属性と権限マッピング

| グループ | store_id | 権限 |
|---------|----------|------|
| super-admin | 0 | 全店舗の全機能 |
| store-manager | 1-9999 | 指定店舗の全機能 |
| staff | 1-9999 | 指定店舗の読み取りのみ |

## 7. 本番環境での推奨事項

1. **カスタムドメインの設定**
   - `auth.accorto.com`などの独自ドメインを設定

2. **WAFの設定**
   - AWS WAFでレート制限を設定
   - 不正なログイン試行をブロック

3. **CloudWatchログ**
   - 認証イベントのログを有効化
   - 異常なアクセスパターンを監視

4. **バックアップ**
   - ユーザープールのバックアップを定期実行
   - Lambda関数でユーザーデータをS3に保存

## トラブルシューティング

### よくある問題

1. **CORSエラー**
   - アプリケーションクライアントで許可されたコールバックURLを確認

2. **認証エラー**
   - ユーザープールIDとクライアントIDが正しいか確認
   - リージョンが正しいか確認

3. **権限エラー**
   - ユーザーがグループに所属しているか確認
   - カスタム属性が正しく設定されているか確認