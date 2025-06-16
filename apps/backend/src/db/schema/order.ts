import { pgTable, serial, varchar, integer, text, timestamp, pgEnum, numeric } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tables } from './table'
import { menuItems } from './menu'
import { stores } from './store'

// 注文ステータスの列挙型
export const orderStatusEnum = pgEnum('order_status', [
  'new',
  'in-progress',
  'ready',
  'delivered',
  'cancelled',
])

// 注文アイテムステータスの列挙型
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'new',
  'in-progress',
  'ready',
  'delivered',
  'cancelled',
])

// 注文テーブル
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  tableId: integer('table_id').references(() => tables.id).notNull(),
  status: orderStatusEnum('status').default('new').notNull(),
  totalItems: integer('total_items').notNull(),
  
  // 価格情報を追加
  subtotalAmount: numeric('subtotal_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 注文アイテムテーブル
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  status: orderItemStatusEnum('status').default('new').notNull(),
  
  // 価格情報を追加
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 注文アイテムオプションテーブル
export const orderItemOptions = pgTable('order_item_options', {
  id: serial('id').primaryKey(),
  orderItemId: integer('order_item_id').references(() => orderItems.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
})

// 注文アイテムトッピングテーブル
export const orderItemToppings = pgTable('order_item_toppings', {
  id: serial('id').primaryKey(),
  orderItemId: integer('order_item_id').references(() => orderItems.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
})

// リレーションの定義
export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  options: many(orderItemOptions),
  toppings: many(orderItemToppings),
}))

export const orderItemOptionsRelations = relations(orderItemOptions, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemOptions.orderItemId],
    references: [orderItems.id],
  }),
}))

export const orderItemToppingsRelations = relations(orderItemToppings, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemToppings.orderItemId],
    references: [orderItems.id],
  }),
}))
