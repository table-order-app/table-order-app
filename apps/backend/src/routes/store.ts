import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { stores, storeInfo, accountingSettings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, flexibleAuthMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { logError, logInfo } from '../utils/logger-simple'
import { createJSTTimestamp } from '../utils/accounting'
import { createBusinessHours, BusinessHoursInput } from '../types/business-hours'

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
    logError('Error fetching stores:', error)
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
    const result = await db.insert(stores).values({
      ...data,
      email: data.email || '',
      password: 'temp_password',
      ownerName: 'オーナー'
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating store:', error)
    return c.json({ success: false, error: '店舗の作成に失敗しました' }, 500)
  }
})

// 営業時間設定を取得
storeRoutes.get('/business-hours', optionalAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // 一時的に常にデフォルト営業時間を返す（テーブル設計修正が必要）
    const defaultHours = createBusinessHours({
      openTime: '09:00',
      closeTime: '17:00'
    })
    
    logInfo('Business hours requested', { storeId: auth?.storeId, defaultHours })
    return c.json({ success: true, data: defaultHours })
    
  } catch (error) {
    logError('Error fetching business hours:', error)
    return c.json({ success: false, error: '営業時間の取得に失敗しました' }, 500)
  }
})

// 営業時間設定を更新
storeRoutes.put('/business-hours', optionalAuthMiddleware, zValidator('json', z.object({
  openTime: z.string().regex(/^([0-9]{1,2}):[0-5][0-9]$/, '営業開始時間の形式が正しくありません'),
  closeTime: z.string().regex(/^([0-9]{1,2}):[0-5][0-9]$/, '営業終了時間の形式が正しくありません'),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const input: BusinessHoursInput = c.req.valid('json')
    
    // 営業時間オブジェクトを作成
    const businessHours = createBusinessHours(input)
    
    // 一時的にログのみ（実際のDB更新は後で実装）
    logInfo('Business hours update requested', {
      storeId: auth?.storeId,
      input: input,
      businessHours: businessHours
    })
    
    return c.json({
      success: true,
      data: businessHours,
      message: '営業時間を更新しました。（テスト実装中）'
    })
  } catch (error) {
    logError('Error updating business hours:', error)
    return c.json({ success: false, error: '営業時間の更新に失敗しました' }, 500)
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
    logError('Error fetching store:', error)
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
    logError('Error updating store:', error)
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
    logError('Error deleting store:', error)
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
    logError('Error generating store code:', error)
    return c.json({ success: false, error: '店舗コードの生成に失敗しました' }, 500)
  }
})