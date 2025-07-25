import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { categories, menuItems, options, toppings, allergens, orderItems, stores } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { authMiddleware, optionalAuthMiddleware, flexibleAuthMiddleware } from '../middleware/auth'
import { saveImage, isS3Enabled } from '../utils/s3'
import { logError, logInfo, logDebug } from '../utils/logger-simple'
import { createJSTTimestamp } from '../utils/accounting'

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
    logError('Error fetching categories:', error)
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
    const now = createJSTTimestamp()
    const result = await db.insert(categories).values({
      storeId: auth.storeId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating category:', error)
    return c.json({ success: false, error: 'カテゴリの作成に失敗しました' }, 500)
  }
})

// カテゴリを更新（統合認証）
menuRoutes.put('/categories/:id', flexibleAuthMiddleware, zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const { name, description } = c.req.valid('json')
    
    const result = await db.update(categories)
      .set({ 
        name, 
        description, 
        updatedAt: createJSTTimestamp() 
      })
      .where(and(eq(categories.id, id), eq(categories.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'カテゴリが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating category:', error)
    return c.json({ success: false, error: 'カテゴリの更新に失敗しました' }, 500)
  }
})

// カテゴリを削除（統合認証）
menuRoutes.delete('/categories/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    
    // カテゴリが存在するかチェック
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.storeId, auth.storeId))
    })
    
    if (!category) {
      return c.json({ success: false, error: 'カテゴリが見つかりません' }, 404)
    }
    
    // このカテゴリを使用しているメニューアイテムがあるかチェック
    const menuItemsUsingCategory = await db.query.menuItems.findMany({
      where: and(eq(menuItems.categoryId, id), eq(menuItems.storeId, auth.storeId))
    })
    
    logInfo('Category deletion process started', { 
      id, 
      storeId: auth.storeId, 
      name: category.name,
      affectedMenuItems: menuItemsUsingCategory.length 
    })
    
    // トランザクションを使用して安全に削除処理を実行
    const result = await db.transaction(async (tx) => {
      // カテゴリを使用しているメニューアイテムがある場合は、それらのcategoryIdをnullに設定
      if (menuItemsUsingCategory.length > 0) {
        logInfo('Updating menu items to remove category reference', { 
          categoryId: id,
          menuItemsCount: menuItemsUsingCategory.length 
        })
        
        const updateResult = await tx.update(menuItems)
          .set({ categoryId: null, updatedAt: createJSTTimestamp() })
          .where(and(eq(menuItems.categoryId, id), eq(menuItems.storeId, auth.storeId)))
          .returning({ id: menuItems.id })
        
        logInfo('Menu items updated successfully', { 
          updatedCount: updateResult.length 
        })
      }
      
      // カテゴリを削除
      logInfo('Deleting category', { categoryId: id })
      const deleteResult = await tx.delete(categories)
        .where(and(eq(categories.id, id), eq(categories.storeId, auth.storeId)))
        .returning()
      
      if (deleteResult.length === 0) {
        throw new Error('カテゴリの削除に失敗しました（削除対象が見つかりません）')
      }
      
      return deleteResult[0]
    })
    
    logInfo('Category deleted successfully', { 
      id, 
      storeId: auth.storeId, 
      name: category.name,
      affectedMenuItems: menuItemsUsingCategory.length 
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error deleting category:', error)
    
    // より詳細なエラーメッセージを提供
    let errorMessage = 'カテゴリの削除に失敗しました'
    if (error instanceof Error) {
      logError('Detailed error message:', { message: error.message, stack: error.stack })
      if (error.message.includes('foreign key') || error.message.includes('violates foreign key constraint')) {
        errorMessage = 'このカテゴリは他のデータで使用されているため削除できません'
      } else if (error.message.includes('削除対象が見つかりません')) {
        errorMessage = error.message
      } else {
        // 開発環境では詳細なエラーメッセージを表示
        errorMessage = `カテゴリの削除に失敗しました: ${error.message}`
      }
    }
    
    return c.json({ success: false, error: errorMessage }, 500)
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
    logError('Error fetching menu items:', error)
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
    
    const now = createJSTTimestamp()
    const result = await db.insert(menuItems).values({
      storeId: auth.storeId,
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description || "",
      price: data.price,
      image: data.image,
      available: data.available ?? true,
      createdAt: now,
      updatedAt: now,
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating menu item:', error)
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
    
    const now = createJSTTimestamp()
    const result = await db.insert(menuItems).values({
      storeId: auth.storeId,
      categoryId,
      name: name.trim(),
      description: description?.trim() || "",
      price,
      image: imagePath,
      available,
      createdAt: now,
      updatedAt: now,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating menu item with file:', error)
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
    logError('Error fetching menu item:', error)
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
      .set({ ...data, updatedAt: createJSTTimestamp() })
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの更新に失敗しました' }, 500)
  }
})

// メニューアイテムを削除（統合認証）
menuRoutes.delete('/items/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const auth = c.get('auth')
    
    // メニューアイテムの詳細を取得して提供状況をチェック
    const menuItem = await db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, id), eq(menuItems.storeId, auth.storeId))
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
      .where(and(eq(menuItems.id, id), eq(menuItems.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'メニューアイテムが見つかりません' }, 404)
    }
    
    logInfo('Menu item deleted', { id, storeId: auth.storeId, name: menuItem.name })
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error deleting menu item:', error)
    return c.json({ success: false, error: 'メニューアイテムの削除に失敗しました' }, 500)
  }
})
