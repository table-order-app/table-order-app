import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { settings, storeInfo } from '../db/schema'
import { eq } from 'drizzle-orm'

export const settingRoutes = new Hono()

// 設定一覧を取得
settingRoutes.get('/', async (c) => {
  try {
    const result = await db.query.settings.findMany()
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return c.json({ success: false, error: '設定の取得に失敗しました' }, 500)
  }
})

// 設定を作成/更新
settingRoutes.put('/:key', zValidator('json', z.object({
  value: z.string(),
  description: z.string().optional(),
})), async (c) => {
  try {
    const key = c.req.param('key')
    const { value, description } = c.req.valid('json')
    
    // 既存の設定を検索
    const existing = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    })
    
    let result
    
    if (existing) {
      // 既存の設定を更新
      result = await db.update(settings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning()
    } else {
      // 新しい設定を作成
      result = await db.insert(settings)
        .values({ key, value, description })
        .returning()
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating setting:', error)
    return c.json({ success: false, error: '設定の更新に失敗しました' }, 500)
  }
})

// 設定を取得
settingRoutes.get('/:key', async (c) => {
  try {
    const key = c.req.param('key')
    const result = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    })
    
    if (!result) {
      return c.json({ success: false, error: '設定が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching setting:', error)
    return c.json({ success: false, error: '設定の取得に失敗しました' }, 500)
  }
})

// 設定を削除
settingRoutes.delete('/:key', async (c) => {
  try {
    const key = c.req.param('key')
    
    const result = await db.delete(settings)
      .where(eq(settings.key, key))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '設定が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return c.json({ success: false, error: '設定の削除に失敗しました' }, 500)
  }
})

// 店舗情報を取得
settingRoutes.get('/store/info', async (c) => {
  try {
    const result = await db.query.storeInfo.findFirst()
    
    if (!result) {
      return c.json({ success: false, error: '店舗情報が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching store info:', error)
    return c.json({ success: false, error: '店舗情報の取得に失敗しました' }, 500)
  }
})

// 店舗情報を更新
settingRoutes.put('/store/info', zValidator('json', z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  businessHours: z.record(z.string()).optional(),
})), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // 既存の店舗情報を検索
    const existing = await db.query.storeInfo.findFirst()
    
    let result
    
    if (existing) {
      // 既存の店舗情報を更新
      result = await db.update(storeInfo)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(storeInfo.id, existing.id))
        .returning()
    } else {
      // 新しい店舗情報を作成
      result = await db.insert(storeInfo)
        .values(data)
        .returning()
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating store info:', error)
    return c.json({ success: false, error: '店舗情報の更新に失敗しました' }, 500)
  }
})
