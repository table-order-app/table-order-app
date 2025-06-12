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
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// スタッフ-店舗割り当てテーブル（多対多関係）
export const staffStoreAssignments = pgTable('staff_store_assignments', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staffMembers.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  role: staffRoleEnum('role').default('staff').notNull(),
  active: boolean('active').default(true).notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // 1人のスタッフが同じ店舗に複数の有効な割り当てを持たないよう制約
  uniqueActiveAssignment: unique().on(table.staffId, table.storeId),
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
export const staffMembersRelations = relations(staffMembers, ({ many }) => ({
  storeAssignments: many(staffStoreAssignments),
}))

export const staffStoreAssignmentsRelations = relations(staffStoreAssignments, ({ one }) => ({
  staff: one(staffMembers, {
    fields: [staffStoreAssignments.staffId],
    references: [staffMembers.id],
  }),
  store: one(stores, {
    fields: [staffStoreAssignments.storeId],
    references: [stores.id],
  }),
}))

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, {
    fields: [storeSettings.storeId],
    references: [stores.id],
  }),
}))
