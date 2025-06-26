import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { tables, stores, orders, orderItems, orderItemOptions, orderItemToppings, salesCycles, archivedOrders, archivedOrderItems, archivedOrderItemOptions, archivedOrderItemToppings, menuItems, storeBusinessHours } from '../db/schema'
import { eq, and, sql, desc, SQL, gte, lt } from 'drizzle-orm'
import { flexibleAuthMiddleware } from '../middleware/auth'
import { logError } from '../utils/logger-simple'
import { getAccountingDate } from '../utils/accounting'

/**
 * 営業日ベースでテーブルの次のサイクル番号を取得
 */
async function getNextCycleNumberForBusinessDay(
  tx: any,
  storeId: number,
  tableId: number,
  accountingDate: string
): Promise<number> {
  try {
    // 店舗の営業時間設定を取得
    const businessHours = await tx
      .select()
      .from(storeBusinessHours)
      .where(and(
        eq(storeBusinessHours.storeId, storeId),
        eq(storeBusinessHours.isActive, true)
      ))
      .limit(1)
    
    if (businessHours.length === 0) {
      // 営業時間設定がない場合は従来のロジック
      const result = await tx.select({
        maxCycle: sql<number>`COALESCE(MAX(${salesCycles.cycleNumber}), 0) + 1`
      })
      .from(salesCycles)
      .where(eq(salesCycles.tableId, tableId))
      
      return result[0].maxCycle
    }

    const { openTime, closeTime, isNextDay } = businessHours[0]
    
    // 営業日の期間を計算
    const start = new Date(`${accountingDate}T${openTime}`)
    let end: Date
    
    // closeTimeが24:00の場合は翌日の00:00として扱う
    let actualCloseTime = closeTime
    if (closeTime === '24:00') {
      actualCloseTime = '00:00'
    }
    
    if (isNextDay || closeTime === '24:00') {
      // 翌日にまたがる場合（24:00の場合は必ず翌日）
      end = new Date(`${accountingDate}T${actualCloseTime}`)
      end.setDate(end.getDate() + 1)
    } else {
      // 同日の場合
      end = new Date(`${accountingDate}T${actualCloseTime}`)
    }
    
    // 指定営業日期間内のそのテーブルの最大サイクル数を取得
    const result = await tx.select({
      maxCycle: sql<number>`COALESCE(MAX(${salesCycles.cycleNumber}), 0) + 1`
    })
    .from(salesCycles)
    .where(and(
      eq(salesCycles.tableId, tableId),
      eq(salesCycles.storeId, storeId),
      gte(salesCycles.completedAt, start),
      lt(salesCycles.completedAt, end)
    ))
    
    return result[0].maxCycle
    
  } catch (error) {
    logError('Error calculating next cycle number:', error)
    // エラー時は従来のロジックにフォールバック
    const result = await tx.select({
      maxCycle: sql<number>`COALESCE(MAX(${salesCycles.cycleNumber}), 0) + 1`
    })
    .from(salesCycles)
    .where(eq(salesCycles.tableId, tableId))
    
    return result[0].maxCycle
  }
}

export const tableRoutes = new Hono()

// テーブル存在確認（店舗コード + テーブル番号）
tableRoutes.get('/validate/:storeCode/:tableNumber', async (c) => {
  try {
    const storeCode = c.req.param('storeCode')
    const tableNumber = Number(c.req.param('tableNumber'))
    
    // 店舗コードから店舗を取得
    const store = await db.query.stores.findFirst({
      where: eq(stores.storeCode, storeCode)
    })
    
    if (!store || !store.active) {
      return c.json({ 
        success: false, 
        error: '店舗コードが無効です',
        exists: false 
      }, 404)
    }
    
    // 店舗のテーブル番号を確認
    const table = await db.query.tables.findFirst({
      where: and(
        eq(tables.storeId, store.id),
        eq(tables.number, tableNumber)
      )
    })
    
    if (!table) {
      return c.json({ 
        success: false, 
        error: `テーブル${tableNumber}は存在しません`,
        exists: false 
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      exists: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          storeCode: store.storeCode
        },
        table: {
          id: table.id,
          number: table.number,
          capacity: table.capacity,
        }
      }
    })
    
  } catch (error) {
    logError('Error validating table:', error)
    return c.json({ 
      success: false, 
      error: 'テーブル確認中にエラーが発生しました',
      exists: false 
    }, 500)
  }
})

