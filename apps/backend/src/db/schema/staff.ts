import { pgTable, serial, varchar, text, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// スタッフロールの列挙型
export const staffRoleEnum = pgEnum('staff_role', [
  'admin',
  'manager',
  'staff',
  'kitchen',
])

// スタッフテーブル
export const staffMembers = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: staffRoleEnum('role').default('staff').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// リレーションの定義
export const staffMembersRelations = relations(staffMembers, ({ many }) => ({
  // 将来的に必要なリレーションがあれば追加
}))
