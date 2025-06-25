import { pgTable, serial, varchar, integer, text, timestamp, pgEnum, unique, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'


// テーブルテーブル
export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  number: integer('number').notNull(),
  capacity: integer('capacity').notNull(),
  area: varchar('area', { length: 100 }).notNull().default('一般エリア'),
  checkoutRequested: boolean('checkout_requested').default(false).notNull(),
  checkoutRequestedAt: timestamp('checkout_requested_at'),
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