// テーブル一覧を取得（認証必須）
tableRoutes.get('/', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const checkoutRequested = c.req.query('checkoutRequested')
    
    // 認証された店舗のテーブルのみを取得
    let whereCondition: SQL<unknown> = eq(tables.storeId, auth.storeId)
    
    // 会計要請されたテーブルのみを取得する場合
    if (checkoutRequested === 'true') {
      const checkoutCondition = and(whereCondition, eq(tables.checkoutRequested, true))
      if (checkoutCondition) {
        whereCondition = checkoutCondition
      }
    }
    
    const result = await db.query.tables.findMany({
      where: whereCondition,
      orderBy: (tables, { asc }) => [asc(tables.number)]
    })
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching tables:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを作成（認証必須）
tableRoutes.post('/', flexibleAuthMiddleware, zValidator('json', z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  area: z.enum(['area1', 'area2', 'area3', 'area4']).optional().default('area1'),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const data = c.req.valid('json')
    
    // 同じ店舗で同じテーブル番号が既に存在するかチェック
    const existingTable = await db.query.tables.findFirst({
      where: and(eq(tables.storeId, auth.storeId), eq(tables.number, data.number))
    })
    
    if (existingTable) {
      return c.json({ 
        success: false, 
        error: `⚠️ テーブル番号 ${data.number} は既に使用されています\n\n別の番号を選択してください。現在登録されているテーブル番号と重複しています。` 
      }, 400)
    }
    
    const result = await db.insert(tables).values({
      storeId: auth.storeId,
      number: data.number,
      capacity: data.capacity,
      area: data.area || 'area1',
    }).returning()
    return c.json({ success: true, data: result[0] }, 201)
  } catch (error) {
    logError('Error creating table:', error)
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
    logError('Error fetching table by number:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを取得（認証必須）
tableRoutes.get('/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const result = await db.query.tables.findFirst({
      where: and(eq(tables.id, id), eq(tables.storeId, auth.storeId)),
    })
    
    if (!result) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    logError('Error fetching table:', error)
    return c.json({ success: false, error: 'テーブルの取得に失敗しました' }, 500)
  }
})

// テーブルを更新（認証必須）
tableRoutes.put('/:id', flexibleAuthMiddleware, zValidator('json', z.object({
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  area: z.enum(['area1', 'area2', 'area3', 'area4']).optional(),
})), async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    const data = c.req.valid('json')
    
    // テーブル番号を変更する場合は重複チェック
    if (data.number) {
      const existingTable = await db.query.tables.findFirst({
        where: and(
          eq(tables.storeId, auth.storeId), 
          eq(tables.number, data.number),
          // 自分自身は除外
          sql`${tables.id} != ${id}`
        )
      })
      
      if (existingTable) {
        return c.json({ 
          success: false, 
          error: `⚠️ テーブル番号 ${data.number} は既に他のテーブルで使用されています\n\n別の番号に変更してください。同じ店舗内でテーブル番号が重複することはできません。` 
        }, 400)
      }
    }
    
    const result = await db.update(tables)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tables.id, id), eq(tables.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error updating table:', error)
    return c.json({ success: false, error: 'テーブルの更新に失敗しました' }, 500)
  }
})

// テーブルを削除（認証必須）
tableRoutes.delete('/:id', flexibleAuthMiddleware, async (c) => {
  try {
    const auth = c.get('auth')
    const id = Number(c.req.param('id'))
    
    const result = await db.delete(tables)
      .where(and(eq(tables.id, id), eq(tables.storeId, auth.storeId)))
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error) {
    logError('Error deleting table:', error)
    return c.json({ success: false, error: 'テーブルの削除に失敗しました' }, 500)
  }
})


