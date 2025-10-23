import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  city_id: string,
  district_id: string,
  promoCode?: string
) =>
  api.post('/api/checkout', { items, city_id, district_id, promoCode });

// Locations (global - for admin)
export const getCities = () =>
  api.get('/api/locations/cities');

export const getDistricts = (cityId: string) =>
  api.get(`/api/locations/cities/${cityId}/districts`);

// Product-specific locations (for customers)
export const getProductCities = (productId: string) =>
  api.get(`/api/locations/products/${productId}/cities`);

export const getProductDistricts = (productId: string, cityId: string) =>
  api.get(`/api/locations/products/${productId}/cities/${cityId}/districts`);

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

// Product Variants (Public - Customer)
export const getProductVariants = (productId: string, cityId?: string) =>
  api.get(`/api/products/${productId}/variants`, {
    params: { cityId }
  });

export const checkVariantAvailability = (productId: string, variantId: string, cityId: string, amount?: number) =>
  api.get(`/api/products/${productId}/variants/${variantId}/availability`, {
    params: { cityId, amount }
  });

// Admin - Product Variants Management
export const getAdminProductVariants = (productId: string) =>
  api.get(`/api/admin/products/${productId}/variants`);

export const createVariant = (productId: string, data: {
  variantName: string;
  variantType: 'гр' | 'бр';
  amount: number;
  price: number;
  sortOrder?: number;
}) => api.post(`/api/admin/products/${productId}/variants`, data);

export const updateVariant = (variantId: string, data: {
  variantName?: string;
  variantType?: 'гр' | 'бр';
  amount?: number;
  price?: number;
  isActive?: boolean;
  sortOrder?: number;
}) => api.put(`/api/admin/variants/${variantId}`, data);

export const deleteVariant = (variantId: string) =>
  api.delete(`/api/admin/variants/${variantId}`);

// Admin - Variant Stock Management
export const getVariantStock = (variantId: string) =>
  api.get(`/api/admin/variants/${variantId}/stock`);

export const updateVariantStock = (variantId: string, cityId: string, data: {
  stockAmount?: number;
  lowStockThreshold?: number;
}) => api.put(`/api/admin/variants/${variantId}/stock/${cityId}`, data);

export const bulkUpdateVariantStock = (variantId: string, stockUpdates: Array<{
  cityId: string;
  stockAmount: number;
  lowStockThreshold?: number;
}>) => api.post(`/api/admin/variants/${variantId}/stock/bulk`, { stockUpdates });

// Admin - Orders
export const getAdminOrders = (statusFilter?: string, deliveryFilter?: string) =>
  api.get('/api/admin/orders', {
    params: {
      status: statusFilter || undefined,
      delivery_status: deliveryFilter || undefined
    }
  });

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

// Admin - Cities
export const getAdminCities = () =>
  api.get('/api/admin/cities');

export const createCity = (data: { name: string; name_en?: string; sort_order?: number }) =>
  api.post('/api/admin/cities', data);

export const updateCity = (id: string, data: any) =>
  api.put(`/api/admin/cities/${id}`, data);

export const deleteCity = (id: string) =>
  api.delete(`/api/admin/cities/${id}`);

// Admin - Districts
export const getAdminDistricts = () =>
  api.get('/api/admin/districts');

export const createDistrict = (data: { city_id: string; name: string; name_en?: string; sort_order?: number }) =>
  api.post('/api/admin/districts', data);

export const updateDistrict = (id: string, data: any) =>
  api.put(`/api/admin/districts/${id}`, data);

export const deleteDistrict = (id: string) =>
  api.delete(`/api/admin/districts/${id}`);

// Admin - Product Locations
export const getProductAvailableCities = (productId: string) =>
  api.get(`/api/admin/products/${productId}/cities`);

export const getProductAvailableDistricts = (productId: string, cityId: string) =>
  api.get(`/api/admin/products/${productId}/cities/${cityId}/districts`);

export const addCityToProduct = (productId: string, cityId: string) =>
  api.post('/api/admin/products/cities', { productId, cityId });

export const removeCityFromProduct = (productId: string, cityId: string) =>
  api.delete(`/api/admin/products/${productId}/cities/${cityId}`);

export const addDistrictToProduct = (productId: string, cityId: string, districtId: string) =>
  api.post('/api/admin/products/districts', { productId, cityId, districtId });

export const removeDistrictFromProduct = (productId: string, districtId: string) =>
  api.delete(`/api/admin/products/${productId}/districts/${districtId}`);

export const bulkUpdateProductLocations = (
  productId: string,
  cities: string[],
  districts: { cityId: string; districtId: string }[]
) => api.post('/api/admin/products/locations/bulk', { productId, cities, districts });

export default api;
