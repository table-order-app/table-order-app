import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { tables, stores } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const tableRoutes = new Hono()

// テーブル一覧を取得
tableRoutes.get('/', async (c) => {
  try {
    const storeId = c.req.query('storeId')
    
    let result;
    if (storeId) {
      // 店舗IDが指定されている場合は店舗でフィルタ
      result = await db.query.tables.findMany({
        where: eq(tables.storeId, Number(storeId))
      })
    } else {
      // 店舗IDが指定されていない場合は最初の店舗のデータを表示
      const firstStore = await db.query.stores.findFirst()
      if (firstStore) {
        result = await db.query.tables.findMany({
          where: eq(tables.storeId, firstStore.id)
        })
      } else {
        result = []
      }
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを作成
tableRoutes.post('/', zValidator('json', z.object({
  storeId: z.number().int().positive().optional(),
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  area: z.enum(['area1', 'area2', 'area3', 'area4']),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
  qrCode: z.string().optional(),
})), async (c) => {
  try {
    const { storeId = 1, ...data } = c.req.valid('json')
    const result = await db.insert(tables).values({
      storeId,
      ...data
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating table:', error)
    return c.json({ success: false, error: 'テーブルの作成に失敗しました' }, 500)
  }
})

// テーブル番号でテーブルを取得
tableRoutes.get('/number/:number', async (c) => {
  try {
    const number = Number(c.req.param('number'))
    
    // 最初の店舗でテーブル番号を検索
    const firstStore = await db.query.stores.findFirst()
    if (!firstStore) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    const result = await db.query.tables.findFirst({
      where: and(eq(tables.number, number), eq(tables.storeId, firstStore.id)),
    })
    
    if (!result) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching table by number:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを取得
tableRoutes.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    const result = await db.query.tables.findFirst({
      where: and(eq(tables.id, id), eq(tables.storeId, storeId)),
    })
    
    if (!result) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching table:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを更新
tableRoutes.put('/:id', zValidator('json', z.object({
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  area: z.enum(['area1', 'area2', 'area3', 'area4']).optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
  qrCode: z.string().optional(),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    const data = c.req.valid('json')
    
    const result = await db.update(tables)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tables.id, id), eq(tables.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating table:', error)
    return c.json({ success: false, error: 'テーブルの更新に失敗しました' }, 500)
  }
})

// テーブルを削除
tableRoutes.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    
    const result = await db.delete(tables)
      .where(and(eq(tables.id, id), eq(tables.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting table:', error)
    return c.json({ success: false, error: 'テーブルの削除に失敗しました' }, 500)
  }
})

// テーブルステータスを更新
tableRoutes.patch('/:id/status', zValidator('json', z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    const { status } = c.req.valid('json')
    
    const result = await db.update(tables)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tables.id, id), eq(tables.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating table status:', error)
    return c.json({ success: false, error: 'テーブルステータスの更新に失敗しました' }, 500)
  }
})
