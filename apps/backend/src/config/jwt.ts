/**
 * JWT設定
 * 全ての認証機能で共通のJWT_SECRETを使用
 */

export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  JWT_SECRET environment variable not set. Using default secret for development only.')
  return 'dev-secret-key-change-in-production'
})()

export const JWT_EXPIRY = {
  STORE: 24 * 60 * 60, // 24時間（店舗管理者）
  STAFF: 8 * 60 * 60,  // 8時間（スタッフ）
}