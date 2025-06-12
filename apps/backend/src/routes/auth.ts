import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sign, verify } from 'hono/jwt'
import { db } from '../db'
import { stores } from '../db/schema'
import { eq } from 'drizzle-orm'
import { generateStoreCode } from '../utils/storeCode'
import bcrypt from 'bcryptjs'
import { JWT_SECRET, JWT_EXPIRY } from '../config/jwt'

export const authRoutes = new Hono()

// 本格的なパスワードハッシュ化
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

// 店舗登録
authRoutes.post('/signup', zValidator('json', z.object({
  name: z.string().min(1, '店舗名を入力してください'),
  ownerName: z.string().min(1, 'オーナー名を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  address: z.string().optional(),
  phone: z.string().optional(),
})), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // メールアドレスの重複チェック
    const existingStore = await db.query.stores.findFirst({
      where: eq(stores.email, data.email),
    })
    
    if (existingStore) {
      return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 400)
    }
    
    // パスワードハッシュ化
    const hashedPassword = await hashPassword(data.password)
    
    // 店舗コード生成（重複チェック付き）
    let storeCode: string
    let attempts = 0
    do {
      storeCode = generateStoreCode()
      const existingCode = await db.query.stores.findFirst({
        where: eq(stores.storeCode, storeCode),
      })
      if (!existingCode) break
      attempts++
    } while (attempts < 10) // 最大10回試行
    
    if (attempts >= 10) {
      return c.json({ success: false, error: '店舗コードの生成に失敗しました。もう一度お試しください' }, 500)
    }
    
    // 店舗作成
    const result = await db.insert(stores).values({
      storeCode,
      name: data.name,
      ownerName: data.ownerName,
      email: data.email,
      password: hashedPassword,
      address: data.address,
      phone: data.phone,
      active: true,
    }).returning()
    
    const store = result[0]
    
    // JWTトークン生成
    const token = await sign({
      storeId: store.id,
      email: store.email,
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY.STORE, // 24時間
    }, JWT_SECRET)
    
    return c.json({
      success: true,
      data: {
        store: {
          id: store.id,
          storeCode: store.storeCode,
          name: store.name,
          ownerName: store.ownerName,
          email: store.email,
          address: store.address,
          phone: store.phone,
        },
        token,
      }
    }, 201)
    
  } catch (error) {
    console.error('Error creating store account:', error)
    return c.json({ success: false, error: '店舗アカウントの作成に失敗しました' }, 500)
  }
})

// 店舗ログイン
authRoutes.post('/login', zValidator('json', z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    
    // 店舗検索
    const store = await db.query.stores.findFirst({
      where: eq(stores.email, email),
    })
    
    if (!store) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
    }
    
    // パスワード確認
    if (!(await verifyPassword(password, store.password))) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
    }
    
    // 店舗が有効かチェック
    if (!store.active) {
      return c.json({ success: false, error: 'このアカウントは無効です' }, 401)
    }
    
    // JWTトークン生成
    const token = await sign({
      storeId: store.id,
      email: store.email,
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY.STORE, // 24時間
    }, JWT_SECRET)
    
    return c.json({
      success: true,
      data: {
        store: {
          id: store.id,
          storeCode: store.storeCode,
          name: store.name,
          ownerName: store.ownerName,
          email: store.email,
          address: store.address,
          phone: store.phone,
        },
        token,
      }
    })
    
  } catch (error) {
    console.error('Error during login:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// トークン検証
authRoutes.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'トークンが提供されていません' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET)
    
    // 店舗情報を取得
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, payload.storeId as number),
    })
    
    if (!store || !store.active) {
      return c.json({ success: false, error: '無効なトークンです' }, 401)
    }
    
    return c.json({
      success: true,
      data: {
        store: {
          id: store.id,
          storeCode: store.storeCode,
          name: store.name,
          ownerName: store.ownerName,
          email: store.email,
          address: store.address,
          phone: store.phone,
        }
      }
    })
    
  } catch (error) {
    console.error('Error verifying token:', error)
    return c.json({ success: false, error: '無効なトークンです' }, 401)
  }
})

// ログアウト（クライアント側でトークン削除）
authRoutes.post('/logout', async (c) => {
  return c.json({ success: true, message: 'ログアウトしました' })
})