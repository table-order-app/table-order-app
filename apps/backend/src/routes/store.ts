import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { stores, storeInfo, accountingSettings, storeBusinessHours } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { authMiddleware, flexibleAuthMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { logError, logInfo } from '../utils/logger-simple'
import { createJSTTimestamp } from '../utils/accounting'
import { createBusinessHours, BusinessHoursInput, BusinessHours } from '../types/business-hours'

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
    const storeId = auth?.storeId || 1 // デフォルトストアID
    
    // store_business_hoursテーブルから営業時間を取得（全日共通の設定）
    const businessHoursData = await db
      .select()
      .from(storeBusinessHours)
      .where(eq(storeBusinessHours.storeId, storeId))
      .where(eq(storeBusinessHours.isActive, true))
      .where(sql`${storeBusinessHours.dayOfWeek} IS NULL`) // 全日共通
      .limit(1)
    
    let businessHours
    if (businessHoursData.length > 0) {
      const data = businessHoursData[0]
      // 秒を除去してHH:MM形式にする
      const formatTime = (timeStr: string) => timeStr.substring(0, 5)
      
      // is_next_dayがtrueの場合、closeTimeを元の26:00+形式に戻す
      let openTime = formatTime(data.openTime)
      let closeTime = formatTime(data.closeTime)
      
      if (data.isNextDay) {
        // 03:00 → 27:00, 02:00 → 26:00 のように復元
        const [hours, minutes] = closeTime.split(':').map(Number)
        const originalHours = hours + 24
        closeTime = `${originalHours}:${minutes.toString().padStart(2, '0')}`
      }
      
      businessHours = createBusinessHours({
        openTime: openTime,
        closeTime: closeTime
      })
    } else {
      // デフォルト営業時間
      businessHours = createBusinessHours({
        openTime: '09:00',
        closeTime: '17:00'
      })
    }
    
    logInfo('Business hours requested', { storeId, businessHours })
    return c.json({ success: true, data: businessHours })
    
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
    const storeId = auth?.storeId || 1 // デフォルトストアID
    const input: BusinessHoursInput = c.req.valid('json')
    
    // 営業時間オブジェクトを作成
    const businessHours = createBusinessHours(input)
    
    // 26:00形式を処理（PostgreSQLのTIME型は24時間制限のため）
    const normalizeTime = (timeStr: string): string => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      if (hours >= 24) {
        // 26:00 → 02:00 に変換
        const normalizedHours = hours - 24
        return `${normalizedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
      return timeStr
    }
    
    const normalizedOpenTime = normalizeTime(input.openTime)
    const normalizedCloseTime = normalizeTime(input.closeTime)
    
    // 既存の全日共通営業時間設定を取得
    const existing = await db
      .select()
      .from(storeBusinessHours)
      .where(eq(storeBusinessHours.storeId, storeId))
      .where(sql`${storeBusinessHours.dayOfWeek} IS NULL`) // 全日共通
      .limit(1)
    
    let result
    if (existing.length > 0) {
      // 既存レコードを更新
      result = await db
        .update(storeBusinessHours)
        .set({
          openTime: normalizedOpenTime,
          closeTime: normalizedCloseTime,
          isNextDay: businessHours.isNextDay,
          updatedAt: sql`now()`
        })
        .where(eq(storeBusinessHours.id, existing[0].id))
        .returning()
    } else {
      // 新規レコードを作成
      result = await db
        .insert(storeBusinessHours)
        .values({
          storeId: storeId,
          openTime: normalizedOpenTime,
          closeTime: normalizedCloseTime,
          isNextDay: businessHours.isNextDay,
          dayOfWeek: null, // 全日共通
          isActive: true
        })
        .returning()
    }
    
    logInfo('Business hours updated successfully', {
      storeId,
      input,
      businessHours,
      operation: existing.length > 0 ? 'update' : 'insert'
    })
    
    return c.json({
      success: true,
      data: businessHours,
      message: '営業時間を更新しました'
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