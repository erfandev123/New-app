// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/persistent-storage.ts
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
var DATA_DIR = path.join(process.cwd(), "data");
var USERS_FILE = path.join(DATA_DIR, "users.json");
var SERVICES_FILE = path.join(DATA_DIR, "services.json");
var ORDERS_FILE = path.join(DATA_DIR, "orders.json");
var PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
var CUSTOM_RATES_FILE = path.join(DATA_DIR, "custom-rates.json");
var OVERRIDES_FILE = path.join(DATA_DIR, "service-overrides.json");
var PersistentStorage = class {
  users = /* @__PURE__ */ new Map();
  services = [];
  orders = /* @__PURE__ */ new Map();
  payments = /* @__PURE__ */ new Map();
  customRatesByServiceId = /* @__PURE__ */ new Map();
  overridesByServiceId = /* @__PURE__ */ new Map();
  initialized = false;
  constructor() {
    this.initializeStorage();
  }
  async initializeStorage() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await this.loadUsers();
      await this.loadServices();
      await this.loadOrders();
      await this.loadPayments();
      await this.loadCustomRates();
      await this.loadOverrides();
      this.initialized = true;
      console.log("Persistent storage initialized successfully");
    } catch (error) {
      console.error("Failed to initialize persistent storage:", error);
      this.initialized = true;
    }
  }
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }
  async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, "utf-8");
      const usersArray = JSON.parse(data);
      this.users = new Map(usersArray.map((user) => [user.id, user]));
      console.log(`Loaded ${usersArray.length} users from persistent storage`);
    } catch (error) {
      console.log("No existing users file, starting with empty users");
      this.users = /* @__PURE__ */ new Map();
    }
  }
  async saveUsers() {
    try {
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  }
  async loadServices() {
    try {
      const data = await fs.readFile(SERVICES_FILE, "utf-8");
      this.services = JSON.parse(data);
      console.log(`Loaded ${this.services.length} services from persistent storage`);
    } catch (error) {
      console.log("No existing services file, starting with empty services");
      this.services = [];
    }
  }
  async saveServices() {
    try {
      await fs.writeFile(SERVICES_FILE, JSON.stringify(this.services, null, 2));
    } catch (error) {
      console.error("Failed to save services:", error);
    }
  }
  async loadOrders() {
    try {
      const data = await fs.readFile(ORDERS_FILE, "utf-8");
      const ordersArray = JSON.parse(data);
      this.orders = new Map(ordersArray.map((order) => [order.id, order]));
      console.log(`Loaded ${ordersArray.length} orders from persistent storage`);
    } catch (error) {
      console.log("No existing orders file, starting with empty orders");
      this.orders = /* @__PURE__ */ new Map();
    }
  }
  async saveOrders() {
    try {
      const ordersArray = Array.from(this.orders.values());
      await fs.writeFile(ORDERS_FILE, JSON.stringify(ordersArray, null, 2));
    } catch (error) {
      console.error("Failed to save orders:", error);
    }
  }
  async loadPayments() {
    try {
      const data = await fs.readFile(PAYMENTS_FILE, "utf-8");
      const paymentsArray = JSON.parse(data);
      this.payments = new Map(paymentsArray.map((payment) => [payment.id, payment]));
      console.log(`Loaded ${paymentsArray.length} payments from persistent storage`);
    } catch (error) {
      console.log("No existing payments file, starting with empty payments");
      this.payments = /* @__PURE__ */ new Map();
    }
  }
  async savePayments() {
    try {
      const paymentsArray = Array.from(this.payments.values());
      await fs.writeFile(PAYMENTS_FILE, JSON.stringify(paymentsArray, null, 2));
    } catch (error) {
      console.error("Failed to save payments:", error);
    }
  }
  async loadCustomRates() {
    try {
      const data = await fs.readFile(CUSTOM_RATES_FILE, "utf-8");
      const ratesObj = JSON.parse(data);
      this.customRatesByServiceId = new Map(Object.entries(ratesObj).map(([k, v]) => [parseInt(k), v]));
      console.log(`Loaded ${this.customRatesByServiceId.size} custom rates from persistent storage`);
    } catch (error) {
      console.log("No existing custom rates file, starting with empty rates");
      this.customRatesByServiceId = /* @__PURE__ */ new Map();
    }
  }
  async saveCustomRates() {
    try {
      const ratesObj = Object.fromEntries(this.customRatesByServiceId);
      await fs.writeFile(CUSTOM_RATES_FILE, JSON.stringify(ratesObj, null, 2));
    } catch (error) {
      console.error("Failed to save custom rates:", error);
    }
  }
  async loadOverrides() {
    try {
      const data = await fs.readFile(OVERRIDES_FILE, "utf-8");
      const overridesObj = JSON.parse(data);
      this.overridesByServiceId = new Map(Object.entries(overridesObj).map(([k, v]) => [parseInt(k), v]));
      console.log(`Loaded ${this.overridesByServiceId.size} service overrides from persistent storage`);
    } catch (error) {
      console.log("No existing overrides file, starting with empty overrides");
      this.overridesByServiceId = /* @__PURE__ */ new Map();
    }
  }
  async saveOverrides() {
    try {
      const overridesObj = Object.fromEntries(this.overridesByServiceId);
      await fs.writeFile(OVERRIDES_FILE, JSON.stringify(overridesObj, null, 2));
    } catch (error) {
      console.error("Failed to save overrides:", error);
    }
  }
  async getUser(id) {
    await this.ensureInitialized();
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByFirebaseUid(firebaseUid) {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.firebase_uid === firebaseUid
    );
  }
  async getUserByEmail(email) {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    await this.ensureInitialized();
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      balance: "0",
      display_name: insertUser.display_name || null,
      firebase_uid: insertUser.firebase_uid || null
    };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }
  async updateUser(id, updates) {
    await this.ensureInitialized();
    const existing = this.users.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    await this.saveUsers();
    return updated;
  }
  async getServices() {
    await this.ensureInitialized();
    return this.services;
  }
  async setServices(services2) {
    await this.ensureInitialized();
    this.services = services2;
    await this.saveServices();
  }
  async updateService(id, updates) {
    await this.ensureInitialized();
    const base = this.services.find((s) => s.id === id);
    if (!base) return void 0;
    if (updates.rate !== void 0) {
      this.customRatesByServiceId.set(id, String(updates.rate));
      await this.saveCustomRates();
    }
    const existingOverrides = this.overridesByServiceId.get(id) || {};
    const nextOverrides = { ...existingOverrides };
    if (updates.min !== void 0) nextOverrides.min = updates.min;
    if (updates.max !== void 0) nextOverrides.max = updates.max;
    if (updates.description !== void 0) nextOverrides.description = updates.description;
    this.overridesByServiceId.set(id, nextOverrides);
    await this.saveOverrides();
    return this.getEffectiveServiceById(id);
  }
  async getServiceById(id) {
    await this.ensureInitialized();
    return this.services.find((s) => s.id === id);
  }
  applyOverrides(base) {
    const overrides = this.overridesByServiceId.get(base.id) || {};
    return { ...base, ...overrides };
  }
  async getEffectiveServices() {
    await this.ensureInitialized();
    return this.services.map((base) => {
      const withOverrides = this.applyOverrides(base);
      const custom = this.customRatesByServiceId.get(base.id);
      const saleRate = custom !== void 0 ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
      return { ...withOverrides, rate: this.toFixedString(saleRate) };
    });
  }
  async getEffectiveServiceById(id) {
    await this.ensureInitialized();
    const base = this.services.find((s) => s.id === id);
    if (!base) return void 0;
    const withOverrides = this.applyOverrides(base);
    const custom = this.customRatesByServiceId.get(id);
    const saleRate = custom !== void 0 ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
    return { ...withOverrides, rate: this.toFixedString(saleRate) };
  }
  async setCustomRate(id, rate) {
    await this.ensureInitialized();
    this.customRatesByServiceId.set(id, rate);
    await this.saveCustomRates();
  }
  toFixedString(value, digits = 4) {
    const num = parseFloat(String(value)) || 0;
    return num.toFixed(digits);
  }
  async getOrders(userId) {
    await this.ensureInitialized();
    const allOrders = Array.from(this.orders.values());
    if (userId) {
      return allOrders.filter((order) => order.user_id === userId);
    }
    return allOrders;
  }
  async addOrder(order) {
    await this.ensureInitialized();
    this.orders.set(order.id, order);
    await this.saveOrders();
    return order;
  }
  async getOrderById(id) {
    await this.ensureInitialized();
    return this.orders.get(id);
  }
  async updateOrder(id, updates) {
    await this.ensureInitialized();
    const existing = this.orders.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.orders.set(id, updated);
    await this.saveOrders();
    return updated;
  }
  async getPayments(userId) {
    await this.ensureInitialized();
    return Array.from(this.payments.values()).filter((payment) => payment.user_id === userId);
  }
  async addPayment(payment) {
    await this.ensureInitialized();
    this.payments.set(payment.id, payment);
    await this.savePayments();
    return payment;
  }
  async getPaymentById(id) {
    await this.ensureInitialized();
    return this.payments.get(id);
  }
  async updatePayment(id, updates) {
    await this.ensureInitialized();
    const existing = this.payments.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.payments.set(id, updated);
    await this.savePayments();
    return updated;
  }
  async getAllUsers() {
    await this.ensureInitialized();
    return Array.from(this.users.values());
  }
  async getAllOrders() {
    await this.ensureInitialized();
    return Array.from(this.orders.values());
  }
  async updateUserBalance(userId, newBalance) {
    await this.ensureInitialized();
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
      await this.saveUsers();
    }
  }
};

