/**
 * JWT設定
 * 全ての認証機能で共通のJWT_SECRETを使用
 */

export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production')
    }
    console.warn('⚠️  JWT_SECRET environment variable not set. Using default secret for development only.')
    return 'dev-secret-key-change-in-production'
  }
  
  // 本番環境では最低32文字（256bit）の秘密鍵を要求
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (256 bits) in production')
  }
  
  return secret
})()

export const JWT_EXPIRY = {
  STORE: 24 * 60 * 60, // 24時間（店舗管理者）
  STAFF: 8 * 60 * 60,  // 8時間（スタッフ）
}