import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { 
  accountingSettings, 
  dailySales, 
  orders, 
  orderItems,
  archivedOrders,
  archivedOrderItems,
  salesCycles,
  stores,
  storeBusinessHours,
  tables
} from '../db/schema'
import { eq, and, gte, lt, sql, desc } from 'drizzle-orm'
import { flexibleAuthMiddleware } from '../middleware/auth'
import { 
  getAccountingDate, 
  getAccountingPeriod, 
  getCurrentAccountingDate,
  generateAccountingDateRange,
  getJSTDate,
  calculateTax,
  centToJpy
} from '../utils/accounting'
import { logError, logInfo } from '../utils/logger'

/**
 * 店舗の営業時間設定を取得
 */
const getStoreBusinessHours = async (storeId: number) => {
  try {
    // アクティブな営業時間設定を取得
    const businessHours = await db
      .select()
      .from(storeBusinessHours)
      .where(and(
        eq(storeBusinessHours.storeId, storeId),
        eq(storeBusinessHours.isActive, true)
      ))
      .limit(1)
    
    if (businessHours.length > 0) {
      return {
        openTime: businessHours[0].openTime || '05:00:00',
        closeTime: businessHours[0].closeTime || '05:00:00',
        isNextDay: businessHours[0].isNextDay || false
      }
    }
    
    // 営業時間設定がない場合は従来のaccountingSettingsから取得
    const settings = await db
      .select()
      .from(accountingSettings)
      .where(eq(accountingSettings.storeId, storeId))
      .limit(1)
    
    return {
      openTime: settings[0]?.dayClosingTime || '05:00:00',
      closeTime: settings[0]?.dayClosingTime || '05:00:00',
      isNextDay: false
    }
  } catch (error) {
    logError('Error fetching store business hours', error)
    // エラー時はデフォルト値を返す
    return {
      openTime: '05:00:00',
      closeTime: '05:00:00',
      isNextDay: false
    }
  }
}

/**
 * 営業時間に基づく会計期間を取得
 */
const getBusinessHoursAccountingPeriod = (accountingDate: string, businessHours: { openTime: string; closeTime: string; isNextDay: boolean }) => {
  const { openTime, closeTime, isNextDay } = businessHours
  
  // 期間開始：会計日の営業開始時間
  const start = new Date(`${accountingDate}T${openTime}`)
  
  // 期間終了：営業終了時間
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
    // 同日の場合：同日の営業終了時間
    end = new Date(`${accountingDate}T${actualCloseTime}`)
  }
  
  return { start, end }
}

export const accountingRoutes = new Hono()

// 認証ミドルウェアを適用
accountingRoutes.use('*', flexibleAuthMiddleware)

// 会計設定の取得
accountingRoutes.get('/settings', async (c) => {
  try {
    const storeId = c.get('auth').storeId
    
    const settings = await db
      .select()
      .from(accountingSettings)
      .where(eq(accountingSettings.storeId, storeId))
      .limit(1)
    
    if (settings.length === 0) {
      // デフォルト設定を作成
      const defaultSettings = await db
        .insert(accountingSettings)
        .values({
          storeId,
          dayClosingTime: '05:00:00',
          taxRate: '0.10',
          displayCurrency: 'JPY'
        })
        .returning()
      
      return c.json({
        success: true,
        data: defaultSettings[0]
      })
    }
    
    return c.json({
      success: true,
      data: settings[0]
    })
    
  } catch (error) {
    logError('Error fetching accounting settings', error)
    return c.json({ success: false, error: '会計設定の取得に失敗しました' }, 500)
  }
})

