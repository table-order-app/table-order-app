import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { categories, menuItems, options, toppings, allergens, orderItems, stores } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { authMiddleware, optionalAuthMiddleware, flexibleAuthMiddleware } from '../middleware/auth'
import { saveImage, isS3Enabled } from '../utils/s3'
import { logError, logInfo, logDebug } from '../utils/logger-simple'

export const menuRoutes = new Hono()

// 古い画像を削除するヘルパー関数
async function deleteOldImage(imagePath: string | null) {
  if (!imagePath) return
  
  try {
    // AWS機能は削除されたため、ローカルファイルの削除のみ対応
    // ローカルファイルの削除は行わない（開発環境のため）
    logInfo('Image deletion skipped (AWS functionality removed)', { imagePath })
  } catch (error) {
    logError('Failed to delete old image', error, { imagePath })
  }
}

// カテゴリ一覧を取得（統合認証）
menuRoutes.get('/categories', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // 認証された店舗のカテゴリのみ取得
    const result = await db.query.categories.findMany({
      where: eq(categories.storeId, auth.storeId)
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ success: false, error: 'カテゴリの取得に失敗しました' }, 500)
  }
})

// カテゴリを作成（統合認証）
menuRoutes.post('/categories', flexibleAuthMiddleware, zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const { name, description } = c.req.valid('json')
    const result = await db.insert(categories).values({
      storeId: auth.storeId,
      name,
      description,
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ success: false, error: 'カテゴリの作成に失敗しました' }, 500)
  }
})

// メニュー一覧を取得（統合認証）
menuRoutes.get('/items', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // 認証された店舗のメニューアイテムのみ取得
    const result = await db.query.menuItems.findMany({
      where: eq(menuItems.storeId, auth.storeId),
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

// メニューアイテムを作成（統合認証）
menuRoutes.post('/items', flexibleAuthMiddleware, zValidator('json', z.object({
  categoryId: z.number().int().positive().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive().max(999999),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    // 同じ店舗で同じメニュー名が既に存在するかチェック
    const existingItem = await db.query.menuItems.findFirst({
      where: and(eq(menuItems.storeId, auth.storeId), eq(menuItems.name, data.name))
    })
    
    if (existingItem) {
      return c.json({ 
        success: false, 
        error: `⚠️ メニュー名「${data.name}」は既に登録されています\n\n別の名前を選択してください。同じ店舗内でメニュー名が重複することはできません。` 
      }, 400)
    }
    
    const result = await db.insert(menuItems).values({
      storeId: auth.storeId,
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description || "",
      price: data.price,
      image: data.image,
      available: data.available ?? true,
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの作成に失敗しました' }, 500)
  }
})

// メニューアイテムを作成（FormData - 画像ファイル対応）
menuRoutes.post('/items-with-file', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // FormDataを取得
    const body = await c.req.formData()
    
    const name = body.get('name') as string
    const description = body.get('description') as string
    const price = Number(body.get('price'))
    const categoryId = body.get('categoryId') ? Number(body.get('categoryId')) : null
    const available = body.get('available') === 'true'
    const imageFile = body.get('image') as File
    
    // バリデーション
    if (!name || name.trim().length === 0) {
      return c.json({ success: false, error: 'メニュー名は必須です' }, 400)
    }
    
    if (!price || price <= 0) {
      return c.json({ success: false, error: '価格は1円以上で入力してください' }, 400)
    }
    
    if (price > 999999) {
      return c.json({ success: false, error: '価格は999,999円以下で入力してください' }, 400)
    }
    
    // 同じ店舗で同じメニュー名が既に存在するかチェック
    const existingItem = await db.query.menuItems.findFirst({
      where: and(eq(menuItems.storeId, auth.storeId), eq(menuItems.name, name))
    })
    
    if (existingItem) {
      return c.json({ 
        success: false, 
        error: `⚠️ メニュー名「${name}」は既に登録されています\n\n別の名前を選択してください。同じ店舗内でメニュー名が重複することはできません。` 
      }, 400)
    }
    
    let imagePath = null
    
    // 画像ファイルがあれば保存処理
    if (imageFile && imageFile.size > 0) {
      // ファイルサイズチェック (5MB制限)
      if (imageFile.size > 5 * 1024 * 1024) {
        return c.json({ success: false, error: '画像ファイルは5MB以下にしてください' }, 400)
      }
      
      // ファイルタイプチェック
      if (!imageFile.type.startsWith('image/')) {
        return c.json({ success: false, error: '画像ファイルを選択してください' }, 400)
      }
      
      // ファイル保存処理（S3またはローカル）
      imagePath = await saveImage(imageFile, 'menu')
      logInfo('Image uploaded successfully', { imagePath, fileSize: imageFile.size, fileName: imageFile.name })
    }
    
    const result = await db.insert(menuItems).values({
      storeId: auth.storeId,
      categoryId,
      name: name.trim(),
      description: description?.trim() || "",
      price,
      image: imagePath,
      available,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating menu item with file:', error)
    return c.json({ success: false, error: 'メニューアイテムの作成に失敗しました' }, 500)
  }
})

// メニューアイテムを取得（統合認証）
menuRoutes.get('/items/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const auth = c.get('auth')
    
    const result = await db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, id), eq(menuItems.storeId, auth.storeId)),
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
menuRoutes.put('/items/:id', flexibleAuthMiddleware, zValidator('json', z.object({
  categoryId: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().positive().max(999999).optional(),
  image: z.string().optional(),
  available: z.boolean().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    // メニュー名を変更する場合は重複チェック
    if (data.name) {
      const existingItem = await db.query.menuItems.findFirst({
        where: and(
          eq(menuItems.storeId, auth.storeId),
          eq(menuItems.name, data.name),
          // 自分自身は除外
          sql`${menuItems.id} != ${id}`
        )
      })
      
      if (existingItem) {
        return c.json({ 
          success: false, 
          error: `⚠️ メニュー名「${data.name}」は既に他のメニューで使用されています\n\n別の名前に変更してください。同じ店舗内でメニュー名が重複することはできません。` 
        }, 400)
      }
    }
    
    const result = await db.update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, auth.storeId)))
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
    
    // 古い画像を削除
    await deleteOldImage(menuItem.image)
    
    const result = await db.delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    logInfo('Menu item deleted', { id, storeId, name: menuItem.name })
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの削除に失敗しました' }, 500)
  }
})
