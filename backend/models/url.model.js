import { pgTable, uuid, varchar, text, timestamp, index, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";

export const urlsTable = pgTable("urls", {
  id: uuid("id").defaultRandom().primaryKey(),

  shortCode: varchar("code", { length: 155 }).notNull().unique(),
  targetURL: text("target_url").notNull(),

  // Optional human-friendly label shown in the dashboard
  title: varchar("title", { length: 120 }),

  userId: uuid("user_id")
    .references(() => usersTable.id),

  deviceId: varchar("device_id", { length: 255 }),

  // Link controls
  isActive: boolean("is_active").default(true).notNull(),
  maxClicks: integer("max_clicks"),
  clickCount: integer("click_count").default(0).notNull(),
  lastClickedAt: timestamp("last_clicked_at"),

  expiresAt: timestamp("expires_at"),
  password: varchar("password", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => {
  return {
    userIdIndex: index("user_id_idx").on(table.userId),
    deviceIdIndex: index("device_id_idx").on(table.deviceId),
  }
});
