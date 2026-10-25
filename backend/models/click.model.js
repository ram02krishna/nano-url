import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { urlsTable } from "./url.model.js";

export const clicksTable = pgTable("url_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),

  urlId: uuid("url_id")
    .notNull()
    .references(() => urlsTable.id, { onDelete: "cascade" }),

  ipAddress: varchar("ip_address", { length: 45 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),

  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  device: varchar("device", { length: 50 }),

  // Hostname of the page that referred the visitor ("Direct" when unknown)
  referrer: varchar("referrer", { length: 255 }),

  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
}, (table) => ({
  urlIdIndex: index("clicks_url_id_idx").on(table.urlId),
  clickedAtIndex: index("clicks_clicked_at_idx").on(table.clickedAt),
}));
