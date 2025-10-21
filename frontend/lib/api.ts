import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const register = (username: string, password: string, telegram?: string) =>
  api.post('/api/auth/register', { username, password, telegram });

export const login = (username: string, password: string) =>
  api.post('/api/auth/login', { username, password });

export const getProfile = () =>
  api.get('/api/auth/profile');

// Products
export const getProducts = () =>
  api.get('/api/products');

export const getProduct = (id: string) =>
  api.get(`/api/products/${id}`);

// Orders
export const getUserOrders = () =>
  api.get('/api/orders');

export const getOrder = (id: string) =>
  api.get(`/api/orders/${id}`);

// Checkout
export const createCheckout = (items: { productId: string; quantity: number }[]) =>
  api.post('/api/checkout', { items });

// Admin - Dashboard
export const getDashboardStats = () =>
  api.get('/api/admin/dashboard');

// Admin - Products
export const getAdminProducts = () =>
  api.get('/api/admin/products');

export const createProduct = (data: any) =>
  api.post('/api/admin/products', data);

export const updateProduct = (id: string, data: any) =>
  api.put(`/api/admin/products/${id}`, data);

export const deleteProduct = (id: string) =>
  api.delete(`/api/admin/products/${id}`);

// Admin - Orders
export const getAdminOrders = () =>
  api.get('/api/admin/orders');

export const updateOrderStatus = (id: string, status: string) =>
  api.put(`/api/admin/orders/${id}`, { status });

// Admin - Users
export const getAdminUsers = () =>
  api.get('/api/admin/users');

export const updateUserAdmin = (id: string, is_admin: boolean) =>
  api.put(`/api/admin/users/${id}`, { is_admin });

export default api;
