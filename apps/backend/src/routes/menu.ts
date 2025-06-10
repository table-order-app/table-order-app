import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { categories, menuItems, options, toppings, allergens, orderItems, stores } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const menuRoutes = new Hono()

// カテゴリ一覧を取得
menuRoutes.get('/categories', async (c) => {
  try {
    const storeId = c.req.query('storeId')
    
    let result;
    if (storeId) {
      // 店舗IDが指定されている場合は店舗でフィルタ
      result = await db.query.categories.findMany({
        where: eq(categories.storeId, Number(storeId))
      })
    } else {
      // 店舗IDが指定されていない場合は最初の店舗のデータを表示
      const firstStore = await db.query.stores.findFirst()
      if (firstStore) {
        result = await db.query.categories.findMany({
          where: eq(categories.storeId, firstStore.id)
        })
      } else {
        result = []
      }
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ success: false, error: 'カテゴリの取得に失敗しました' }, 500)
  }
})

// カテゴリを作成
menuRoutes.post('/categories', zValidator('json', z.object({
  storeId: z.number().int().positive().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
})), async (c) => {
  try {
    const { storeId = 1, name, description } = c.req.valid('json')
    const result = await db.insert(categories).values({
      storeId,
      name,
      description,
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ success: false, error: 'カテゴリの作成に失敗しました' }, 500)
  }
})

// メニュー一覧を取得
menuRoutes.get('/items', async (c) => {
  try {
    const storeId = c.req.query('storeId')
    
    let result;
    if (storeId) {
      // 店舗IDが指定されている場合は店舗でフィルタ
      result = await db.query.menuItems.findMany({
        where: eq(menuItems.storeId, Number(storeId)),
        with: {
          category: true,
        },
      })
    } else {
      // 店舗IDが指定されていない場合は最初の店舗のデータを表示
      const firstStore = await db.query.stores.findFirst()
      if (firstStore) {
        result = await db.query.menuItems.findMany({
          where: eq(menuItems.storeId, firstStore.id),
          with: {
            category: true,
          },
        })
      } else {
        result = []
      }
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return c.json({ success: false, error: 'メニューアイテムの取得に失敗しました' }, 500)
  }
})

// メニューアイテムを作成
menuRoutes.post('/items', zValidator('json', z.object({
  storeId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().max(200).optional(),
  price: z.number().int().positive().max(999999),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const { storeId = 1, ...data } = c.req.valid('json')
    const result = await db.insert(menuItems).values({
      storeId,
      ...data
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの作成に失敗しました' }, 500)
  }
})

// メニューアイテムを取得
menuRoutes.get('/items/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = c.req.query('storeId')
    
    let result;
    if (storeId) {
      // 店舗IDが指定されている場合は店舗でフィルタ
      result = await db.query.menuItems.findFirst({
        where: and(eq(menuItems.id, id), eq(menuItems.storeId, Number(storeId))),
        with: {
          category: true,
        },
      })
    } else {
      // 店舗IDが指定されていない場合は最初の店舗でフィルタ
      const firstStore = await db.query.stores.findFirst()
      if (firstStore) {
        result = await db.query.menuItems.findFirst({
          where: and(eq(menuItems.id, id), eq(menuItems.storeId, firstStore.id)),
          with: {
            category: true,
          },
        })
      } else {
        result = null
      }
    }
    
    if (!result) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの取得に失敗しました' }, 500)
  }
})

// メニューアイテムを更新
menuRoutes.put('/items/:id', zValidator('json', z.object({
  categoryId: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  description: z.string().max(200).optional(),
  price: z.number().int().positive().max(999999).optional(),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    const data = c.req.valid('json')
    
    const result = await db.update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの更新に失敗しました' }, 500)
  }
})

// メニューアイテムを削除
menuRoutes.delete('/items/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    
    // メニューアイテムの詳細を取得して提供状況をチェック
    const menuItem = await db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, id), eq(menuItems.storeId, storeId))
    })
    
    if (!menuItem) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    // 提供中の場合は削除を拒否
    if (menuItem.available) {
      return c.json({ 
        success: false, 
        error: 'このメニューは現在提供中のため削除できません。先に「提供停止」に設定してから削除してください。' 
      }, 400)
    }
    
    // 該当のメニューアイテムが注文で使用されているかチェック
    const existingOrderItems = await db.query.orderItems.findFirst({
      where: eq(orderItems.menuItemId, id)
    })
    
    if (existingOrderItems) {
      return c.json({ 
        success: false, 
        error: 'このメニューは過去の注文で使用されているため削除できません。メニューを非表示にするには「提供停止」に設定してください。' 
      }, 400)
    }
    
    const result = await db.delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの削除に失敗しました' }, 500)
  }
})
