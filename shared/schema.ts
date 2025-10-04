import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  display_name: text("display_name"),
  balance: decimal("balance", { precision: 10, scale: 4 }).default("0"),
  firebase_uid: text("firebase_uid").unique(),
});

export const services = pgTable("services", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  min: integer("min").notNull(),
  max: integer("max").notNull(),
  description: text("description"),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id),
  service: integer("service").notNull(),
  link: text("link").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull(),
  charge: decimal("charge", { precision: 10, scale: 4 }).notNull(),
  start_count: integer("start_count"),
  remains: integer("remains"),
  created_at: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  method: text("method").notNull(), // 'bkash', 'nagad', etc.
  transaction_id: text("transaction_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  display_name: true,
  firebase_uid: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  user_id: true,
  service: true,
  link: true,
  quantity: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  user_id: true,
  amount: true,
  method: true,
  transaction_id: true,
});

export const orderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  method: z.enum(["bkash", "nagad", "rocket"]),
  transaction_id: z.string().min(1, "Transaction ID is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type OrderStatusRequest = z.infer<typeof orderStatusSchema>;
export type PaymentRequest = z.infer<typeof paymentSchema>;