// 会計設定の更新
accountingRoutes.put('/settings', zValidator('json', z.object({
  dayClosingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, '時間形式が正しくありません').optional(),
  taxRate: z.number().min(0).max(1, '税率は0-1の範囲で入力してください').optional(),
  displayCurrency: z.string().default('JPY').optional()
})), async (c) => {
  try {
    const storeId = c.get('auth').storeId
    const updateData = c.req.valid('json')
    
    // 部分更新用のデータを準備
    const updateValues: any = {
      updatedAt: sql`now()`
    }
    
    if (updateData.dayClosingTime !== undefined) {
      updateValues.dayClosingTime = updateData.dayClosingTime
    }
    if (updateData.taxRate !== undefined) {
      updateValues.taxRate = updateData.taxRate.toString()
    }
    if (updateData.displayCurrency !== undefined) {
      updateValues.displayCurrency = updateData.displayCurrency
    }

    const updatedSettings = await db
      .update(accountingSettings)
      .set(updateValues)
      .where(eq(accountingSettings.storeId, storeId))
      .returning()
    
    if (updatedSettings.length === 0) {
      // 設定が存在しない場合は作成
      const newSettings = await db
        .insert(accountingSettings)
        .values({
          storeId,
          ...updateData,
          taxRate: updateData.taxRate?.toString() || '0.1'
        })
        .returning()
      
      return c.json({
        success: true,
        data: newSettings[0]
      })
    }
    
    logInfo(`Accounting settings updated for store ${storeId}`)
    
    return c.json({
      success: true,
      data: updatedSettings[0]
    })
    
  } catch (error) {
    logError('Error updating accounting settings', error)
    return c.json({ success: false, error: '会計設定の更新に失敗しました' }, 500)
  }
})

// 日次売上の取得
accountingRoutes.get('/daily-sales', zValidator('query', z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})), async (c) => {
  try {
    const storeId = c.get('auth').storeId
    const { date, startDate, endDate } = c.req.valid('query')
    
    // 店舗の営業時間設定を取得
    const businessHours = await getStoreBusinessHours(storeId)
    
    let targetDates: string[]
    
    if (date) {
      targetDates = [date]
    } else if (startDate && endDate) {
      targetDates = generateAccountingDateRange(startDate, endDate)
    } else {
      // デフォルトは今日（営業開始時刻を基準）
      targetDates = [getCurrentAccountingDate(businessHours.openTime)]
    }
    
    let whereConditions = [eq(dailySales.storeId, storeId)]
    
    if (targetDates.length === 1) {
      whereConditions.push(eq(dailySales.accountingDate, targetDates[0]))
    } else {
      // Multiple dates: use OR conditions
      const dateConditions = targetDates.map(date => eq(dailySales.accountingDate, date))
      whereConditions.push(sql`(${sql.join(dateConditions, sql` OR `)})`)
    }
    
    const salesData = await db
      .select()
      .from(dailySales)
      .where(and(...whereConditions))
      .orderBy(desc(dailySales.accountingDate))
    
    return c.json({
      success: true,
      data: salesData
    })
    
  } catch (error) {
    logError('Error fetching daily sales', error)
    return c.json({ success: false, error: '日次売上の取得に失敗しました' }, 500)
  }
})

