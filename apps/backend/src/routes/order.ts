import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { orders, orderItems, orderItemOptions, orderItemToppings, stores, tables, menuItems } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { flexibleAuthMiddleware } from '../middleware/auth'
import { logError } from '../utils/logger-simple'
import { getJSTDate } from '../utils/accounting'

export const orderRoutes = new Hono()

// 注文一覧を取得（統合認証）
orderRoutes.get('/', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    
    const result = await db.query.orders.findMany({
      where: eq(orders.storeId, auth.storeId),
      with: {
        table: true,
        items: true,
      },
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching orders:', error)
    return c.json({ success: false, error: '注文の取得に失敗しました' }, 500)
  }
})

// 注文を作成（統合認証）
orderRoutes.post('/', flexibleAuthMiddleware, zValidator('json', z.object({
  tableNumber: z.number().int().positive(),
  items: z.array(z.object({
    menuItemId: z.number().int().positive(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
    options: z.array(z.object({
      name: z.string().min(1),
      price: z.number().int(),
    })).optional(),
    toppings: z.array(z.object({
      name: z.string().min(1),
      price: z.number().int(),
    })).optional(),
  })),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const { tableNumber, items } = c.req.valid('json')
    
    // 店舗ID + テーブル番号からテーブルIDを安全に解決
    const table = await db.query.tables.findFirst({
      where: and(eq(tables.storeId, auth.storeId), eq(tables.number, tableNumber))
    })
    
    if (!table) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    const tableId = table.id
    
    // トランザクションを開始
    const result = await db.transaction(async (tx) => {
      // 価格計算のためのメニューアイテム取得
      let subtotalAmount = 0
      const itemsWithPrices = []
      
      for (const item of items) {
        // メニューアイテムの価格を取得
        const menuItem = await tx.query.menuItems.findFirst({
          where: eq(menuItems.id, item.menuItemId)
        })
        
        if (!menuItem) {
          throw new Error(`メニューアイテムが見つかりません: ${item.menuItemId}`)
        }
        
        const unitPrice = parseFloat(menuItem.price.toString())
        const totalPrice = unitPrice * item.quantity
        subtotalAmount += totalPrice
        
        itemsWithPrices.push({
          ...item,
          unitPrice,
          totalPrice
        })
      }
      
      // 税抜き金額をそのまま使用
      const taxAmount = 0
      const totalAmount = subtotalAmount
      
      // 注文を作成（価格情報込み）
      const [order] = await tx.insert(orders).values({
        storeId: auth.storeId,
        tableId,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotalAmount: subtotalAmount.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: 'new',
      }).returning()
      
      // 注文アイテムを作成（価格情報込み）
      for (const item of itemsWithPrices) {
        const [orderItem] = await tx.insert(orderItems).values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          notes: item.notes,
          status: 'new',
        }).returning()
        
        // オプションを作成
        if (item.options && item.options.length > 0) {
          await tx.insert(orderItemOptions).values(
            item.options.map(option => ({
              orderItemId: orderItem.id,
              name: option.name,
              price: option.price.toString(),
            }))
          )
        }
        
        // トッピングを作成
        if (item.toppings && item.toppings.length > 0) {
          await tx.insert(orderItemToppings).values(
            item.toppings.map(topping => ({
              orderItemId: orderItem.id,
              name: topping.name,
              price: topping.price.toString(),
            }))
          )
        }
      }
      
      // 作成した注文を返す
      return await tx.query.orders.findFirst({
        where: eq(orders.id, order.id),
        with: {
          table: true,
          items: {
            with: {
              options: true,
              toppings: true,
            },
          },
        },
      })
    })
    
    return c.json({ success: true, data: result }, 201)
  } catch (error) {
    logError('Error creating order:', error)
    return c.json({ success: false, error: '注文の作成に失敗しました' }, 500)
  }
})

// 注文を取得
orderRoutes.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        table: true,
        items: {
          with: {
            options: true,
            toppings: true,
          },
        },
      },
    })
    
    if (!result) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching order:', error)
    return c.json({ success: false, error: '注文の取得に失敗しました' }, 500)
  }
})

// 注文ステータスを更新
orderRoutes.patch('/:id/status', zValidator('json', z.object({
  status: z.enum(['new', 'in-progress', 'ready', 'delivered', 'cancelled']),
})), async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const { status } = c.req.valid('json')
    
    const result = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating order status:', error)
    return c.json({ success: false, error: '注文ステータスの更新に失敗しました' }, 500)
  }
})

// 注文アイテムのステータスを更新
orderRoutes.patch('/items/:itemId/status', zValidator('json', z.object({
  status: z.enum(['new', 'in-progress', 'ready', 'delivered', 'cancelled']),
})), async (c) => {
  try {
    const itemId = Number(c.req.param('itemId'))
    const { status } = c.req.valid('json')
    
    const result = await db.update(orderItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(orderItems.id, itemId))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '注文アイテムが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating order item status:', error)
    return c.json({ success: false, error: '注文アイテムステータスの更新に失敗しました' }, 500)
  }
})

// テーブルごとの注文を取得（統合認証）
orderRoutes.get('/table/:tableNumber', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const tableNumber = Number(c.req.param('tableNumber'))
    
    // 店舗ID + テーブル番号からテーブルIDを安全に解決
    const table = await db.query.tables.findFirst({
      where: and(eq(tables.storeId, auth.storeId), eq(tables.number, tableNumber))
    })
    
    if (!table) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    const result = await db.query.orders.findMany({
      where: and(eq(orders.tableId, table.id), eq(orders.storeId, auth.storeId)),
      with: {
        table: true,
        items: {
          with: {
            menuItem: true,
            options: true,
            toppings: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching orders by table:', error)
    return c.json({ success: false, error: 'テーブルごとの注文の取得に失敗しました' }, 500)
  }
})
