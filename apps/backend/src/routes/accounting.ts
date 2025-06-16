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
  stores 
} from '../db/schema'
import { eq, and, gte, lt, sql, desc } from 'drizzle-orm'
import { flexibleAuthMiddleware } from '../middleware/auth'
import { 
  getAccountingDate, 
  getAccountingPeriod, 
  getCurrentAccountingDate,
  generateAccountingDateRange,
  calculateTax,
  centToJpy
} from '../utils/accounting'
import { logError, logInfo } from '../utils/logger'

export const accountingRoutes = new Hono()

// 認証ミドルウェアを適用
accountingRoutes.use('*', flexibleAuthMiddleware)

// 会計設定の取得
accountingRoutes.get('/settings', async (c) => {
  try {
    const storeId = c.get('storeId')
    
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
          autoCloseEnabled: false,
          autoCloseTime: '04:00:00',
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
  dayClosingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, '時間形式が正しくありません'),
  taxRate: z.number().min(0).max(1, '税率は0-1の範囲で入力してください'),
  autoCloseEnabled: z.boolean(),
  autoCloseTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, '時間形式が正しくありません'),
  displayCurrency: z.string().default('JPY')
})), async (c) => {
  try {
    const storeId = c.get('storeId')
    const updateData = c.req.valid('json')
    
    const updatedSettings = await db
      .update(accountingSettings)
      .set({
        ...updateData,
        taxRate: updateData.taxRate.toString(),
        updatedAt: sql`now()`
      })
      .where(eq(accountingSettings.storeId, storeId))
      .returning()
    
    if (updatedSettings.length === 0) {
      // 設定が存在しない場合は作成
      const newSettings = await db
        .insert(accountingSettings)
        .values({
          storeId,
          ...updateData,
          taxRate: updateData.taxRate.toString()
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
    const storeId = c.get('storeId')
    const { date, startDate, endDate } = c.req.valid('query')
    
    // 会計設定を取得
    const settings = await db
      .select()
      .from(accountingSettings)
      .where(eq(accountingSettings.storeId, storeId))
      .limit(1)
    
    const dayClosingTime = settings[0]?.dayClosingTime || '05:00:00'
    
    let targetDates: string[]
    
    if (date) {
      targetDates = [date]
    } else if (startDate && endDate) {
      targetDates = generateAccountingDateRange(startDate, endDate)
    } else {
      // デフォルトは今日
      targetDates = [getCurrentAccountingDate(dayClosingTime)]
    }
    
    const salesData = await db
      .select()
      .from(dailySales)
      .where(
        and(
          eq(dailySales.storeId, storeId),
          sql`${dailySales.accountingDate} = ANY(${targetDates})`
        )
      )
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
    const storeId = c.get('storeId')
    const { date } = c.req.valid('json')
    
    // 会計設定を取得
    const settings = await db
      .select()
      .from(accountingSettings)
      .where(eq(accountingSettings.storeId, storeId))
      .limit(1)
    
    const dayClosingTime = settings[0]?.dayClosingTime || '05:00:00'
    const taxRate = parseFloat(settings[0]?.taxRate || '0.10')
    
    const targetDate = date || getCurrentAccountingDate(dayClosingTime)
    const { start, end } = getAccountingPeriod(targetDate, dayClosingTime)
    
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
          gte(archivedOrders.completedAt, start),
          lt(archivedOrders.completedAt, end)
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
    const subtotalAmount = parseFloat(archivedSales[0]?.totalAmount || '0') + parseFloat(activeSales[0]?.totalAmount || '0')
    
    const { taxAmount, totalAmount } = calculateTax(subtotalAmount, taxRate)
    
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
    const storeId = c.get('storeId')
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
    const storeId = c.get('storeId')
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