// 日次売上の集計・更新
accountingRoutes.post('/daily-sales/calculate', zValidator('json', z.object({
  date: z.string().optional()
})), async (c) => {
  try {
    const storeId = c.get('auth').storeId
    const { date } = c.req.valid('json')

    // 店舗の営業時間設定を取得
    const businessHours = await getStoreBusinessHours(storeId)
    
    // 会計設定から税率を取得
    const settings = await db
      .select()
      .from(accountingSettings)
      .where(eq(accountingSettings.storeId, storeId))
      .limit(1)
    
    const taxRate = parseFloat(settings[0]?.taxRate || '0.10')
    
    const targetDate = date || getCurrentAccountingDate(businessHours.openTime)
    const { start, end } = getBusinessHoursAccountingPeriod(targetDate, businessHours)

    // アーカイブ済み注文から集計
    const archivedSales = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalItems: sql<number>`sum(${archivedOrders.totalItems})::int`,
        totalAmount: sql<number>`sum(${archivedOrders.totalAmount})::numeric`
      })
      .from(archivedOrders)
      .where(
        and(
          eq(archivedOrders.storeId, storeId),
          gte(archivedOrders.archivedAt, start),
          lt(archivedOrders.archivedAt, end)
        )
      )
    
    // アクティブな注文からも集計（delivered状態）
    const activeSales = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalItems: sql<number>`sum(${orders.totalItems})::int`,
        totalAmount: sql<number>`sum(${orders.totalAmount})::numeric`
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.status, 'delivered'),
          gte(orders.updatedAt, start),
          lt(orders.updatedAt, end)
        )
      )
    
    // 合計を計算
    const totalOrders = (archivedSales[0]?.totalOrders || 0) + (activeSales[0]?.totalOrders || 0)
    const totalItems = (archivedSales[0]?.totalItems || 0) + (activeSales[0]?.totalItems || 0)
    const subtotalAmount = parseFloat((archivedSales[0]?.totalAmount || 0).toString()) + parseFloat((activeSales[0]?.totalAmount || 0).toString())

    // 税抜き金額をそのまま使用
    const taxAmount = 0
    const totalAmount = subtotalAmount
    
    // 既存の集計データを確認
    const existingSales = await db
      .select()
      .from(dailySales)
      .where(
        and(
          eq(dailySales.storeId, storeId),
          eq(dailySales.accountingDate, targetDate)
        )
      )
      .limit(1)
    
    const salesData = {
      storeId,
      accountingDate: targetDate,
      totalOrders,
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      periodStart: start,
      periodEnd: end,
      isFinalized: false
    }
    
    let result
    
    if (existingSales.length > 0) {
      // 更新
      result = await db
        .update(dailySales)
        .set({
          ...salesData,
          updatedAt: sql`now()`
        })
        .where(
          and(
            eq(dailySales.storeId, storeId),
            eq(dailySales.accountingDate, targetDate)
          )
        )
        .returning()
    } else {
      // 新規作成
      result = await db
        .insert(dailySales)
        .values(salesData)
        .returning()
    }
    
    logInfo(`Daily sales calculated for store ${storeId}, date ${targetDate}`)
    
    return c.json({
      success: true,
      data: result[0]
    })
    
  } catch (error) {
    logError('Error calculating daily sales', error)
    return c.json({ success: false, error: '日次売上の集計に失敗しました' }, 500)
  }
})

// 日次売上の確定
accountingRoutes.post('/daily-sales/finalize', zValidator('json', z.object({
  date: z.string()
})), async (c) => {
  try {
    const storeId = c.get('auth').storeId
    const { date } = c.req.valid('json')
    
    const result = await db
      .update(dailySales)
      .set({
        isFinalized: true,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(dailySales.storeId, storeId),
          eq(dailySales.accountingDate, date)
        )
      )
      .returning()
    
    if (result.length === 0) {
      return c.json({ success: false, error: '指定された日付の売上データが見つかりません' }, 404)
    }
    
    logInfo(`Daily sales finalized for store ${storeId}, date ${date}`)
    
    return c.json({
      success: true,
      data: result[0]
    })
    
  } catch (error) {
    logError('Error finalizing daily sales', error)
    return c.json({ success: false, error: '日次売上の確定に失敗しました' }, 500)
  }
})

