import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken, requireAdmin } from './middleware/auth';
import { antiSpam } from './middleware/antiSpam';
import * as authController from './controllers/authController';
import * as productController from './controllers/productController';
import * as orderController from './controllers/orderController';
import * as paymentController from './controllers/paymentController';
import * as adminController from './controllers/adminController';
import * as chatController from './controllers/chatController';
import * as referralController from './controllers/referralController';
import * as promoCodeController from './controllers/promoCodeController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CryptoShop API is running' });
});

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authenticateToken, authController.getProfile);

// Product routes (public)
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/:id', productController.getProductById);

// Order routes (authenticated)
app.get('/api/orders', authenticateToken, orderController.getUserOrders);
app.get('/api/orders/:id', authenticateToken, orderController.getOrderById);

// Payment routes (with anti-spam protection)
app.post('/api/checkout', authenticateToken, antiSpam, paymentController.createCheckout);
app.post('/api/payment/create-static-address', authenticateToken, paymentController.createStaticAddressHandler);
app.post('/api/webhook/oxapay', paymentController.handleWebhook);

// Admin routes
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, adminController.getDashboardStats);

// Admin - Products
app.get('/api/admin/products', authenticateToken, requireAdmin, adminController.getAllProductsAdmin);
app.post('/api/admin/products', authenticateToken, requireAdmin, adminController.createProduct);
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, adminController.updateProduct);
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, adminController.deleteProduct);

// Admin - Product Price Tiers
app.get('/api/admin/products/:productId/price-tiers', authenticateToken, requireAdmin, adminController.getProductPriceTiers);
app.post('/api/admin/products/:productId/price-tiers', authenticateToken, requireAdmin, adminController.createPriceTier);
app.put('/api/admin/price-tiers/:tierId', authenticateToken, requireAdmin, adminController.updatePriceTier);
app.delete('/api/admin/price-tiers/:tierId', authenticateToken, requireAdmin, adminController.deletePriceTier);

// Admin - Orders
app.get('/api/admin/orders', authenticateToken, requireAdmin, adminController.getAllOrders);
app.put('/api/admin/orders/:id', authenticateToken, requireAdmin, adminController.updateOrderStatus);

// Admin - Delivery
app.put('/api/admin/orders/:orderId/deliver', authenticateToken, requireAdmin, adminController.updateDeliveryInfo);

// Admin - Users
app.get('/api/admin/users', authenticateToken, requireAdmin, adminController.getAllUsers);
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, adminController.updateUserAdmin);
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);
app.post('/api/admin/users/:id/ban', authenticateToken, requireAdmin, adminController.banUser);
app.post('/api/admin/users/:id/unban', authenticateToken, requireAdmin, adminController.unbanUser);

// Chat routes (authenticated users and admins)
app.post('/api/chat/send', authenticateToken, chatController.sendMessage);
app.get('/api/chat/messages', authenticateToken, chatController.getMessages);
app.get('/api/chat/unread', authenticateToken, chatController.getUnreadCount);
app.put('/api/chat/read', authenticateToken, chatController.markAsRead);

// Chat routes (admin only)
app.get('/api/chat/conversations', authenticateToken, requireAdmin, chatController.getConversations);

// Referral routes (authenticated users)
app.get('/api/referral/stats', authenticateToken, referralController.getReferralStats);

// Referral routes (admin only)
app.get('/api/admin/referrals', authenticateToken, requireAdmin, referralController.getAllReferrals);

// Promo code routes (authenticated users)
app.post('/api/promo/validate', authenticateToken, promoCodeController.validatePromoCode);

// Promo code routes (admin only)
app.post('/api/admin/promo', authenticateToken, requireAdmin, promoCodeController.createPromoCode);
app.get('/api/admin/promo', authenticateToken, requireAdmin, promoCodeController.getAllPromoCodes);
app.put('/api/admin/promo/:id', authenticateToken, requireAdmin, promoCodeController.updatePromoCode);
app.delete('/api/admin/promo/:id', authenticateToken, requireAdmin, promoCodeController.deletePromoCode);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
