import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './store'
import { tables } from './table'

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: varchar('device_id', { length: 255 }).notNull().unique(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  tableId: integer('table_id').references(() => tables.id).notNull(),
  name: varchar('name', { length: 255 }), // 管理用の名前（例：「カウンター席1」）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const devicesRelations = relations(devices, ({ one }) => ({
  store: one(stores, {
    fields: [devices.storeId],
    references: [stores.id],
  }),
  table: one(tables, {
    fields: [devices.tableId],
    references: [tables.id],
  }),
}))

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert