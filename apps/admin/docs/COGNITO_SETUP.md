# AWS Cognito セットアップガイド

このドキュメントでは、管理画面（Admin App）で使用するAWS Cognitoのセットアップ手順を説明します。

## 前提条件

- AWSアカウントを持っていること
- AWS CLIがインストールされていること（オプション）
- AWS Management Consoleにアクセスできること

## 1. Cognito User Poolの作成

1. AWS Management Consoleにログイン
2. Cognitoサービスに移動
3. 「ユーザープールを作成」をクリック

### 設定項目

#### ステップ1: 認証プロバイダーの設定
- **プロバイダータイプ**: Cognito user pool
- **サインインオプション**: 
  - ユーザー名
  - Eメール

#### ステップ2: セキュリティ要件の設定
- **パスワードポリシー**:
  - 最小長: 8文字
  - 必須文字タイプ:
    - 大文字（A-Z）
    - 小文字（a-z）
    - 数字（0-9）
    - 特殊文字
- **多要素認証**: なし（必要に応じて設定）
- **ユーザーアカウントの復旧**: 管理者のみ

#### ステップ3: サインアップエクスペリエンスの設定
- **セルフサインアップ**: 無効
- **属性の検証と確認**: なし
- **必須属性**:
  - email
  - name

#### ステップ4: メッセージ配信の設定
- **Eメール**: Cognito default（本番環境ではSESを推奨）

#### ステップ5: アプリケーションの統合
- **ユーザープール名**: `accorto-admin-users`
- **アプリケーションクライアント**:
  - クライアント名: `accorto-admin-web`
  - クライアントシークレット: 生成しない
  - 認証フロー:
    - ALLOW_USER_PASSWORD_AUTH
    - ALLOW_REFRESH_TOKEN_AUTH

## 2. ユーザーグループの作成

User Pool作成後、以下のグループを作成します：

1. **super-admin**
   - 説明: システム管理者
   - 優先度: 0
   - すべての管理機能にアクセス可能

2. **store-manager**
   - 説明: 店舗管理者
   - 優先度: 10
   - 店舗関連の管理機能にアクセス可能

3. **staff**
   - 説明: スタッフ
   - 優先度: 20
   - 限定的な機能にアクセス可能

## 3. 初期ユーザーの作成

### AWS CLIを使用する場合

```bash
# システム管理者の作成
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=name,Value="System Admin" \
  --message-action SUPPRESS \
  --temporary-password "TempPassword123!"

# グループに追加
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --group-name super-admin
```

### AWS Management Consoleを使用する場合

1. Cognitoコンソールでユーザープールを選択
2. 「ユーザー」タブから「ユーザーを作成」
3. 以下の情報を入力：
   - ユーザー名: admin@example.com
   - Eメール: admin@example.com
   - 名前: System Admin
   - 仮パスワード: 設定する
   - 「ユーザーに仮パスワードの変更を要求」をチェック

## 4. 環境変数の設定

作成したUser PoolとApp Clientの情報を`.env.local`に設定：

```env
VITE_COGNITO_REGION=ap-northeast-1
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXX
```

## 5. アプリケーションでの確認

1. 管理画面アプリケーションを起動
   ```bash
   cd apps/admin
   pnpm dev
   ```

2. ブラウザでアクセス（通常 http://localhost:5173）

3. 作成したユーザーでログイン
   - 初回ログイン時は仮パスワードの変更が必要

## トラブルシューティング

### ログインできない場合

1. **環境変数の確認**
   - `.env.local`ファイルが正しく設定されているか確認
   - User Pool IDとClient IDが正しいか確認

2. **ユーザーの状態確認**
   - Cognitoコンソールでユーザーのステータスを確認
   - 「FORCE_CHANGE_PASSWORD」の場合は初回パスワード変更が必要

3. **ブラウザコンソールの確認**
   - エラーメッセージを確認
   - ネットワークタブでAPIリクエストを確認

### パスワードリセット

管理者がパスワードをリセットする場合：

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username <USERNAME> \
  --password <NEW_PASSWORD> \
  --permanent
```

## セキュリティのベストプラクティス

1. **IAMロールの設定**
   - Cognitoサービスに必要最小限の権限のみ付与

2. **パスワードポリシー**
   - 強力なパスワードポリシーを設定
   - 定期的なパスワード変更を推奨

3. **MFAの有効化**
   - 本番環境では多要素認証の有効化を推奨

4. **監査ログ**
   - CloudTrailでCognito関連のイベントを記録

## 関連リンク

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amplify Auth Documentation](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-best-practices.html)