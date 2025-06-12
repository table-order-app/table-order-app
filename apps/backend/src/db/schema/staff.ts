import { pgTable, serial, varchar, text, timestamp, pgEnum, boolean, integer, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'

// スタッフロールの列挙型
export const staffRoleEnum = pgEnum('staff_role', [
  'admin',
  'manager',
  'staff',
  'kitchen',
])

// スタッフテーブル（個人情報）
export const staffMembers = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  loginId: varchar('login_id', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: staffRoleEnum('role').default('staff').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // 店舗内でログインIDがユニーク
  uniqueStoreLoginId: unique().on(table.storeId, table.loginId),
}))


// 店舗別設定テーブル
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // 同じ店舗で同じキーは1つのみ
  uniqueStoreKey: unique().on(table.storeId, table.key),
}))

// リレーションの定義
export const staffMembersRelations = relations(staffMembers, ({ one }) => ({
  store: one(stores, {
    fields: [staffMembers.storeId],
    references: [stores.id],
  }),
}))

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, {
    fields: [storeSettings.storeId],
    references: [stores.id],
  }),
}))
