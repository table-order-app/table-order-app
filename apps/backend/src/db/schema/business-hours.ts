import { pgTable, serial, integer, time, boolean, timestamp } from 'drizzle-orm/pg-core'
import { stores } from './store'

// 営業時間テーブル
export const storeBusinessHours = pgTable('store_business_hours', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  openTime: time('open_time').notNull(),
  closeTime: time('close_time').notNull(),
  isNextDay: boolean('is_next_day').default(false).notNull(),
  dayOfWeek: integer('day_of_week').default(null), // null = 全日共通, 0=日曜日, 1=月曜日...
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type StoreBusinessHours = typeof storeBusinessHours.$inferSelect
export type InsertStoreBusinessHours = typeof storeBusinessHours.$inferInsert