import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { staffMembers } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { flexibleAuthMiddleware } from '../middleware/auth'
import { logError } from '../utils/logger-simple'

export const staffRoutes = new Hono()

// 役割一覧を取得
staffRoutes.get('/roles', async (c) => {
  try {
    // デフォルトの役割一覧を返す
    const roles = [
      { 
        id: "admin", 
        name: "管理者", 
        color: "bg-purple-100 text-purple-800",
        description: "システム全体の管理権限"
      },
      { 
        id: "manager", 
        name: "マネージャー", 
        color: "bg-blue-100 text-blue-800",
        description: "店舗運営の管理権限"
      },
      { 
        id: "staff", 
        name: "一般スタッフ", 
        color: "bg-green-100 text-green-800",
        description: "接客・レジ業務"
      },
      { 
        id: "kitchen", 
        name: "キッチンスタッフ", 
        color: "bg-orange-100 text-orange-800",
        description: "調理業務"
      },
    ]
    return c.json({ success: true, data: roles })
  } catch (error) {
    logError('Error fetching roles:', error)
    return c.json({ success: false, error: '役割の取得に失敗しました' }, 500)
  }
})

// スタッフ一覧を取得（認証必須）
staffRoutes.get('/', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    // 認証された店舗のスタッフのみ取得
    const result = await db.query.staffMembers.findMany({
      where: eq(staffMembers.storeId, auth.storeId)
    })
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching staff members:', error)
    return c.json({ success: false, error: 'スタッフの取得に失敗しました' }, 500)
  }
})

// スタッフを作成（認証必須）
staffRoutes.post('/', flexibleAuthMiddleware, zValidator('json', z.object({
  name: z.string().min(1),
  loginId: z.string().min(1),
  password: z.string().min(6),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    // 同じ店舗でログインIDが重複していないかチェック
    const existingStaff = await db.query.staffMembers.findFirst({
      where: and(eq(staffMembers.storeId, auth.storeId), eq(staffMembers.loginId, data.loginId))
    })
    
    if (existingStaff) {
      return c.json({ 
        success: false, 
        error: `⚠️ ログインID「${data.loginId}」は既に使用されています\n\n別のログインIDを選択してください。同じ店舗内でログインIDが重複することはできません。` 
      }, 400)
    }
    
    const result = await db.insert(staffMembers).values({
      storeId: auth.storeId,
      name: data.name,
      loginId: data.loginId,
      password: data.password,
      role: 'staff', // デフォルト値
      active: true, // デフォルト値
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating staff member:', error)
    return c.json({ success: false, error: 'スタッフの作成に失敗しました' }, 500)
  }
})

// スタッフを取得（認証必須）
staffRoutes.get('/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const result = await db.query.staffMembers.findFirst({
      where: and(eq(staffMembers.id, id), eq(staffMembers.storeId, auth.storeId)),
    })
    
    if (!result) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching staff member:', error)
    return c.json({ success: false, error: 'スタッフの取得に失敗しました' }, 500)
  }
})

// スタッフを更新（認証必須）
staffRoutes.put('/:id', flexibleAuthMiddleware, zValidator('json', z.object({
  name: z.string().min(1).optional(),
  loginId: z.string().min(1).optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    // ログインIDを変更する場合は重複チェック
    if (data.loginId) {
      const existingStaff = await db.query.staffMembers.findFirst({
        where: and(
          eq(staffMembers.storeId, auth.storeId),
          eq(staffMembers.loginId, data.loginId),
          // 自分自身は除外
          sql`${staffMembers.id} != ${id}`
        )
      })
      
      if (existingStaff) {
        return c.json({ 
          success: false, 
          error: `⚠️ ログインID「${data.loginId}」は既に他のスタッフで使用されています\n\n別のログインIDに変更してください。同じ店舗内でログインIDが重複することはできません。` 
        }, 400)
      }
    }
    
    const result = await db.update(staffMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(staffMembers.id, id), eq(staffMembers.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating staff member:', error)
    return c.json({ success: false, error: 'スタッフの更新に失敗しました' }, 500)
  }
})

// スタッフを削除（認証必須）
staffRoutes.delete('/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    
    const result = await db.delete(staffMembers)
      .where(and(eq(staffMembers.id, id), eq(staffMembers.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error deleting staff member:', error)
    return c.json({ success: false, error: 'スタッフの削除に失敗しました' }, 500)
  }
})
