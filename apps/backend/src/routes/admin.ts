import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { categories, menuItems, options, toppings, allergens, tables, staffMembers, stores } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import bcrypt from 'bcryptjs'

export const adminRoutes = new Hono()

// 全てのルートに認証ミドルウェアを適用
adminRoutes.use('*', authMiddleware)

// ===== メニュー管理 =====

// カテゴリ一覧を取得
adminRoutes.get('/categories', async (c) => {
  try {
    const auth = c.get('auth')
    
    const result = await db.query.categories.findMany({
      where: eq(categories.storeId, auth.storeId)
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ success: false, error: 'カテゴリの取得に失敗しました' }, 500)
  }
})

// カテゴリを作成
adminRoutes.post('/categories', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    const result = await db.insert(categories).values({
      ...data,
      storeId: auth.storeId,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ success: false, error: 'カテゴリの作成に失敗しました' }, 500)
  }
})

// メニューアイテム一覧を取得
adminRoutes.get('/menu-items', async (c) => {
  try {
    const auth = c.get('auth')
    
    const result = await db.query.menuItems.findMany({
      where: eq(menuItems.storeId, auth.storeId),
      with: {
        category: true,
      }
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return c.json({ success: false, error: 'メニューの取得に失敗しました' }, 500)
  }
})

// メニューアイテムを作成
adminRoutes.post('/menu-items', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  categoryId: z.number(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    // カテゴリが自分の店舗のものかチェック
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, data.categoryId), eq(categories.storeId, auth.storeId))
    })
    
    if (!category) {
      return c.json({ success: false, error: '無効なカテゴリです' }, 400)
    }
    
    const result = await db.insert(menuItems).values({
      ...data,
      storeId: auth.storeId,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating menu item:', error)
    return c.json({ success: false, error: 'メニューの作成に失敗しました' }, 500)
  }
})

// ===== テーブル管理 =====

// テーブル一覧を取得
adminRoutes.get('/tables', async (c) => {
  try {
    const auth = c.get('auth')
    
    const result = await db.query.tables.findMany({
      where: eq(tables.storeId, auth.storeId)
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを作成
adminRoutes.post('/tables', zValidator('json', z.object({
  number: z.number().min(1),
  capacity: z.number().min(1),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    // 同じ店舗内でテーブル番号が重複していないかチェック
    const existingTable = await db.query.tables.findFirst({
      where: and(eq(tables.storeId, auth.storeId), eq(tables.number, data.number))
    })
    
    if (existingTable) {
      return c.json({ success: false, error: 'このテーブル番号は既に使用されています' }, 400)
    }
    
    const result = await db.insert(tables).values({
      ...data,
      storeId: auth.storeId,
    }).returning()
    
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating table:', error)
    return c.json({ success: false, error: 'テーブルの作成に失敗しました' }, 500)
  }
})

// ===== 店舗設定 =====

// 現在の店舗情報を更新
adminRoutes.put('/store', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    const result = await db.update(stores).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(stores.id, auth.storeId)).returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating store:', error)
    return c.json({ success: false, error: '店舗情報の更新に失敗しました' }, 500)
  }
})

// ===== スタッフ管理 =====

// スタッフ一覧を取得
adminRoutes.get('/staff', async (c) => {
  try {
    const auth = c.get('auth')
    
    const result = await db.query.staffMembers.findMany({
      where: eq(staffMembers.storeId, auth.storeId)
    })
    
    // パスワードを除外してレスポンス
    const staffData = result.map(({ password, ...staff }) => staff)
    
    return c.json({ success: true, data: staffData })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return c.json({ success: false, error: 'スタッフの取得に失敗しました' }, 500)
  }
})

// スタッフを作成
adminRoutes.post('/staff', zValidator('json', z.object({
  name: z.string().min(1),
  loginId: z.string().min(1, 'ログインIDを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  role: z.enum(['admin', 'manager', 'staff', 'kitchen']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  active: z.boolean().optional(),
}), (result, c) => {
  if (!result.success) {
    const firstError = result.error.issues[0];
    const message = firstError.message || 'バリデーションエラーが発生しました';
    return c.json({ success: false, error: message }, 400);
  }
}), async (c) => {
  try {
    const auth = c.get('auth')
    const rawData = c.req.valid('json')
    
    // 空文字列をundefinedに変換
    const data = {
      ...rawData,
      email: rawData.email === '' ? undefined : rawData.email,
      phone: rawData.phone === '' ? undefined : rawData.phone,
    }
    
    // 同じ店舗内でログインIDが重複していないかチェック
    const existingStaff = await db.query.staffMembers.findFirst({
      where: and(eq(staffMembers.storeId, auth.storeId), eq(staffMembers.loginId, data.loginId))
    })
    
    if (existingStaff) {
      return c.json({ success: false, error: 'このログインIDは既に使用されています' }, 400)
    }
    
    // パスワードハッシュ化
    const hashPassword = async (password: string): Promise<string> => {
      const saltRounds = 12
      return await bcrypt.hash(password, saltRounds)
    }
    
    // メールアドレスが空の場合、ユニークなプレースホルダーを生成
    const email = data.email && data.email.trim() 
      ? data.email.trim() 
      : `no-email-${auth.storeId}-${data.loginId}@placeholder.local`

    const result = await db.insert(staffMembers).values({
      storeId: auth.storeId,
      name: data.name,
      loginId: data.loginId,
      password: await hashPassword(data.password),
      role: data.role || 'staff',
      email: email,
      phone: data.phone || '',
      active: data.active ?? true,
    }).returning()
    
    // パスワードを除外してレスポンス
    const { password, ...staffData } = result[0]
    
    return c.json({ success: true, data: staffData }, 201)
  } catch (error: any) {
    console.error('Error creating staff:', error)
    
    // 特定のエラーに対する詳細なメッセージ
    if (error.code === '23505') {
      if (error.constraint === 'staff_members_email_unique') {
        return c.json({ success: false, error: 'このメールアドレスは既に使用されています' }, 400)
      }
      if (error.constraint === 'staff_members_store_id_login_id_unique') {
        return c.json({ success: false, error: 'このログインIDは既に使用されています' }, 400)
      }
    }
    
    return c.json({ success: false, error: 'スタッフの作成に失敗しました' }, 500)
  }
})