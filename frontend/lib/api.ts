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
export const createCheckout = (
  items: { productId: string; quantity: number }[],
  city: string,
  district: string,
  promoCode?: string
) =>
  api.post('/api/checkout', { items, city, district, promoCode });

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

// Admin - Product Price Tiers
export const getProductPriceTiers = (productId: string) =>
  api.get(`/api/admin/products/${productId}/price-tiers`);

export const createPriceTier = (productId: string, quantity: number, price: number) =>
  api.post(`/api/admin/products/${productId}/price-tiers`, { quantity, price });

export const updatePriceTier = (tierId: string, quantity: number, price: number) =>
  api.put(`/api/admin/price-tiers/${tierId}`, { quantity, price });

export const deletePriceTier = (tierId: string) =>
  api.delete(`/api/admin/price-tiers/${tierId}`);

// Admin - Orders
export const getAdminOrders = () =>
  api.get('/api/admin/orders');

export const updateOrderStatus = (id: string, status: string) =>
  api.put(`/api/admin/orders/${id}`, { status });

// Admin - Delivery
export const updateDeliveryInfo = (orderId: string, delivery_map_link: string, delivery_image_link: string) =>
  api.put(`/api/admin/orders/${orderId}/deliver`, { delivery_map_link, delivery_image_link });

// Admin - Users
export const getAdminUsers = (search?: string) =>
  api.get('/api/admin/users', { params: { search } });

export const updateUserAdmin = (id: string, is_admin: boolean) =>
  api.put(`/api/admin/users/${id}`, { is_admin });

export const deleteUser = (id: string) =>
  api.delete(`/api/admin/users/${id}`);

export const banUser = (id: string, hours?: number) =>
  api.post(`/api/admin/users/${id}/ban`, { hours });

export const unbanUser = (id: string) =>
  api.post(`/api/admin/users/${id}/unban`);

// Chat
export const sendChatMessage = (message: string, recipientUserId?: string) =>
  api.post('/api/chat/send', { message, recipientUserId });

export const getChatMessages = (targetUserId?: string) =>
  api.get('/api/chat/messages', { params: { targetUserId } });

export const getUnreadChatCount = () =>
  api.get('/api/chat/unread');

export const markChatAsRead = (conversationUserId?: string) =>
  api.put('/api/chat/read', { conversationUserId });

export const getChatConversations = () =>
  api.get('/api/chat/conversations');

// Referrals
export const getReferralStats = () =>
  api.get('/api/referral/stats');

export const getAdminReferrals = () =>
  api.get('/api/admin/referrals');

// Promo codes
export const validatePromoCode = (code: string, orderAmount: number) =>
  api.post('/api/promo/validate', { code, orderAmount });

export const createPromoCode = (data: {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number;
  valid_until?: string;
  min_order_amount?: number;
}) => api.post('/api/admin/promo', data);

export const getAdminPromoCodes = () =>
  api.get('/api/admin/promo');

export const updatePromoCode = (id: string, data: any) =>
  api.put(`/api/admin/promo/${id}`, data);

export const deletePromoCode = (id: string) =>
  api.delete(`/api/admin/promo/${id}`);

export default api;
