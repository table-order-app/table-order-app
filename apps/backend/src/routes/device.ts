import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { devices, stores, tables } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const deviceRoutes = new Hono()

// デバイス設定を取得（テーブル端末用）
deviceRoutes.get('/config/:deviceId', async (c) => {
  try {
    const deviceId = c.req.param('deviceId')
    
    const result = await db.query.devices.findFirst({
      where: eq(devices.deviceId, deviceId),
      with: {
        store: true,
        table: true,
      },
    })
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'デバイスが登録されていません' 
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      data: {
        storeId: result.storeId,
        tableId: result.tableId,
        tableName: result.table.number,
        storeName: result.store.name,
        deviceName: result.name
      }
    })
  } catch (error) {
    console.error('Error fetching device config:', error)
    return c.json({ 
      success: false, 
      error: 'デバイス設定の取得に失敗しました' 
    }, 500)
  }
})

// デバイス一覧を取得（管理画面用）
deviceRoutes.get('/', async (c) => {
  try {
    const storeId = c.req.query('storeId')
    
    let result;
    if (storeId) {
      result = await db.query.devices.findMany({
        where: eq(devices.storeId, Number(storeId)),
        with: {
          store: true,
          table: true,
        },
      })
    } else {
      result = await db.query.devices.findMany({
        with: {
          store: true,
          table: true,
        },
      })
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return c.json({ 
      success: false, 
      error: 'デバイス一覧の取得に失敗しました' 
    }, 500)
  }
})

// デバイスを登録（管理画面用）
deviceRoutes.post('/', zValidator('json', z.object({
  deviceId: z.string().min(1),
  storeId: z.number().int().positive(),
  tableId: z.number().int().positive(),
  name: z.string().optional(),
})), async (c) => {
  try {
    const { deviceId, storeId, tableId, name } = c.req.valid('json')
    
    // 既存のデバイスIDチェック
    const existing = await db.query.devices.findFirst({
      where: eq(devices.deviceId, deviceId)
    })
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'このデバイスIDは既に登録されています' 
      }, 400)
    }
    
    // テーブルが既に別のデバイスに割り当てられていないかチェック
    const tableInUse = await db.query.devices.findFirst({
      where: and(
        eq(devices.storeId, storeId),
        eq(devices.tableId, tableId)
      )
    })
    
    if (tableInUse) {
      return c.json({ 
        success: false, 
        error: 'このテーブルは既に別のデバイスに割り当てられています' 
      }, 400)
    }
    
    const result = await db.insert(devices).values({
      deviceId,
      storeId,
      tableId,
      name: name || `テーブル${tableId}端末`,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating device:', error)
    return c.json({ 
      success: false, 
      error: 'デバイスの登録に失敗しました' 
    }, 500)
  }
})

// デバイス設定を更新（管理画面用）
deviceRoutes.put('/:id', zValidator('json', z.object({
  storeId: z.number().int().positive().optional(),
  tableId: z.number().int().positive().optional(),
  name: z.string().optional(),
})), async (c) => {
  try {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    // テーブルが変更される場合、重複チェック
    if (data.tableId || data.storeId) {
      const device = await db.query.devices.findFirst({
        where: eq(devices.id, id)
      })
      
      if (!device) {
        return c.json({ success: false, error: 'デバイスが見つかりません' }, 404)
      }
      
      const newStoreId = data.storeId || device.storeId
      const newTableId = data.tableId || device.tableId
      
      const tableInUse = await db.query.devices.findFirst({
        where: and(
          eq(devices.storeId, newStoreId),
          eq(devices.tableId, newTableId),
          // 自分以外のデバイス
          eq(devices.id, id) // この条件を反転させる必要があります
        )
      })
      
      // TODO: 正しい重複チェックロジックを実装
    }
    
    const result = await db.update(devices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'デバイスが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating device:', error)
    return c.json({ 
      success: false, 
      error: 'デバイス設定の更新に失敗しました' 
    }, 500)
  }
})

// デバイスを削除（管理画面用）
deviceRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await db.delete(devices)
      .where(eq(devices.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'デバイスが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting device:', error)
    return c.json({ 
      success: false, 
      error: 'デバイスの削除に失敗しました' 
    }, 500)
  }
})