import { pgTable, serial, varchar, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// テーブル状態の列挙型
export const tableStatusEnum = pgEnum('table_status', [
  'available',
  'occupied',
  'reserved',
  'maintenance',
])

// テーブルエリアの列挙型
export const tableAreaEnum = pgEnum('table_area', [
  'area1',
  'area2',
  'area3',
  'area4',
])

// テーブルテーブル
export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  number: integer('number').notNull().unique(),
  capacity: integer('capacity').notNull(),
  area: tableAreaEnum('area').notNull(),
  status: tableStatusEnum('status').default('available').notNull(),
  qrCode: varchar('qr_code', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// リレーションの定義
export const tablesRelations = relations(tables, ({ many }) => ({
  // 注文テーブルとのリレーションは order.ts で定義
}))