// server/storage.ts
var storage = new PersistentStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  display_name: text("display_name"),
  balance: decimal("balance", { precision: 10, scale: 4 }).default("0"),
  firebase_uid: text("firebase_uid").unique()
});
var services = pgTable("services", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  min: integer("min").notNull(),
  max: integer("max").notNull(),
  description: text("description")
});
var orders = pgTable("orders", {
  id: integer("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id),
  service: integer("service").notNull(),
  link: text("link").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull(),
  charge: decimal("charge", { precision: 10, scale: 4 }).notNull(),
  start_count: integer("start_count"),
  remains: integer("remains"),
  created_at: timestamp("created_at").defaultNow()
});
var payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  method: text("method").notNull(),
  // 'bkash', 'nagad', etc.
  transaction_id: text("transaction_id"),
  status: text("status").notNull().default("pending"),
  // pending, completed, failed
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  display_name: true,
  firebase_uid: true
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true
});
var insertOrderSchema = createInsertSchema(orders).pick({
  user_id: true,
  service: true,
  link: true,
  quantity: true
});
var insertPaymentSchema = createInsertSchema(payments).pick({
  user_id: true,
  amount: true,
  method: true,
  transaction_id: true
});
var orderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required")
});
var paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  method: z.enum(["bkash", "nagad", "rocket"]),
  transaction_id: z.string().min(1, "Transaction ID is required")
});

