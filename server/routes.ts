import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, orderStatusSchema, paymentSchema, insertUserSchema, type Service } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import crypto from "crypto";
import "dotenv/config";

const API_URL = "https://bdclick24.com/api/v2";

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

function getApiKey(): string {
  const key = process.env.BDCLICK24_API_KEY;
  if (!key || key.trim() === "") {
    throw Object.assign(new Error("BDClick24 API key is not configured"), { status: 500 });
  }
  return key;
}

// Simple token verification with auto-user creation
async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const headerUid = (req.headers["x-firebase-uid"] as string | undefined)?.toString();

    // Prefer explicit UID header if provided by client
    const uid = headerUid || token;
    const email = (req.headers["x-user-email"] as string | undefined) || 'user@example.com';

    req.user = { uid, email };
    
    // Auto-create user if not exists
    try {
      let user = await storage.getUserByFirebaseUid(uid);
      if (!user) {
        // Try find by email first to avoid duplicates
        const existingByEmail = email !== 'user@example.com' ? await storage.getUserByEmail(email) : undefined;
        if (existingByEmail) {
          user = await storage.updateUser(existingByEmail.id, { firebase_uid: uid });
        } else {
          user = await storage.createUser({
            username: email || uid,
            password: "", // not used
            email: email || `${uid}@example.com`,
            display_name: email || undefined,
            firebase_uid: uid,
          });
        }
      }
    } catch (userError) {
      console.error("Auto user creation failed:", userError);
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve admin panel static files
  app.use('/admin', express.static('/home/darkerfan/Downloads/SocialSphere/admin'));
  
  // Serve admin panel index for /admin/ route
  app.get('/admin/', (req, res) => {
    res.sendFile('/home/darkerfan/Downloads/SocialSphere/admin/index.html');
  });
  // Admin helper
  function isAdmin(req: AuthenticatedRequest): boolean {
    // Always allow admin access for development/testing
    console.log('Admin check - always allowing access for development');
    return true;
  }
  
  // Get all services (base from provider, then return effective with margin/custom pricing)
  app.get("/api/services", async (req, res) => {
    try {
      const formData = new URLSearchParams();
      formData.append('key', getApiKey());
      formData.append('action', 'services');

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log("Services API Response received:", response.data?.length || 0, "services");

      if (response.data && Array.isArray(response.data)) {
        // Normalize BDClick24 service shape to our expected client shape
        // Convert USD to BDT (1 USD = 110 BDT approximately) and add profit margin
        const normalized = response.data.map((svc: any) => {
          const usdRate = (Number(svc.rate) || 0) / 1000; // Per unit rate in USD
          const bdtRate = usdRate * 110; // Convert to BDT
          const finalRate = bdtRate * 1.5; // Add 50% profit margin
          
          return {
            id: svc.id ?? svc.service, // BDClick24 often uses `service`
            name: svc.name,
            category: svc.category,
            // Rate in BDT with profit margin
            rate: String(finalRate.toFixed(4)),
            min: Number(svc.min),
            max: Number(svc.max),
            description: svc.description ?? undefined,
          };
        });

        // Store provider services in memory for future reference
        await storage.setServices(normalized);
        // Return effective services (custom/admin price or 40% margin)
        const effective = await storage.getEffectiveServices();
        res.json(effective);
      } else if (response.data && response.data.error) {
        console.error("API Error:", response.data.error);
        res.status(401).json({ error: `BDClick24 API Error: ${response.data.error}. Please check your API key.` });
      } else {
        console.error("Unexpected response structure:", response.data);
        res.status(500).json({ error: "Invalid response from BDClick24 API" });
      }
    } catch (error: any) {
      console.error("Error fetching services:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to connect to BDClick24 API" });
    }
  });

  // Admin: Top-up balance by email
  app.post("/api/admin/topup", async (req: any, res: Response) => {
    console.log('=== TOPUP REQUEST START ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
      const { email, amount } = req.body as { email?: string; amount?: number };
      if (!email || !amount || amount <= 0) {
        console.log('Invalid input - email:', email, 'amount:', amount);
        return res.status(400).json({ error: "Email and positive amount are required" });
      }
      
      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create a basic user record if not found
        user = await storage.createUser({
          username: email,
          password: "", // not used
          email,
          display_name: email,
          firebase_uid: undefined as any,
        });
        console.log('Created new user:', user);
      }
      
      const current = parseFloat(String(user.balance || "0"));
      const newBalance = current + amount;
      const updated = await storage.updateUser(user.id, { balance: String(newBalance.toFixed(4)) });
      
      console.log('Balance updated from', current, 'to', newBalance);
      console.log('=== TOPUP SUCCESS ===');
      
      return res.json({ 
        success: true,
        email, 
        balance: updated?.balance || String(newBalance.toFixed(4)),
        message: `Successfully added ৳${amount} to ${email}`
      });
    } catch (error) {
      console.error("Admin topup error:", error);
      console.log('=== TOPUP ERROR ===');
      res.status(500).json({ error: "Failed to top up" });
    }
  });

  // Admin: Get all services for management (effective view)
  app.get("/api/admin/services", async (req: any, res: Response) => {
    console.log('=== ADMIN SERVICES REQUEST ===');
    try {
      // Ensure we have provider data; if empty, fetch from provider now
      if ((await storage.getServices()).length === 0) {
        try {
          const formData = new URLSearchParams();
          formData.append('key', getApiKey());
          formData.append('action', 'services');
          const response = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          if (response.data && Array.isArray(response.data)) {
            const normalized = response.data.map((svc: any) => {
              const usdRate = (Number(svc.rate) || 0) / 1000; // Per unit rate in USD
              const bdtRate = usdRate * 110; // Convert to BDT
              const finalRate = bdtRate * 1.5; // Add 50% profit margin
              
              return {
                id: svc.id ?? svc.service,
                name: svc.name,
                category: svc.category,
                rate: String(finalRate.toFixed(4)),
                min: Number(svc.min),
                max: Number(svc.max),
                description: svc.description ?? undefined,
              };
            });
            await storage.setServices(normalized);
          }
        } catch (e) {
          console.error("Admin seed services fetch failed:", (e as any)?.message);
        }
      }
      const services = await storage.getEffectiveServices();
      res.json(services);
    } catch (error) {
      console.error("Admin services error:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Admin: Update service price
  app.put("/api/admin/services/:id", async (req: any, res: Response) => {
    console.log('=== SERVICE UPDATE REQUEST START ===');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    try {
      const serviceId = parseInt(req.params.id);
      const { rate, min, max, description } = req.body as { 
        rate?: string; 
        min?: number; 
        max?: number; 
        description?: string 
      };
      
      if (!serviceId || isNaN(serviceId)) {
        console.log('Invalid service ID:', serviceId);
        return res.status(400).json({ error: "Invalid service ID" });
      }

      // For now, just set custom rate since that's what the admin panel uses
      if (rate !== undefined) {
        await storage.setCustomRate(serviceId, rate);
        console.log('Custom rate set for service', serviceId, 'to', rate);
      }

      // Get the updated service to return
      const updatedService = await storage.getEffectiveServiceById(serviceId);
      if (!updatedService) {
        console.log('Service not found:', serviceId);
        return res.status(404).json({ error: "Service not found" });
      }

      console.log('Service updated successfully:', updatedService);
      console.log('=== SERVICE UPDATE SUCCESS ===');
      
      res.json({ 
        success: true,
        service: updatedService,
        message: `Service price updated to ৳${rate}`
      });
    } catch (error) {
      console.error("Admin update service error:", error);
      console.log('=== SERVICE UPDATE ERROR ===');
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  // Admin: Bulk update service prices
  app.post("/api/admin/services/bulk-update", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { services } = req.body as { 
        services: Array<{ id: number; rate: string; min?: number; max?: number; description?: string }> 
      };
      
      if (!Array.isArray(services)) {
        return res.status(400).json({ error: "Services array is required" });
      }

      const results = [];
      for (const serviceUpdate of services) {
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
        message: `Updated ${results.filter(r => r.success).length} services`,
        results 
      });
    } catch (error) {
      console.error("Admin bulk update error:", error);
      res.status(500).json({ error: "Failed to bulk update services" });
    }
  });

  // Get current user
  app.get("/api/user", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
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

  // Sync user from Firebase
  app.post("/api/user/sync", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { firebase_uid, email, display_name } = req.body;
      
      let user = await storage.getUserByFirebaseUid(firebase_uid || req.user.uid);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: email || req.user.email,
          password: "", // Not used with Firebase auth
          email: email || req.user.email,
          display_name: display_name || req.user.email,
          firebase_uid: firebase_uid || req.user.uid,
        });
      } else {
        // Update existing user
        user = await storage.updateUser(user.id, {
          email: email || req.user.email,
          display_name: display_name || req.user.email,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Place new order (requires authentication)
  app.post("/api/order", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate input payload (derive user from token, don't require user_id from client)
      const input = z.object({
        service: z.number(),
        link: z.string().url(),
        quantity: z.number().int().min(1),
      }).parse(req.body);

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get or create user
      let user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        // Try find by email first to avoid duplicates
        const existingByEmail = req.user.email ? await storage.getUserByEmail(req.user.email) : undefined;
        if (existingByEmail) {
          user = await storage.updateUser(existingByEmail.id, { firebase_uid: req.user.uid });
        } else {
          user = await storage.createUser({
            username: req.user.email || req.user.uid,
            password: "", // not used
            email: req.user.email || `${req.user.uid}@example.com`,
            display_name: req.user.email || undefined,
            firebase_uid: req.user.uid,
          });
        }
      }

      // Check if service exists
      const service = await storage.getEffectiveServiceById(input.service);
      if (!service) {
        return res.status(400).json({ error: "Service not found" });
      }

      // Charge the user using BDT rate with profit margin
      const bdtRatePerUnit = parseFloat(String(service.rate)) || 0;
      const estimatedCharge = bdtRatePerUnit * input.quantity;

      // Calculate actual cost to pay BDClick24 (in USD)
      const usdCostPerUnit = (bdtRatePerUnit / 1.5) / 110; // Remove profit margin and convert to USD
      const actualCostUSD = usdCostPerUnit * input.quantity;

      // Enforce balance check before placing order
      const currentBalance = parseFloat(String(user!.balance || "0"));
      if (currentBalance < estimatedCharge) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const formData = new URLSearchParams();
      formData.append('key', getApiKey());
      formData.append('action', 'add');
      formData.append('service', input.service.toString());
      formData.append('link', input.link);
      formData.append('quantity', input.quantity.toString());

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const data = response.data;

      if (data && data.order) {
        // Store order in memory
        const order = {
          id: data.order,
          user_id: user!.id,
          service: input.service,
          link: input.link,
          quantity: input.quantity,
          status: "Pending",
          charge: String(data.charge ?? estimatedCharge.toFixed(4)),
          start_count: null,
          remains: input.quantity,
          created_at: new Date()
        };
        
        await storage.addOrder(order);
        // Deduct actual charge from user's balance using effective sale price
        const actualCharge = parseFloat(String(estimatedCharge));
        await storage.updateUser(user!.id, {
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

  // Check order status
  app.get("/api/status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      const formData = new URLSearchParams();
      formData.append('key', getApiKey());
      formData.append('action', 'status');
      formData.append('order', orderId.toString());

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const data = response.data;

      if (data) {
        // Update stored order with latest status
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

  // Get account balance (user-specific)
  app.get("/api/balance", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
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

  // Get order history (user-specific)
  app.get("/api/orders", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const orders = await storage.getOrders(user.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Add payment
  app.post("/api/payment", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
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
        created_at: new Date(),
        completed_at: null,
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

  // Get payment history
  app.get("/api/payments", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const payments = await storage.getPayments(user.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Verify payment (admin function - in real app, this would verify with payment provider)
  app.post("/api/payment/:paymentId/verify", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
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

      // In a real app, you would verify the transaction with bKash/Nagad API
      // For now, we'll just mark it as completed and add balance
      await storage.updatePayment(paymentId, {
        status: "completed",
        completed_at: new Date(),
      });

      // Add balance to user
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

  // Admin verification endpoint
  app.get("/api/admin/verify", async (req: AuthenticatedRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Check for simple admin token (bypass Firebase for testing)
      if (authHeader && authHeader.startsWith('Bearer simple-admin-token-')) {
        return res.json({ message: "Admin verified", user: { email: "darkerfanx@gmail.com" } });
      }
      
      // Original Firebase verification
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const adminEmails = ['admin@socialsphere.com', 'darkerfanx@gmail.com'];
      
      if (!adminEmails.includes(req.user.email || '')) {
        return res.status(403).json({ error: "Not authorized as admin" });
      }
      
      res.json({ message: "Admin verified", user: req.user });
    } catch (error) {
      console.error("Error verifying admin:", error);
      res.status(500).json({ error: "Failed to verify admin" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", async (req: AuthenticatedRequest, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", async (req: AuthenticatedRequest, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const orders = await storage.getAllOrders();
      res.json({ orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update service price (admin only)
  app.put("/api/admin/services/:serviceId", async (req: AuthenticatedRequest, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { serviceId } = req.params;
      const { rate } = req.body;
      
      if (!rate || rate <= 0) {
        return res.status(400).json({ error: "Invalid rate" });
      }
      
      // Update service rate in storage
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

  const httpServer = createServer(app);
  return httpServer;
}
