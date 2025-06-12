import { pgTable, serial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 店舗テーブル
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  storeCode: varchar('store_code', { length: 8 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 100 }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// リレーションの定義
export const storesRelations = relations(stores, ({ many }) => ({
  tables: many(require('./table').tables),
  menuItems: many(require('./menu').menuItems),
  orders: many(require('./order').orders),
  categories: many(require('./menu').categories),
}))