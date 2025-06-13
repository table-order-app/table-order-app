import { pgTable, serial, varchar, integer, text, timestamp, pgEnum, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'
import { tables } from './table'

// 売上サイクルステータスの列挙型
export const salesCycleStatusEnum = pgEnum('sales_cycle_status', [
  'active',     // 進行中
  'completed',  // 会計完了
  'cancelled',  // キャンセル
])

// 売上サイクルテーブル（1つのお客様グループの注文サイクル）
export const salesCycles = pgTable('sales_cycles', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  tableId: integer('table_id').references(() => tables.id).notNull(),
  cycleNumber: integer('cycle_number').notNull(), // そのテーブルでの通し番号
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  totalItems: integer('total_items').notNull().default(0),
  status: salesCycleStatusEnum('status').default('active').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// アーカイブされた注文テーブル
export const archivedOrders = pgTable('archived_orders', {
  id: serial('id').primaryKey(),
  salesCycleId: integer('sales_cycle_id').references(() => salesCycles.id).notNull(),
  originalOrderId: integer('original_order_id').notNull(), // 元の注文ID
  storeId: integer('store_id').references(() => stores.id).notNull(),
  tableId: integer('table_id').references(() => tables.id).notNull(),
  tableNumber: integer('table_number').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  totalItems: integer('total_items').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  originalCreatedAt: timestamp('original_created_at').notNull(),
  archivedAt: timestamp('archived_at').defaultNow().notNull(),
})

// アーカイブされた注文アイテムテーブル
export const archivedOrderItems = pgTable('archived_order_items', {
  id: serial('id').primaryKey(),
  archivedOrderId: integer('archived_order_id').references(() => archivedOrders.id).notNull(),
  originalItemId: integer('original_item_id').notNull(),
  menuItemId: integer('menu_item_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).notNull(),
  originalCreatedAt: timestamp('original_created_at').notNull(),
  archivedAt: timestamp('archived_at').defaultNow().notNull(),
})

// アーカイブされた注文アイテムオプション
export const archivedOrderItemOptions = pgTable('archived_order_item_options', {
  id: serial('id').primaryKey(),
  archivedOrderItemId: integer('archived_order_item_id').references(() => archivedOrderItems.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
})

// アーカイブされた注文アイテムトッピング
export const archivedOrderItemToppings = pgTable('archived_order_item_toppings', {
  id: serial('id').primaryKey(),
  archivedOrderItemId: integer('archived_order_item_id').references(() => archivedOrderItems.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
})

// リレーションの定義
export const salesCyclesRelations = relations(salesCycles, ({ one, many }) => ({
  store: one(stores, {
    fields: [salesCycles.storeId],
    references: [stores.id],
  }),
  table: one(tables, {
    fields: [salesCycles.tableId],
    references: [tables.id],
  }),
  archivedOrders: many(archivedOrders),
}))

export const archivedOrdersRelations = relations(archivedOrders, ({ one, many }) => ({
  salesCycle: one(salesCycles, {
    fields: [archivedOrders.salesCycleId],
    references: [salesCycles.id],
  }),
  store: one(stores, {
    fields: [archivedOrders.storeId],
    references: [stores.id],
  }),
  table: one(tables, {
    fields: [archivedOrders.tableId],
    references: [tables.id],
  }),
  items: many(archivedOrderItems),
}))

export const archivedOrderItemsRelations = relations(archivedOrderItems, ({ one, many }) => ({
  archivedOrder: one(archivedOrders, {
    fields: [archivedOrderItems.archivedOrderId],
    references: [archivedOrders.id],
  }),
  options: many(archivedOrderItemOptions),
  toppings: many(archivedOrderItemToppings),
}))

export const archivedOrderItemOptionsRelations = relations(archivedOrderItemOptions, ({ one }) => ({
  archivedOrderItem: one(archivedOrderItems, {
    fields: [archivedOrderItemOptions.archivedOrderItemId],
    references: [archivedOrderItems.id],
  }),
}))

export const archivedOrderItemToppingsRelations = relations(archivedOrderItemToppings, ({ one }) => ({
  archivedOrderItem: one(archivedOrderItems, {
    fields: [archivedOrderItemToppings.archivedOrderItemId],
    references: [archivedOrderItems.id],
  }),
}))