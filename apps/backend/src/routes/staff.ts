import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { staffMembers } from '../db/schema'
import { eq } from 'drizzle-orm'

export const staffRoutes = new Hono()

// スタッフ一覧を取得
staffRoutes.get('/', async (c) => {
  try {
    const result = await db.query.staffMembers.findMany()
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching staff members:', error)
    return c.json({ success: false, error: 'スタッフの取得に失敗しました' }, 500)
  }
})

// スタッフを作成
staffRoutes.post('/', zValidator('json', z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'staff', 'kitchen']).optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const data = c.req.valid('json')
    const result = await db.insert(staffMembers).values(data).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    console.error('Error creating staff member:', error)
    return c.json({ success: false, error: 'スタッフの作成に失敗しました' }, 500)
  }
})

// スタッフを取得
staffRoutes.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const result = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, id),
    })
    
    if (!result) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return c.json({ success: false, error: 'スタッフの取得に失敗しました' }, 500)
  }
})

// スタッフを更新
staffRoutes.put('/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'staff', 'kitchen']).optional(),
  active: z.boolean().optional(),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    const result = await db.update(staffMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(staffMembers.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating staff member:', error)
    return c.json({ success: false, error: 'スタッフの更新に失敗しました' }, 500)
  }
})

// スタッフを削除
staffRoutes.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    
    const result = await db.delete(staffMembers)
      .where(eq(staffMembers.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'スタッフが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return c.json({ success: false, error: 'スタッフの削除に失敗しました' }, 500)
  }
})
