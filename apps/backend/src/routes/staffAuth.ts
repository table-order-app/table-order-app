import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sign, verify } from 'hono/jwt'
import { db } from '../db'
import { staffMembers, stores } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const staffAuthRoutes = new Hono()

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  JWT_SECRET environment variable not set. Using default secret for development only.')
  return 'dev-secret-key-change-in-production'
})()

// 本格的なパスワードハッシュ化
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

// スタッフログイン
staffAuthRoutes.post('/login', zValidator('json', z.object({
  storeCode: z.string().min(1, '店舗コードを入力してください'),
  loginId: z.string().min(1, 'ログインIDを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})), async (c) => {
  try {
    const { storeCode, loginId, password } = c.req.valid('json')
    
    // 店舗検索
    const store = await db.query.stores.findFirst({
      where: eq(stores.storeCode, storeCode.toUpperCase())
    })
    
    if (!store) {
      return c.json({ success: false, error: '店舗コードが見つかりません' }, 401)
    }
    
    // スタッフ検索
    const staff = await db.query.staffMembers.findFirst({
      where: and(
        eq(staffMembers.storeId, store.id),
        eq(staffMembers.loginId, loginId)
      ),
      with: {
        store: true
      }
    })
    
    if (!staff) {
      return c.json({ success: false, error: 'ログインID、パスワード、または店舗が間違っています' }, 401)
    }
    
    // パスワード確認
    if (!(await verifyPassword(password, staff.password))) {
      return c.json({ success: false, error: 'ログインID、パスワード、または店舗が間違っています' }, 401)
    }
    
    // スタッフが有効かチェック
    if (!staff.active) {
      return c.json({ success: false, error: 'このアカウントは無効です' }, 401)
    }
    
    // JWTトークン生成
    const token = await sign({
      staffId: staff.id,
      storeId: staff.storeId,
      loginId: staff.loginId,
      role: staff.role,
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8時間
    }, JWT_SECRET)
    
    return c.json({
      success: true,
      data: {
        staff: {
          id: staff.id,
          name: staff.name,
          loginId: staff.loginId,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
        },
        store: {
          id: staff.store.id,
          name: staff.store.name,
          address: staff.store.address,
          phone: staff.store.phone,
        },
        token,
      }
    })
    
  } catch (error) {
    console.error('Error during staff login:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// スタッフトークン検証
staffAuthRoutes.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'トークンが提供されていません' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET)
    
    // スタッフ情報を取得
    const staff = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, payload.staffId as number),
      with: {
        store: true
      }
    })
    
    if (!staff || !staff.active) {
      return c.json({ success: false, error: '無効なトークンです' }, 401)
    }
    
    return c.json({
      success: true,
      data: {
        staff: {
          id: staff.id,
          name: staff.name,
          loginId: staff.loginId,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
        },
        store: {
          id: staff.store.id,
          name: staff.store.name,
          address: staff.store.address,
          phone: staff.store.phone,
        }
      }
    })
    
  } catch (error) {
    console.error('Error verifying staff token:', error)
    return c.json({ success: false, error: '無効なトークンです' }, 401)
  }
})

// スタッフログアウト（クライアント側でトークン削除）
staffAuthRoutes.post('/logout', async (c) => {
  return c.json({ success: true, message: 'ログアウトしました' })
})