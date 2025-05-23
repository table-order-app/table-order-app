import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { categories, menuItems, options, toppings, allergens } from '../db/schema'
import { eq } from 'drizzle-orm'

export const menuRoutes = new Hono()

// カテゴリ一覧を取得
menuRoutes.get('/categories', async (c) => {
  try {
    const result = await db.query.categories.findMany()
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ success: false, error: 'カテゴリの取得に失敗しました' }, 500)
  }
})

// カテゴリを作成
menuRoutes.post('/categories', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})), async (c) => {
  try {
    const { name, description } = c.req.valid('json')
    const result = await db.insert(categories).values({
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
    const result = await db.query.menuItems.findMany({
      with: {
        category: true,
      },
    })
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return c.json({ success: false, error: 'メニューアイテムの取得に失敗しました' }, 500)
  }
})

// メニューアイテムを作成
menuRoutes.post('/items', zValidator('json', z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const data = c.req.valid('json')
    const result = await db.insert(menuItems).values(data).returning()
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
    const result = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
      with: {
        category: true,
      },
    })
    
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
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    const result = await db.update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
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
    
    const result = await db.delete(menuItems)
      .where(eq(menuItems.id, id))
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
