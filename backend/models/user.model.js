import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),

  firstname: varchar("first_name", { length: 55 }).notNull(),
  lastname: varchar("last_name", { length: 55 }).notNull(),

  email: varchar("email", { length: 155 }).notNull().unique(),

  password: text().notNull(),
  salt: text().notNull(),

  isVerified: boolean("is_verified").default(false).notNull(),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: timestamp("otp_expiry"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
