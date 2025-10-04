export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  balance: string;
  firebase_uid?: string;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  rate: string;
  min: number;
  max: number;
  description?: string;
}

export interface Order {
  id: number;
  user_id?: string;
  service: number;
  link: string;
  quantity: number;
  status: string;
  charge: string;
  start_count?: number;
  remains?: number;
  created_at?: string;
}

export interface OrderStatus {
  order: number;
  status: string;
  start_count?: number;
  remains?: number;
  charge?: string;
}

export interface Balance {
  balance: string;
}

export interface PlaceOrderRequest {
  service: number;
  link: string;
  quantity: number;
}

export interface PlaceOrderResponse {
  orderId: number;
  charge: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: string;
  method: string;
  transaction_id?: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface PaymentRequest {
  amount: number;
  method: "bkash" | "nagad" | "rocket";
  transaction_id: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
}