// テーブル会計要請（お客様用）
tableRoutes.post('/:number/request-checkout', async (c) => {
  try {
    const tableNumber = Number(c.req.param('number'))
    
    // 最初の店舗でテーブル番号を検索
    const firstStore = await db.query.stores.findFirst()
    if (!firstStore) {
      return c.json({ success: false, error: '店舗が見つかりません' }, 404)
    }
    
    const table = await db.query.tables.findFirst({
      where: and(eq(tables.number, tableNumber), eq(tables.storeId, firstStore.id)),
    })
    
    if (!table) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }
    
    // 会計要請フラグを設定
    const result = await db.update(tables)
      .set({
        checkoutRequested: true,
        checkoutRequestedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tables.id, table.id))
      .returning()
    
    return c.json({
      success: true,
      data: {
        table: result[0],
        message: `テーブル${tableNumber}の会計をスタッフに要請しました。`
      }
    })
  } catch (error) {
    logError('Error requesting checkout:', error)
    return c.json({ success: false, error: '会計要請中にエラーが発生しました' }, 500)
  }
})

// テーブル会計完了（スタッフ用）
tableRoutes.post('/:id/checkout', async (c) => {
  try {
    const tableId = Number(c.req.param('id'))
    const storeId = Number(c.req.query('storeId') || '1')
    
    // テーブルが存在するかチェック
    const table = await db.query.tables.findFirst({
      where: and(eq(tables.id, tableId), eq(tables.storeId, storeId))
    })
    
    if (!table) {
      return c.json({ success: false, error: 'テーブルが見つかりません' }, 404)
    }

    // トランザクション開始
    const result = await db.transaction(async (tx) => {
      // 1. 該当テーブルの全注文とアイテムを取得
      const tableOrders = await tx.query.orders.findMany({
        where: and(
          eq(orders.tableId, tableId),
          sql`${orders.status} != 'delivered'` // まだ会計していない注文のみ
        ),
        with: {
          items: {
            with: {
              options: true,
              toppings: true,
              menuItem: true
            }
          }
        }
      })

      if (tableOrders.length === 0) {
        return { salesCycle: null, archivedOrdersCount: 0, totalAmount: 0 }
      }

      // 2. 売上サイクルの作成または取得
      let salesCycle = await tx.query.salesCycles.findFirst({
        where: and(
          eq(salesCycles.tableId, tableId),
          eq(salesCycles.status, 'active')
        )
      })

      if (!salesCycle) {
        // 営業日ベースで新しいサイクル番号を計算
        const currentTime = new Date()
        
        // 店舗の営業時間設定を取得して会計日を計算
        const businessHours = await tx
          .select()
          .from(storeBusinessHours)
          .where(and(
            eq(storeBusinessHours.storeId, storeId),
            eq(storeBusinessHours.isActive, true)
          ))
          .limit(1)
        
        let accountingDate: string
        if (businessHours.length > 0) {
          accountingDate = getAccountingDate(currentTime, businessHours[0].openTime)
        } else {
          // 営業時間設定がない場合はデフォルト（5:00基準）
          accountingDate = getAccountingDate(currentTime, '05:00:00')
        }
        
        // 営業日ベースでサイクル番号を取得
        const cycleNumber = await getNextCycleNumberForBusinessDay(
          tx,
          storeId,
          tableId,
          accountingDate
        )

        const [newSalesCycle] = await tx.insert(salesCycles).values({
          storeId,
          tableId,
          cycleNumber,
          totalAmount: '0',
          totalItems: 0,
          status: 'active'
        }).returning()

        salesCycle = newSalesCycle
      }

      // 3. 合計金額と数量を計算
      let totalAmount = 0
      let totalItems = 0

      for (const order of tableOrders) {
        for (const item of order.items) {
          const basePrice = Number(item.menuItem?.price || 0)
          const optionsPrice = item.options?.reduce((sum, opt) => sum + Number(opt.price), 0) || 0
          const toppingsPrice = item.toppings?.reduce((sum, top) => sum + Number(top.price), 0) || 0
          const unitPrice = basePrice + optionsPrice + toppingsPrice
          const itemTotal = unitPrice * item.quantity
          
          totalAmount += itemTotal
          totalItems += item.quantity
        }
      }

      // 4. 注文をアーカイブテーブルに移動
      for (const order of tableOrders) {
        // 注文をアーカイブ
        const [archivedOrder] = await tx.insert(archivedOrders).values({
          salesCycleId: salesCycle.id,
          originalOrderId: order.id,
          storeId,
          tableId,
          tableNumber: table.number,
          status: 'completed',
          totalItems: order.totalItems,
          totalAmount: String(totalAmount),
          originalCreatedAt: order.createdAt,
        }).returning()

        // アイテムをアーカイブ
        for (const item of order.items) {
          const basePrice = Number(item.menuItem?.price || 0)
          const optionsPrice = item.options?.reduce((sum, opt) => sum + Number(opt.price), 0) || 0
          const toppingsPrice = item.toppings?.reduce((sum, top) => sum + Number(top.price), 0) || 0
          const unitPrice = basePrice + optionsPrice + toppingsPrice
          const itemTotalPrice = unitPrice * item.quantity

          const [archivedItem] = await tx.insert(archivedOrderItems).values({
            archivedOrderId: archivedOrder.id,
            originalItemId: item.id,
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: String(unitPrice),
            totalPrice: String(itemTotalPrice),
            notes: item.notes,
            status: 'completed',
            originalCreatedAt: item.createdAt,
          }).returning()

          // オプションをアーカイブ
          if (item.options && item.options.length > 0) {
            for (const option of item.options) {
              await tx.insert(archivedOrderItemOptions).values({
                archivedOrderItemId: archivedItem.id,
                name: option.name,
                price: String(option.price),
              })
            }
          }

          // トッピングをアーカイブ
          if (item.toppings && item.toppings.length > 0) {
            for (const topping of item.toppings) {
              await tx.insert(archivedOrderItemToppings).values({
                archivedOrderItemId: archivedItem.id,
                name: topping.name,
                price: String(topping.price),
              })
            }
          }
        }
      }

      // 5. 売上サイクルを完了状態に更新
      await tx.update(salesCycles)
        .set({
          status: 'completed',
          totalAmount: String(totalAmount),
          totalItems,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(salesCycles.id, salesCycle.id))

      // 6. 元の注文とアイテムを削除
      for (const order of tableOrders) {
        // アイテムのオプション・トッピングを削除
        for (const item of order.items) {
          await tx.delete(orderItemOptions).where(eq(orderItemOptions.orderItemId, item.id))
          await tx.delete(orderItemToppings).where(eq(orderItemToppings.orderItemId, item.id))
        }
        // アイテムを削除
        await tx.delete(orderItems).where(eq(orderItems.orderId, order.id))
        // 注文を削除
        await tx.delete(orders).where(eq(orders.id, order.id))
      }

      // 7. テーブル会計フラグをリセット
      await tx.update(tables)
        .set({ 
          checkoutRequested: false,
          checkoutRequestedAt: null,
          updatedAt: new Date()
        })
        .where(eq(tables.id, tableId))

      return { 
        salesCycle, 
        archivedOrdersCount: tableOrders.length, 
        totalAmount,
        totalItems 
      }
    })
    
    return c.json({ 
      success: true, 
      data: { 
        table: table,
        salesCycle: result.salesCycle,
        archivedOrders: result.archivedOrdersCount,
        totalAmount: result.totalAmount,
        totalItems: result.totalItems,
        message: `テーブル${table.number}の会計が完了しました。売上: ¥${result.totalAmount.toLocaleString()}`
      }
    })
  } catch (error) {
    logError('Error processing table checkout:', error)
    return c.json({ success: false, error: '会計処理中にエラーが発生しました' }, 500)
  }
})
