import { relations } from 'drizzle-orm/relations'
import {
  categorys,
  products,
  users,
  keranjang,
  paymentsHistory,
  favorites,
  reports,
  toDoLists,
} from './schema'

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categorys, {
    fields: [products.categoryId],
    references: [categorys.id],
  }),
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  keranjangs: many(keranjang),
  paymentsHistories: many(paymentsHistory),
  favorites: many(favorites),
}))

export const categorysRelations = relations(categorys, ({ many }) => ({
  products: many(products),
}))

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  keranjangs: many(keranjang),
  paymentsHistories: many(paymentsHistory),
  favorites: many(favorites),
  reports: many(reports),
  toDoLists: many(toDoLists),
}))

export const keranjangRelations = relations(keranjang, ({ one }) => ({
  product: one(products, {
    fields: [keranjang.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [keranjang.userId],
    references: [users.id],
  }),
}))

export const paymentsHistoryRelations = relations(
  paymentsHistory,
  ({ one }) => ({
    product: one(products, {
      fields: [paymentsHistory.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [paymentsHistory.userId],
      references: [users.id],
    }),
  })
)

export const favoritesRelations = relations(favorites, ({ one }) => ({
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}))

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}))

export const toDoListsRelations = relations(toDoLists, ({ one }) => ({
  user: one(users, {
    fields: [toDoLists.userId],
    references: [users.id],
  }),
}))
