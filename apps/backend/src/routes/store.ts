import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { stores } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

// 店舗コード生成関数
const generateStoreCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 店舗コードの重複チェック
const isStoreCodeUnique = async (storeCode: string): Promise<boolean> => {
  const existing = await db.query.stores.findFirst({
    where: eq(stores.storeCode, storeCode)
  })
  return !existing
}

export const storeRoutes = new Hono()

// 店舗一覧を取得
storeRoutes.get('/', async (c) => {
  try {
    const result = await db.query.stores.findMany({
      where: eq(stores.active, true)
    })
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return c.json({ success: false, error: '店舗の取得に失敗しました' }, 500)
  }
})

// 店舗を作成
storeRoutes.post('/', zValidator('json', z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const data = c.req.valid('json')
    const result = await db.insert(stores).values(data).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating store:', error)
    return c.json({ success: false, error: '店舗の作成に失敗しました' }, 500)
  }
})

// 店舗を取得
storeRoutes.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const result = await db.query.stores.findFirst({
      where: eq(stores.id, id),
    })
    
    if (!result) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching store:', error)
    return c.json({ success: false, error: '店舗の取得に失敗しました' }, 500)
  }
})

// 店舗を更新
storeRoutes.put('/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    const result = await db.update(stores)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating store:', error)
    return c.json({ success: false, error: '店舗の更新に失敗しました' }, 500)
  }
})

// 店舗を削除（論理削除）
storeRoutes.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    
    const result = await db.update(stores)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting store:', error)
    return c.json({ success: false, error: '店舗の削除に失敗しました' }, 500)
  }
})

// 店舗コードを生成
storeRoutes.post('/:id/generate-code', authMiddleware, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const auth = c.get('auth')
    
    // 認証されたユーザーが自分の店舗のコードを生成しているかチェック
    if (auth.storeId !== id) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }
    
    // ユニークな店舗コードを生成
    let storeCode: string
    let attempts = 0
    do {
      storeCode = generateStoreCode()
      attempts++
      if (attempts > 10) {
        return c.json({ success: false, error: '店舗コードの生成に失敗しました' }, 500)
      }
    } while (!(await isStoreCodeUnique(storeCode)))
    
    // 店舗コードを更新
    const result = await db.update(stores)
      .set({ storeCode, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error generating store code:', error)
    return c.json({ success: false, error: '店舗コードの生成に失敗しました' }, 500)
  }
})