// 期間別売上サマリー
accountingRoutes.get('/sales-summary', zValidator('query', z.object({
  startDate: z.string(),
  endDate: z.string(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
})), async (c) => {
  try {
    const storeId = c.get('auth').storeId
    const { startDate, endDate, groupBy } = c.req.valid('query')
    
    let groupByClause: any
    
    switch (groupBy) {
      case 'week':
        groupByClause = sql`date_trunc('week', ${dailySales.accountingDate}::date)`
        break
      case 'month':
        groupByClause = sql`date_trunc('month', ${dailySales.accountingDate}::date)`
        break
      default:
        groupByClause = sql`${dailySales.accountingDate}`
    }
    
    const summary = await db
      .select({
        period: groupByClause,
        totalOrders: sql<number>`sum(${dailySales.totalOrders})::int`,
        totalItems: sql<number>`sum(${dailySales.totalItems})::int`,
        totalAmount: sql<number>`sum(${dailySales.totalAmount})::numeric`,
        taxAmount: sql<number>`sum(${dailySales.taxAmount})::numeric`,
        avgOrderAmount: sql<number>`avg(${dailySales.totalAmount})::numeric`
      })
      .from(dailySales)
      .where(
        and(
          eq(dailySales.storeId, storeId),
          gte(dailySales.accountingDate, startDate),
          lt(dailySales.accountingDate, endDate)
        )
      )
      .groupBy(groupByClause)
      .orderBy(groupByClause)
    
    return c.json({
      success: true,
      data: summary
    })
    
  } catch (error) {
    logError('Error fetching sales summary', error)
    return c.json({ success: false, error: '売上サマリーの取得に失敗しました' }, 500)
  }
})

// 完了した会計データの取得（売上データ）
accountingRoutes.get('/sales-cycles', zValidator('query', z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付の形式が正しくありません (YYYY-MM-DD)')
})), async (c) => {
  try {
    const { date } = c.req.valid('query')
    const storeId = c.get('auth').storeId
    
    // 店舗の営業時間設定を取得
    const businessHours = await getStoreBusinessHours(storeId)
    
    // 営業時間に基づく会計期間を取得
    const { start, end } = getBusinessHoursAccountingPeriod(date, businessHours)
    
    // 該当期間の完了した売上サイクルを取得
    const salesCyclesList = await db.query.salesCycles.findMany({
      where: and(
        eq(salesCycles.storeId, storeId),
        eq(salesCycles.status, 'completed'), // 完了した会計のみ
        gte(salesCycles.completedAt, start),
        lt(salesCycles.completedAt, end)
      ),
      with: {
        table: {
          columns: {
            number: true
          }
        }
      },
      orderBy: [desc(salesCycles.completedAt)]
    })

    // 各売上サイクルのアーカイブされた注文詳細を取得
    const salesWithDetails = await Promise.all(
      salesCyclesList.map(async (salesCycle) => {
        const archivedOrdersList = await db
          .select({
            id: archivedOrders.id,
            originalOrderId: archivedOrders.originalOrderId,
            totalItems: archivedOrders.totalItems,
            totalAmount: archivedOrders.totalAmount,
            originalCreatedAt: archivedOrders.originalCreatedAt
          })
          .from(archivedOrders)
          .where(eq(archivedOrders.salesCycleId, salesCycle.id))

        return {
          id: salesCycle.id,
          tableId: salesCycle.tableId,
          tableNumber: salesCycle.table.number,
          cycleNumber: salesCycle.cycleNumber,
          totalAmount: salesCycle.totalAmount,
          totalItems: salesCycle.totalItems,
          status: 'completed', // 完了済み
          createdAt: salesCycle.startedAt,
          completedAt: salesCycle.completedAt,
          ordersCount: archivedOrdersList.length,
          archivedOrders: archivedOrdersList
        }
      })
    )
    
    return c.json({
      success: true,
      data: salesWithDetails
    })
    
  } catch (error) {
    logError('Error fetching sales cycles', error)
    return c.json({ success: false, error: '売上データの取得に失敗しました' }, 500)
  }
})

// 注文詳細の取得（未完了注文用 - 調理管理等で使用）
accountingRoutes.get('/orders', zValidator('query', z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付の形式が正しくありません (YYYY-MM-DD)')
})), async (c) => {
  try {
    const { date } = c.req.valid('query')
    const storeId = c.get('auth').storeId
    
    // 店舗の営業時間設定を取得
    const businessHours = await getStoreBusinessHours(storeId)
    
    // 営業時間に基づく会計期間を取得
    const { start, end } = getBusinessHoursAccountingPeriod(date, businessHours)
    
    // 該当期間の注文を取得
    const ordersList = await db
      .select({
        id: orders.id,
        tableId: orders.tableId,
        status: orders.status,
        totalItems: orders.totalItems,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          gte(orders.createdAt, start),
          lt(orders.createdAt, end)
        )
      )
      .orderBy(desc(orders.createdAt))

    // 各注文のアイテム詳細を取得
    const ordersWithDetails = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            name: orderItems.name,
            quantity: orderItems.quantity,
            price: orderItems.unitPrice,
            subtotal: orderItems.totalPrice
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id))

        return {
          ...order,
          items: items || []
        }
      })
    )
    
    return c.json({
      success: true,
      data: ordersWithDetails
    })
    
  } catch (error) {
    logError('Error fetching order details', error)
    return c.json({ success: false, error: '注文詳細の取得に失敗しました' }, 500)
  }
})