import {
  pgTable,
  serial,
  varchar,
  boolean,
  foreignKey,
  integer,
  timestamp,
  text,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const ukuranEnum = pgEnum('ukuran_enum', [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
])
export const userRole = pgEnum('user_role', ['owner', 'admin', 'costumer'])

export const categorys = pgTable('categorys', {
  id: serial().primaryKey().notNull(),
  tipePakaian: varchar('tipe_pakaian'),
  slugs: varchar(),
  aktif: boolean(),
})

export const products = pgTable(
  'products',
  {
    id: serial().primaryKey().notNull(),
    categoryId: integer('category_id').notNull(),
    userId: integer('user_id'),
    nama: varchar(),
    stock: integer().default(0),
    ukuran: ukuranEnum(),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp('updated_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categorys.id],
      name: 'fk_product_categorys',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_product_user',
    }),
  ]
)

export const keranjang = pgTable(
  'keranjang',
  {
    id: serial().primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    productId: integer('product_id').notNull(),
    jumlah: integer().default(1),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp('updated_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_keranjang_product',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_keranjang_user',
    }),
  ]
)

export const users = pgTable('users', {
  id: serial().primaryKey().notNull(),
  name: varchar(),
  lokasi: text().notNull(),
  email: varchar(),
  role: userRole().default('costumer'),
  password: varchar(),
  createdAt: timestamp('created_at', { mode: 'string' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: timestamp('updated_at', { mode: 'string' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})

export const paymentsHistory = pgTable(
  'payments_history',
  {
    id: serial().primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    productId: integer('product_id').notNull(),
    noResi: integer('no_resi'),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_payments_history  _product',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_payments_history_user',
    }),
  ]
)

export const favorites = pgTable(
  'favorites',
  {
    id: serial().primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    productId: integer('product_id').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_favorites_product',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_favorites_user',
    }),
  ]
)

export const reports = pgTable(
  'reports',
  {
    id: serial().primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    reportDate: date('report_date'),
    note: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_reports_user',
    }),
  ]
)

export const toDoLists = pgTable(
  'to_do_lists',
  {
    id: integer()
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: 'to_do_lists_id_seq',
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
      }),
    userId: integer('user_id'),
    title: varchar(),
    description: varchar(),
    status: boolean(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_user_to_do_list',
    }),
  ]
)