// server/routes.ts
import { z as z2 } from "zod";
import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
var API_URL = "https://bdclick24.com/api/v2";
function getApiKey() {
  const key = process.env.BDCLICK24_API_KEY;
  if (!key || key.trim() === "") {
    throw Object.assign(new Error("BDClick24 API key is not configured"), { status: 500 });
  }
  return key;
}
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split("Bearer ")[1];
    const headerUid = req.headers["x-firebase-uid"]?.toString();
    const uid = headerUid || token;
    const email = req.headers["x-user-email"] || "user@example.com";
    req.user = { uid, email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}
async function registerRoutes(app2) {
  app2.use("/admin", express.static("/home/darkerfan/Downloads/SocialSphere/admin"));
  app2.get("/admin/", (req, res) => {
    res.sendFile("/home/darkerfan/Downloads/SocialSphere/admin/index.html");
  });
  function isAdmin(req) {
    console.log("Admin check - always allowing access for development");
    return true;
  }
  app2.get("/api/services", async (req, res) => {
    try {
      const formData = new URLSearchParams();
      formData.append("key", getApiKey());
      formData.append("action", "services");
      const response = await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      console.log("Services API Response received:", response.data?.length || 0, "services");
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((svc) => {
          const usdRate = (Number(svc.rate) || 0) / 1e3;
          const bdtRate = usdRate * 110;
          const finalRate = bdtRate * 1.5;
          return {
            id: svc.id ?? svc.service,
            // BDClick24 often uses `service`
            name: svc.name,
            category: svc.category,
            // Rate in BDT with profit margin
            rate: String(finalRate.toFixed(4)),
            min: Number(svc.min),
            max: Number(svc.max),
            description: svc.description ?? void 0
          };
        });
        await storage.setServices(normalized);
        const effective = await storage.getEffectiveServices();
        res.json(effective);
      } else if (response.data && response.data.error) {
        console.error("API Error:", response.data.error);
        res.status(401).json({ error: `BDClick24 API Error: ${response.data.error}. Please check your API key.` });
      } else {
        console.error("Unexpected response structure:", response.data);
        res.status(500).json({ error: "Invalid response from BDClick24 API" });
      }
    } catch (error) {
      console.error("Error fetching services:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to connect to BDClick24 API" });
    }
  });
  app2.post("/api/admin/topup", async (req, res) => {
    console.log("=== TOPUP REQUEST START ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
      const { email, amount } = req.body;
      if (!email || !amount || amount <= 0) {
        console.log("Invalid input - email:", email, "amount:", amount);
        return res.status(400).json({ error: "Email and positive amount are required" });
      }
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          username: email,
          password: "",
          // not used
          email,
          display_name: email,
          firebase_uid: void 0
        });
        console.log("Created new user:", user);
      }
      const current = parseFloat(String(user.balance || "0"));
      const newBalance = current + amount;
      const updated = await storage.updateUser(user.id, { balance: String(newBalance.toFixed(4)) });
      console.log("Balance updated from", current, "to", newBalance);
      console.log("=== TOPUP SUCCESS ===");
      return res.json({
        success: true,
        email,
        balance: updated?.balance || String(newBalance.toFixed(4)),
        message: `Successfully added \u09F3${amount} to ${email}`
      });
    } catch (error) {
      console.error("Admin topup error:", error);
      console.log("=== TOPUP ERROR ===");
      res.status(500).json({ error: "Failed to top up" });
    }
  });
  app2.get("/api/admin/services", async (req, res) => {
    console.log("=== ADMIN SERVICES REQUEST ===");
    try {
      if ((await storage.getServices()).length === 0) {
        try {
          const formData = new URLSearchParams();
          formData.append("key", getApiKey());
          formData.append("action", "services");
          const response = await axios.post(API_URL, formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });
          if (response.data && Array.isArray(response.data)) {
            const normalized = response.data.map((svc) => {
              const usdRate = (Number(svc.rate) || 0) / 1e3;
              const bdtRate = usdRate * 110;
              const finalRate = bdtRate * 1.5;
              return {
                id: svc.id ?? svc.service,
                name: svc.name,
                category: svc.category,
                rate: String(finalRate.toFixed(4)),
                min: Number(svc.min),
                max: Number(svc.max),
                description: svc.description ?? void 0
              };
            });
            await storage.setServices(normalized);
          }
        } catch (e) {
          console.error("Admin seed services fetch failed:", e?.message);
        }
      }
      const services2 = await storage.getEffectiveServices();
      res.json(services2);
    } catch (error) {
      console.error("Admin services error:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.put("/api/admin/services/:id", async (req, res) => {
    console.log("=== SERVICE UPDATE REQUEST START ===");
    console.log("Headers:", req.headers);
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    try {
      const serviceId = parseInt(req.params.id);
      const { rate, min, max, description } = req.body;
      if (!serviceId || isNaN(serviceId)) {
        console.log("Invalid service ID:", serviceId);
        return res.status(400).json({ error: "Invalid service ID" });
      }
      if (rate !== void 0) {
        await storage.setCustomRate(serviceId, rate);
        console.log("Custom rate set for service", serviceId, "to", rate);
      }
      const updatedService = await storage.getEffectiveServiceById(serviceId);
      if (!updatedService) {
        console.log("Service not found:", serviceId);
        return res.status(404).json({ error: "Service not found" });
      }
      console.log("Service updated successfully:", updatedService);
      console.log("=== SERVICE UPDATE SUCCESS ===");
      res.json({
        success: true,
        service: updatedService,
        message: `Service price updated to \u09F3${rate}`
      });
    } catch (error) {
      console.error("Admin update service error:", error);
      console.log("=== SERVICE UPDATE ERROR ===");
      res.status(500).json({ error: "Failed to update service" });
    }
  });
  app2.post("/api/admin/services/bulk-update", async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { services: services2 } = req.body;
      if (!Array.isArray(services2)) {
        return res.status(400).json({ error: "Services array is required" });
      }
      const results = [];
      for (const serviceUpdate of services2) {
        const { id, ...updates } = serviceUpdate;
        if (id && updates.rate) {
          const updated = await storage.updateService(id, updates);
          if (updated) {
            results.push({ id, success: true, service: updated });
          } else {
            results.push({ id, success: false, error: "Service not found" });
          }
        }
      }
      res.json({
        message: `Updated ${results.filter((r) => r.success).length} services`,
        results
      });
    } catch (error) {
      console.error("Admin bulk update error:", error);
      res.status(500).json({ error: "Failed to bulk update services" });
    }
  });
  app2.get("/api/user", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/user/sync", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const { firebase_uid, email, display_name } = req.body;
      let user = await storage.getUserByFirebaseUid(firebase_uid || req.user.uid);
      if (!user) {
        user = await storage.createUser({
          username: email || req.user.email,
          password: "",
          // Not used with Firebase auth
          email: email || req.user.email,
          display_name: display_name || req.user.email,
          firebase_uid: firebase_uid || req.user.uid
        });
      } else {
        user = await storage.updateUser(user.id, {
          email: email || req.user.email,
          display_name: display_name || req.user.email
        });
      }
      res.json(user);
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });
  app2.post("/api/order", verifyFirebaseToken, async (req, res) => {
    try {
      const input = z2.object({
        service: z2.number(),
        link: z2.string().url(),
        quantity: z2.number().int().min(1)
      }).parse(req.body);
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      let user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        const existingByEmail = req.user.email ? await storage.getUserByEmail(req.user.email) : void 0;
        if (existingByEmail) {
          user = await storage.updateUser(existingByEmail.id, { firebase_uid: req.user.uid });
        } else {
          user = await storage.createUser({
            username: req.user.email || req.user.uid,
            password: "",
            // not used
            email: req.user.email || `${req.user.uid}@example.com`,
            display_name: req.user.email || void 0,
            firebase_uid: req.user.uid
          });
        }
      }
      const service = await storage.getEffectiveServiceById(input.service);
      if (!service) {
        return res.status(400).json({ error: "Service not found" });
      }
      const bdtRatePerUnit = parseFloat(String(service.rate)) || 0;
      const estimatedCharge = bdtRatePerUnit * input.quantity;
      const usdCostPerUnit = bdtRatePerUnit / 1.5 / 110;
      const actualCostUSD = usdCostPerUnit * input.quantity;
      const currentBalance = parseFloat(String(user.balance || "0"));
      if (currentBalance < estimatedCharge) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      const formData = new URLSearchParams();
      formData.append("key", getApiKey());
      formData.append("action", "add");
      formData.append("service", input.service.toString());
      formData.append("link", input.link);
      formData.append("quantity", input.quantity.toString());
      const response = await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      const data = response.data;
      if (data && data.order) {
        const order = {
          id: data.order,
          user_id: user.id,
          service: input.service,
          link: input.link,
          quantity: input.quantity,
          status: "Pending",
          charge: String(data.charge ?? estimatedCharge.toFixed(4)),
          start_count: null,
          remains: input.quantity,
          created_at: /* @__PURE__ */ new Date()
        };
        await storage.addOrder(order);
        const actualCharge = parseFloat(String(estimatedCharge));
        await storage.updateUser(user.id, {
          balance: String(Math.max(0, currentBalance - actualCharge).toFixed(4))
        });
        res.json({ orderId: data.order, charge: String(actualCharge.toFixed(4)) });
      } else {
        res.status(400).json({ error: data.error || "Failed to place order" });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to place order" });
      }
    }
  });
  app2.get("/api/status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const formData = new URLSearchParams();
      formData.append("key", getApiKey());
      formData.append("action", "status");
      formData.append("order", orderId.toString());
      const response = await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      const data = response.data;
      if (data) {
        await storage.updateOrder(orderId, {
          status: data.status,
          start_count: data.start_count,
          remains: data.remains
        });
        res.json(data);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      res.status(500).json({ error: "Failed to check order status" });
    }
  });
  app2.get("/api/balance", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ balance: String(user.balance || "0") });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });
  app2.get("/api/orders", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const orders2 = await storage.getOrders(user.id);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.post("/api/payment", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const paymentData = paymentSchema.parse(req.body);
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const payment = {
        id: crypto.randomUUID(),
        user_id: user.id,
        amount: paymentData.amount.toString(),
        method: paymentData.method,
        transaction_id: paymentData.transaction_id,
        status: "pending",
        created_at: /* @__PURE__ */ new Date(),
        completed_at: null
      };
      await storage.addPayment(payment);
      res.json({ paymentId: payment.id, status: "pending" });
    } catch (error) {
      console.error("Error adding payment:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to add payment" });
      }
    }
  });
  app2.get("/api/payments", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const payments2 = await storage.getPayments(user.id);
      res.json(payments2);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payment/:paymentId/verify", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const { paymentId } = req.params;
      if (!paymentId) {
        return res.status(400).json({ error: "Payment ID is required" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const payment = await storage.getPaymentById(paymentId);
      if (!payment || payment.user_id !== user.id) {
        return res.status(404).json({ error: "Payment not found" });
      }
      await storage.updatePayment(paymentId, {
        status: "completed",
        completed_at: /* @__PURE__ */ new Date()
      });
      const currentBalance = parseFloat(user.balance || "0");
      const paymentAmount = parseFloat(payment.amount);
      await storage.updateUser(user.id, {
        balance: (currentBalance + paymentAmount).toString()
      });
      res.json({ paymentId, status: "completed" });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });
  app2.get("/api/admin/verify", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer simple-admin-token-")) {
        return res.json({ message: "Admin verified", user: { email: "darkerfanx@gmail.com" } });
      }
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const adminEmails = ["admin@socialsphere.com", "darkerfanx@gmail.com"];
      if (!adminEmails.includes(req.user.email || "")) {
        return res.status(403).json({ error: "Not authorized as admin" });
      }
      res.json({ message: "Admin verified", user: req.user });
    } catch (error) {
      console.error("Error verifying admin:", error);
      res.status(500).json({ error: "Failed to verify admin" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const users2 = await storage.getAllUsers();
      res.json({ users: users2 });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/orders", async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const orders2 = await storage.getAllOrders();
      res.json({ orders: orders2 });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.put("/api/admin/services/:serviceId", async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { serviceId } = req.params;
      const { rate } = req.body;
      if (!rate || rate <= 0) {
        return res.status(400).json({ error: "Invalid rate" });
      }
      await storage.setCustomRate(parseInt(serviceId), rate.toString());
      res.json({
        message: "Service price updated successfully",
        serviceId,
        newRate: rate
      });
    } catch (error) {
      console.error("Error updating service price:", error);
      res.status(500).json({ error: "Failed to update service price" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path4) => path4.replace(/^\/api/, "")
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __dirname2 = path3.dirname(fileURLToPath2(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
