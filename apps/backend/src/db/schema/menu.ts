import { pgTable, serial, varchar, integer, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'

// カテゴリテーブル
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// メニューアイテムテーブル
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  image: text('image'),
  available: boolean('available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// オプションテーブル（店舗別）
export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: integer('price').notNull(),
  category: varchar('category', { length: 50 }), // 'size', 'spice', 'extra'等
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// トッピングテーブル（店舗別）
export const toppings = pgTable('toppings', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: integer('price').notNull(),
  category: varchar('category', { length: 50 }), // 'vegetable', 'meat', 'cheese'等
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// アレルゲンテーブル（店舗別）
export const allergens = pgTable('allergens', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// メニューアイテムとオプションの中間テーブル
export const menuItemOptions = pgTable('menu_item_options', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  optionId: integer('option_id').references(() => options.id).notNull(),
})

// メニューアイテムとトッピングの中間テーブル
export const menuItemToppings = pgTable('menu_item_toppings', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  toppingId: integer('topping_id').references(() => toppings.id).notNull(),
})

// メニューアイテムとアレルゲンの中間テーブル
export const menuItemAllergens = pgTable('menu_item_allergens', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  allergenId: integer('allergen_id').references(() => allergens.id).notNull(),
})

// リレーションの定義
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),
  menuItems: many(menuItems),
}))

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  store: one(stores, {
    fields: [menuItems.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  options: many(menuItemOptions),
  toppings: many(menuItemToppings),
  allergens: many(menuItemAllergens),
}))

export const optionsRelations = relations(options, ({ one, many }) => ({
  store: one(stores, {
    fields: [options.storeId],
    references: [stores.id],
  }),
  menuItems: many(menuItemOptions),
}))

export const toppingsRelations = relations(toppings, ({ one, many }) => ({
  store: one(stores, {
    fields: [toppings.storeId],
    references: [stores.id],
  }),
  menuItems: many(menuItemToppings),
}))

export const allergensRelations = relations(allergens, ({ one, many }) => ({
  store: one(stores, {
    fields: [allergens.storeId],
    references: [stores.id],
  }),
  menuItems: many(menuItemAllergens),
}))
