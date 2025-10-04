import { apiRequest } from "./queryClient";
import type { Service, Order, OrderStatus, Balance, PlaceOrderRequest, PlaceOrderResponse, User, Payment, PaymentRequest, PaymentResponse } from "../types";

export const api = {
  // Get all services
  getServices: async (): Promise<Service[]> => {
    const response = await apiRequest("GET", "/api/services");
    return response.json();
  },

  // Place new order
  placeOrder: async (orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
    const response = await apiRequest("POST", "/api/order", orderData);
    return response.json();
  },

  // Check order status
  getOrderStatus: async (orderId: string): Promise<OrderStatus> => {
    const response = await apiRequest("GET", `/api/status/${orderId}`);
    return response.json();
  },

  // Get account balance
  getBalance: async (): Promise<Balance> => {
    const response = await apiRequest("GET", "/api/balance");
    return response.json();
  },

  // Get order history
  getOrders: async (): Promise<Order[]> => {
    const response = await apiRequest("GET", "/api/orders");
    return response.json();
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const response = await apiRequest("GET", "/api/user");
    return response.json();
  },

  // Create or update user from Firebase
  syncUser: async (firebaseUser: any): Promise<User> => {
    const response = await apiRequest("POST", "/api/user/sync", {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      display_name: firebaseUser.displayName,
    });
    return response.json();
  },

  // Add payment
  addPayment: async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
    const response = await apiRequest("POST", "/api/payment", paymentData);
    return response.json();
  },

  // Get payment history
  getPayments: async (): Promise<Payment[]> => {
    const response = await apiRequest("GET", "/api/payments");
    return response.json();
  },

  // Verify payment
  verifyPayment: async (paymentId: string): Promise<PaymentResponse> => {
    const response = await apiRequest("POST", `/api/payment/${paymentId}/verify`);
    return response.json();
  },
};
