import { type User, type InsertUser, type Service, type Order, type Payment, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getServices(): Promise<Service[]>;
  setServices(services: Service[]): Promise<void>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  getServiceById(id: number): Promise<Service | undefined>;
  getEffectiveServices(): Promise<Service[]>;
  getEffectiveServiceById(id: number): Promise<Service | undefined>;
  setCustomRate(id: number, rate: string): Promise<void>;
  getOrders(userId?: string): Promise<Order[]>;
  addOrder(order: Order): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  getPayments(userId: string): Promise<Payment[]>;
  addPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllOrders(): Promise<Order[]>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private services: Service[] = [];
  private orders: Map<number, Order> = new Map();
  private payments: Map<string, Payment> = new Map();
  // Admin overrides: store custom sale price and other optional overrides separately from base provider data
  private customRatesByServiceId: Map<number, string> = new Map();
  private overridesByServiceId: Map<number, Partial<Pick<Service, "min" | "max" | "description">>> = new Map();

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebase_uid === firebaseUid,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      balance: "0",
      display_name: insertUser.display_name || null,
      firebase_uid: insertUser.firebase_uid || null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getServices(): Promise<Service[]> {
    // Return base provider services (without admin pricing). Use getEffectiveServices for client display
    return this.services;
  }

  async setServices(services: Service[]): Promise<void> {
    // Replace base provider services but retain any admin overrides
    this.services = services;
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const base = this.services.find(s => s.id === id);
    if (!base) return undefined;

    // Handle price override separately so we don't mutate provider base
    if (updates.rate !== undefined) {
      this.customRatesByServiceId.set(id, String(updates.rate));
    }
    // Handle other field overrides
    const existingOverrides = this.overridesByServiceId.get(id) || {};
    const nextOverrides: Partial<Pick<Service, "min" | "max" | "description">> = { ...existingOverrides };
    if (updates.min !== undefined) nextOverrides.min = updates.min;
    if (updates.max !== undefined) nextOverrides.max = updates.max;
    if (updates.description !== undefined) nextOverrides.description = updates.description;
    this.overridesByServiceId.set(id, nextOverrides);

    // Return effective view
    return this.getEffectiveServiceById(id);
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    return this.services.find(s => s.id === id);
  }

  private applyOverrides(base: Service): Service {
    const overrides = this.overridesByServiceId.get(base.id) || {};
    return { ...base, ...overrides } as Service;
  }

  async getEffectiveServices(): Promise<Service[]> {
    // Effective rate = custom rate if set else 1.4x base provider rate (40% margin)
    return this.services.map(base => {
      const withOverrides = this.applyOverrides(base);
      const custom = this.customRatesByServiceId.get(base.id);
      const saleRate = custom !== undefined ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
      return { ...withOverrides, rate: this.toFixedString(saleRate) } as Service;
    });
  }

  async getEffectiveServiceById(id: number): Promise<Service | undefined> {
    const base = this.services.find(s => s.id === id);
    if (!base) return undefined;
    const withOverrides = this.applyOverrides(base);
    const custom = this.customRatesByServiceId.get(id);
    const saleRate = custom !== undefined ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
    return { ...withOverrides, rate: this.toFixedString(saleRate) } as Service;
  }

  async setCustomRate(id: number, rate: string): Promise<void> {
    this.customRatesByServiceId.set(id, rate);
  }

  private toFixedString(value: string | number, digits: number = 4): string {
    const num = parseFloat(String(value)) || 0;
    return num.toFixed(digits);
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values());
    if (userId) {
      return allOrders.filter(order => order.user_id === userId);
    }
    return allOrders;
  }

  async addOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  async getPayments(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.user_id === userId);
  }

  async addPayment(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.payments.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
    }
  }
}

import { PersistentStorage } from "./persistent-storage";

export const storage = new PersistentStorage();
