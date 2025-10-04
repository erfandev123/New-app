import { type User, type InsertUser, type Service, type Order, type Payment, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { IStorage } from "./storage";

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const CUSTOM_RATES_FILE = path.join(DATA_DIR, 'custom-rates.json');
const OVERRIDES_FILE = path.join(DATA_DIR, 'service-overrides.json');

export class PersistentStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private services: Service[] = [];
  private orders: Map<number, Order> = new Map();
  private payments: Map<string, Payment> = new Map();
  private customRatesByServiceId: Map<number, string> = new Map();
  private overridesByServiceId: Map<number, Partial<Pick<Service, "min" | "max" | "description">>> = new Map();
  private initialized = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      // Load all data from files
      await this.loadUsers();
      await this.loadServices();
      await this.loadOrders();
      await this.loadPayments();
      await this.loadCustomRates();
      await this.loadOverrides();
      
      this.initialized = true;
      console.log('Persistent storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize persistent storage:', error);
      this.initialized = true; // Continue with empty data
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  private async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      const usersArray: User[] = JSON.parse(data);
      this.users = new Map(usersArray.map(user => [user.id, user]));
      console.log(`Loaded ${usersArray.length} users from persistent storage`);
    } catch (error) {
      console.log('No existing users file, starting with empty users');
      this.users = new Map();
    }
  }

  private async saveUsers() {
    try {
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('Failed to save users:', error);
    }
  }

  private async loadServices() {
    try {
      const data = await fs.readFile(SERVICES_FILE, 'utf-8');
      this.services = JSON.parse(data);
      console.log(`Loaded ${this.services.length} services from persistent storage`);
    } catch (error) {
      console.log('No existing services file, starting with empty services');
      this.services = [];
    }
  }

  private async saveServices() {
    try {
      await fs.writeFile(SERVICES_FILE, JSON.stringify(this.services, null, 2));
    } catch (error) {
      console.error('Failed to save services:', error);
    }
  }

  private async loadOrders() {
    try {
      const data = await fs.readFile(ORDERS_FILE, 'utf-8');
      const ordersArray: Order[] = JSON.parse(data);
      this.orders = new Map(ordersArray.map(order => [order.id, order]));
      console.log(`Loaded ${ordersArray.length} orders from persistent storage`);
    } catch (error) {
      console.log('No existing orders file, starting with empty orders');
      this.orders = new Map();
    }
  }

  private async saveOrders() {
    try {
      const ordersArray = Array.from(this.orders.values());
      await fs.writeFile(ORDERS_FILE, JSON.stringify(ordersArray, null, 2));
    } catch (error) {
      console.error('Failed to save orders:', error);
    }
  }

  private async loadPayments() {
    try {
      const data = await fs.readFile(PAYMENTS_FILE, 'utf-8');
      const paymentsArray: Payment[] = JSON.parse(data);
      this.payments = new Map(paymentsArray.map(payment => [payment.id, payment]));
      console.log(`Loaded ${paymentsArray.length} payments from persistent storage`);
    } catch (error) {
      console.log('No existing payments file, starting with empty payments');
      this.payments = new Map();
    }
  }

  private async savePayments() {
    try {
      const paymentsArray = Array.from(this.payments.values());
      await fs.writeFile(PAYMENTS_FILE, JSON.stringify(paymentsArray, null, 2));
    } catch (error) {
      console.error('Failed to save payments:', error);
    }
  }

  private async loadCustomRates() {
    try {
      const data = await fs.readFile(CUSTOM_RATES_FILE, 'utf-8');
      const ratesObj = JSON.parse(data);
      this.customRatesByServiceId = new Map(Object.entries(ratesObj).map(([k, v]) => [parseInt(k), v as string]));
      console.log(`Loaded ${this.customRatesByServiceId.size} custom rates from persistent storage`);
    } catch (error) {
      console.log('No existing custom rates file, starting with empty rates');
      this.customRatesByServiceId = new Map();
    }
  }

  private async saveCustomRates() {
    try {
      const ratesObj = Object.fromEntries(this.customRatesByServiceId);
      await fs.writeFile(CUSTOM_RATES_FILE, JSON.stringify(ratesObj, null, 2));
    } catch (error) {
      console.error('Failed to save custom rates:', error);
    }
  }

  private async loadOverrides() {
    try {
      const data = await fs.readFile(OVERRIDES_FILE, 'utf-8');
      const overridesObj = JSON.parse(data);
      this.overridesByServiceId = new Map(Object.entries(overridesObj).map(([k, v]) => [parseInt(k), v]));
      console.log(`Loaded ${this.overridesByServiceId.size} service overrides from persistent storage`);
    } catch (error) {
      console.log('No existing overrides file, starting with empty overrides');
      this.overridesByServiceId = new Map();
    }
  }

  private async saveOverrides() {
    try {
      const overridesObj = Object.fromEntries(this.overridesByServiceId);
      await fs.writeFile(OVERRIDES_FILE, JSON.stringify(overridesObj, null, 2));
    } catch (error) {
      console.error('Failed to save overrides:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.firebase_uid === firebaseUid,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      balance: "0",
      display_name: insertUser.display_name || null,
      firebase_uid: insertUser.firebase_uid || null,
    };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.ensureInitialized();
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    await this.saveUsers();
    return updated;
  }

  async getServices(): Promise<Service[]> {
    await this.ensureInitialized();
    return this.services;
  }

  async setServices(services: Service[]): Promise<void> {
    await this.ensureInitialized();
    this.services = services;
    await this.saveServices();
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    await this.ensureInitialized();
    const base = this.services.find(s => s.id === id);
    if (!base) return undefined;

    // Handle price override separately so we don't mutate provider base
    if (updates.rate !== undefined) {
      this.customRatesByServiceId.set(id, String(updates.rate));
      await this.saveCustomRates();
    }
    // Handle other field overrides
    const existingOverrides = this.overridesByServiceId.get(id) || {};
    const nextOverrides: Partial<Pick<Service, "min" | "max" | "description">> = { ...existingOverrides };
    if (updates.min !== undefined) nextOverrides.min = updates.min;
    if (updates.max !== undefined) nextOverrides.max = updates.max;
    if (updates.description !== undefined) nextOverrides.description = updates.description;
    this.overridesByServiceId.set(id, nextOverrides);
    await this.saveOverrides();

    // Return effective view
    return this.getEffectiveServiceById(id);
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    await this.ensureInitialized();
    return this.services.find(s => s.id === id);
  }

  private applyOverrides(base: Service): Service {
    const overrides = this.overridesByServiceId.get(base.id) || {};
    return { ...base, ...overrides } as Service;
  }

  async getEffectiveServices(): Promise<Service[]> {
    await this.ensureInitialized();
    // Effective rate = custom rate if set else 1.4x base provider rate (40% margin)
    return this.services.map(base => {
      const withOverrides = this.applyOverrides(base);
      const custom = this.customRatesByServiceId.get(base.id);
      const saleRate = custom !== undefined ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
      return { ...withOverrides, rate: this.toFixedString(saleRate) } as Service;
    });
  }

  async getEffectiveServiceById(id: number): Promise<Service | undefined> {
    await this.ensureInitialized();
    const base = this.services.find(s => s.id === id);
    if (!base) return undefined;
    const withOverrides = this.applyOverrides(base);
    const custom = this.customRatesByServiceId.get(id);
    const saleRate = custom !== undefined ? custom : String((parseFloat(String(base.rate)) || 0) * 1.4);
    return { ...withOverrides, rate: this.toFixedString(saleRate) } as Service;
  }

  async setCustomRate(id: number, rate: string): Promise<void> {
    await this.ensureInitialized();
    this.customRatesByServiceId.set(id, rate);
    await this.saveCustomRates();
  }

  private toFixedString(value: string | number, digits: number = 4): string {
    const num = parseFloat(String(value)) || 0;
    return num.toFixed(digits);
  }

  async getOrders(userId?: string): Promise<Order[]> {
    await this.ensureInitialized();
    const allOrders = Array.from(this.orders.values());
    if (userId) {
      return allOrders.filter(order => order.user_id === userId);
    }
    return allOrders;
  }

  async addOrder(order: Order): Promise<Order> {
    await this.ensureInitialized();
    this.orders.set(order.id, order);
    await this.saveOrders();
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    await this.ensureInitialized();
    return this.orders.get(id);
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    await this.ensureInitialized();
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.orders.set(id, updated);
    await this.saveOrders();
    return updated;
  }

  async getPayments(userId: string): Promise<Payment[]> {
    await this.ensureInitialized();
    return Array.from(this.payments.values()).filter(payment => payment.user_id === userId);
  }

  async addPayment(payment: Payment): Promise<Payment> {
    await this.ensureInitialized();
    this.payments.set(payment.id, payment);
    await this.savePayments();
    return payment;
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    await this.ensureInitialized();
    return this.payments.get(id);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    await this.ensureInitialized();
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.payments.set(id, updated);
    await this.savePayments();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();
    return Array.from(this.users.values());
  }

  async getAllOrders(): Promise<Order[]> {
    await this.ensureInitialized();
    return Array.from(this.orders.values());
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await this.ensureInitialized();
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
      await this.saveUsers();
    }
  }
}
