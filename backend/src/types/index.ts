import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  telegram?: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  picture_link: string;
  quantity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  delivery_status: 'pending' | 'delivered';
  payment_id?: string;
  payment_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_picture?: string;
  product_price: number;
  quantity: number;
  delivery_map_link?: string;
  delivery_image_link?: string;
  delivered_at?: Date;
  created_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    is_admin: boolean;
  };
}

export interface OxaPayInvoice {
  trackId: number;
  orderId: string;
  payLink: string;
  currency: string;
  amount: number;
}

export interface OxaPayWebhook {
  trackId: number;
  orderId: string;
  status: string;
  crypto: string;
  amount: number;
  payAmount: number;
  email?: string;
}
