import { pgTable, serial, integer, numeric, time, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'

// 会計設定テーブル
export const accountingSettings = pgTable('accounting_settings', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull().unique(),
  
  // 日の切り替え時間設定 (例: "05:00:00" なら朝5時まで前日扱い)
  dayClosingTime: time('day_closing_time').default('05:00:00').notNull(),
  
  // 税率設定 (例: 0.10 = 10%)
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).default('0.10').notNull(),
  
  // 会計締め処理の自動実行設定
  autoCloseEnabled: boolean('auto_close_enabled').default(false).notNull(),
  autoCloseTime: time('auto_close_time').default('04:00:00').notNull(),
  
  // 会計集計の表示設定
  displayCurrency: text('display_currency').default('JPY').notNull(),
  
  // 作成・更新日時
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 日次売上集計テーブル
export const dailySales = pgTable('daily_sales', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  
  // 会計日 (日の切り替え時間を考慮した日付)
  accountingDate: text('accounting_date').notNull(), // YYYY-MM-DD形式
  
  // 集計データ
  totalOrders: integer('total_orders').default(0).notNull(),
  totalItems: integer('total_items').default(0).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // 集計期間 (実際の時間範囲)
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // 集計ステータス
  isFinalized: boolean('is_finalized').default(false).notNull(),
  
  // 作成・更新日時
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// リレーションの定義
export const accountingSettingsRelations = relations(accountingSettings, ({ one }) => ({
  store: one(stores, {
    fields: [accountingSettings.storeId],
    references: [stores.id],
  }),
}))

export const dailySalesRelations = relations(dailySales, ({ one }) => ({
  store: one(stores, {
    fields: [dailySales.storeId],
    references: [stores.id],
  }),
}))