import { pgTable, serial, varchar, integer, text, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'

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
  storeId: integer('store_id').references(() => stores.id).notNull(),
  number: integer('number').notNull(),
  capacity: integer('capacity').notNull(),
  area: tableAreaEnum('area').notNull(),
  status: tableStatusEnum('status').default('available').notNull(),
  qrCode: varchar('qr_code', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // 店舗内でのテーブル番号ユニーク制約
  storeTableNumber: unique().on(table.storeId, table.number),
}))

// リレーションの定義
export const tablesRelations = relations(tables, ({ one, many }) => ({
  store: one(stores, {
    fields: [tables.storeId],
    references: [stores.id],
  }),
  // 注文テーブルとのリレーションは order.ts で定義
}))
