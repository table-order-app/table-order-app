import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { stores, storeInfo, accountingSettings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, flexibleAuthMiddleware } from '../middleware/auth'
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

// 営業時間設定を取得
storeRoutes.get('/business-hours', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // 店舗情報から営業時間を取得
    const store = await db.query.storeInfo.findFirst({
      where: eq(storeInfo.id, auth.storeId)
    })
    
    if (!store || !store.businessHours) {
      // デフォルト営業時間を返す
      const defaultHours = createBusinessHours({
        openTime: '09:00',
        closeTime: '17:00'
      })
      return c.json({ success: true, data: defaultHours })
    }
    
    return c.json({ success: true, data: store.businessHours })
  } catch (error) {
    logError('Error fetching business hours:', error)
    return c.json({ success: false, error: '営業時間の取得に失敗しました' }, 500)
  }
})

// 営業時間設定を更新
storeRoutes.put('/business-hours', flexibleAuthMiddleware, zValidator('json', z.object({
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '営業開始時間の形式が正しくありません'),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-6]):[0-5][0-9]$/, '営業終了時間の形式が正しくありません (26:00まで可能)'),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const input: BusinessHoursInput = c.req.valid('json')
    
    // 営業時間オブジェクトを作成
    const businessHours = createBusinessHours(input)
    const now = createJSTTimestamp()
    
    // トランザクションで営業時間と会計設定を同期更新
    await db.transaction(async (tx) => {
      // 1. 店舗情報テーブルの営業時間を更新
      const existingStoreInfo = await tx.query.storeInfo.findFirst({
        where: eq(storeInfo.id, auth.storeId)
      })
      
      if (existingStoreInfo) {
        // 既存レコードを更新
        await tx.update(storeInfo)
          .set({
            businessHours: businessHours,
            updatedAt: now
          })
          .where(eq(storeInfo.id, auth.storeId))
      } else {
        // 新規レコードを作成
        const store = await tx.query.stores.findFirst({
          where: eq(stores.id, auth.storeId)
        })
        
        if (store) {
          await tx.insert(storeInfo).values({
            name: store.name,
            email: store.email,
            businessHours: businessHours,
            createdAt: now,
            updatedAt: now
          })
        }
      }
      
      // 2. 会計設定の日の切り替え時間を同期更新
      const existingAccountingSetting = await tx.query.accountingSettings.findFirst({
        where: eq(accountingSettings.storeId, auth.storeId)
      })
      
      if (existingAccountingSetting) {
        // 営業開始時間を会計日の切り替え時間として設定
        await tx.update(accountingSettings)
          .set({
            dayClosingTime: `${businessHours.openTime}:00`,
            updatedAt: now
          })
          .where(eq(accountingSettings.storeId, auth.storeId))
      } else {
        // 新規会計設定を作成
        await tx.insert(accountingSettings).values({
          storeId: auth.storeId,
          dayClosingTime: `${businessHours.openTime}:00`,
          taxRate: '0.00', // 税抜き運用
          displayCurrency: 'JPY',
          createdAt: now,
          updatedAt: now
        })
      }
    })
    
    logInfo('Business hours updated', {
      storeId: auth.storeId,
      businessHours: businessHours
    })
    
    return c.json({
      success: true,
      data: businessHours,
      message: '営業時間を更新しました。会計日の計算も自動で調整されます。'
    })
  } catch (error) {
    logError('Error updating business hours:', error)
    return c.json({ success: false, error: '営業時間の更新に失敗しました' }, 500)
  }
})