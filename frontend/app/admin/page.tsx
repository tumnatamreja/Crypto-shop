'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDashboardStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  updateDeliveryInfo,
  getAdminUsers,
  updateUserAdmin,
  deleteUser,
  banUser,
  unbanUser,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  markChatAsRead,
  getUnreadChatCount,
  getAdminPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getAdminCities,
  getAdminDistricts,
  getProductAvailableCities,
  getProductAvailableDistricts,
  bulkUpdateProductLocations,
} from '@/lib/api';

type Tab = 'dashboard' | 'products' | 'orders' | 'users' | 'chat' | 'promos' | 'settings';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  picture_link: string;
  quantity: number;
  is_active: boolean;
}

interface Order {
  id: string;
  username: string;
  telegram: string;
  total_amount: number;
  currency: string;
  status: string;
  delivery_status: string;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    product_picture: string;
    product_price: number;
    quantity: number;
    delivery_map_link?: string;
    delivery_image_link?: string;
  }[];
}

interface User {
  id: string;
  username: string;
  telegram: string;
  is_admin: boolean;
  banned_until: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

interface Conversation {
  id: string;
  username: string;
  telegram: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  min_order_amount: number;
  created_at: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard
  const [stats, setStats] = useState<any>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    picture_link: '',
    quantity: 1,
  });

  // Product Locations
  const [allCities, setAllCities] = useState<any[]>([]);
  const [allDistricts, setAllDistricts] = useState<any[]>([]);
  const [selectedProductForLocations, setSelectedProductForLocations] = useState<string | null>(null);
  const [productSelectedCities, setProductSelectedCities] = useState<string[]>([]);
  const [productSelectedDistricts, setProductSelectedDistricts] = useState<{cityId: string; districtId: string}[]>([]);

  // Product Price Tiers - DISABLED (will be replaced with variants system)
  // const [selectedProductForPriceTiers, setSelectedProductForPriceTiers] = useState<string | null>(null);
  // const [priceTiers, setPriceTiers] = useState<any[]>([]);
  // const [showPriceTierForm, setShowPriceTierForm] = useState(false);
  // const [editingPriceTier, setEditingPriceTier] = useState<any | null>(null);
  // const [priceTierForm, setPriceTierForm] = useState({
  //   quantity: '',
  //   price: '',
  // });

  // Product Variants & Stock
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [variantForm, setVariantForm] = useState({
    variantName: '',
    variantType: 'гр' as 'гр' | 'бр',
    amount: '',
    price: '',
  });
  const [selectedVariantForStock, setSelectedVariantForStock] = useState<string | null>(null);
  const [variantStock, setVariantStock] = useState<any[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    orderId: '',
    delivery_map_link: '',
    delivery_image_link: '',
  });
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Chat
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Promo Codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    valid_until: '',
    min_order_amount: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.is_admin) {
      router.push('/');
      return;
    }

    loadData();
  }, [activeTab, orderStatusFilter, orderDeliveryFilter, userSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await getDashboardStats();
        setStats(res.data);
      } else if (activeTab === 'products') {
        const [productsRes, citiesRes, districtsRes] = await Promise.all([
          getAdminProducts(),
          getAdminCities(),
          getAdminDistricts()
        ]);
        setProducts(productsRes.data.products);
        setAllCities(citiesRes.data);
        setAllDistricts(districtsRes.data);
      } else if (activeTab === 'orders') {
        const res = await getAdminOrders(orderStatusFilter, orderDeliveryFilter);
        setOrders(res.data.orders);
      } else if (activeTab === 'users') {
        const res = await getAdminUsers(userSearch);
        setUsers(res.data.users);
      } else if (activeTab === 'chat') {
        const [convRes, unreadRes] = await Promise.all([
          getChatConversations(),
          getUnreadChatCount()
        ]);
        setConversations(convRes.data.conversations);
        setChatUnreadCount(unreadRes.data.unreadCount);
      } else if (activeTab === 'promos') {
        const res = await getAdminPromoCodes();
        setPromoCodes(res.data.promoCodes || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...productForm,
          price: parseFloat(productForm.price),
          is_active: editingProduct.is_active,
        });
      } else {
        await createProduct({
          ...productForm,
          price: parseFloat(productForm.price),
        });
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        currency: 'EUR',
        picture_link: '',
        quantity: 1,
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      currency: product.currency,
      picture_link: product.picture_link,
      quantity: product.quantity,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleManageLocations = async (productId: string) => {
    try {
      setSelectedProductForLocations(productId);

      // Load existing product locations
      const citiesRes = await getProductAvailableCities(productId);
      const activeCities = citiesRes.data.filter((c: any) => c.is_active).map((c: any) => c.id);
      setProductSelectedCities(activeCities);

      // Load districts for each active city
      const allProductDistricts = [];
      for (const cityId of activeCities) {
        const districtsRes = await getProductAvailableDistricts(productId, cityId);
        const activeDistricts = districtsRes.data
          .filter((d: any) => d.is_active)
          .map((d: any) => ({ cityId, districtId: d.id }));
        allProductDistricts.push(...activeDistricts);
      }
      setProductSelectedDistricts(allProductDistricts);
    } catch (error) {
      console.error('Error loading product locations:', error);
    }
  };

  const handleToggleCity = (cityId: string) => {
    if (productSelectedCities.includes(cityId)) {
      // Remove city and its districts
      setProductSelectedCities(productSelectedCities.filter(id => id !== cityId));
      setProductSelectedDistricts(productSelectedDistricts.filter(d => d.cityId !== cityId));
    } else {
      // Add city
      setProductSelectedCities([...productSelectedCities, cityId]);
    }
  };

  const handleToggleDistrict = (cityId: string, districtId: string) => {
    const exists = productSelectedDistricts.some(
      d => d.cityId === cityId && d.districtId === districtId
    );

    if (exists) {
      setProductSelectedDistricts(
        productSelectedDistricts.filter(
          d => !(d.cityId === cityId && d.districtId === districtId)
        )
      );
    } else {
      setProductSelectedDistricts([
        ...productSelectedDistricts,
        { cityId, districtId }
      ]);
    }
  };

  const handleSaveLocations = async () => {
    if (!selectedProductForLocations) return;

    try {
      await bulkUpdateProductLocations(
        selectedProductForLocations,
        productSelectedCities,
        productSelectedDistricts
      );

      alert('Product locations updated successfully!');
      setSelectedProductForLocations(null);
      setProductSelectedCities([]);
      setProductSelectedDistricts([]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update locations');
    }
  };

  // Price tier functions - DISABLED (will be replaced with variants system)
  // const handleManagePriceTiers = async (productId: string) => {
  //   try {
  //     setSelectedProductForPriceTiers(productId);
  //     const res = await getProductPriceTiers(productId);
  //     setPriceTiers(res.data.priceTiers || []);
  //   } catch (error) {
  //     console.error('Error loading price tiers:', error);
  //     setPriceTiers([]);
  //   }
  // };

  // const handlePriceTierSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!selectedProductForPriceTiers) return;

  //   try {
  //     const quantity = parseInt(priceTierForm.quantity);
  //     const price = parseFloat(priceTierForm.price);

  //     if (editingPriceTier) {
  //       await updatePriceTier(editingPriceTier.id, quantity, price);
  //     } else {
  //       await createPriceTier(selectedProductForPriceTiers, quantity, price);
  //     }

  //     // Reload price tiers
  //     const res = await getProductPriceTiers(selectedProductForPriceTiers);
  //     setPriceTiers(res.data.priceTiers || []);

  //     // Reset form
  //     setShowPriceTierForm(false);
  //     setEditingPriceTier(null);
  //     setPriceTierForm({ quantity: '', price: '' });
  //   } catch (error: any) {
  //     alert(error.response?.data?.error || 'Failed to save price tier');
  //   }
  // };

  // const handleEditPriceTier = (tier: any) => {
  //   setEditingPriceTier(tier);
  //   setPriceTierForm({
  //     quantity: tier.quantity.toString(),
  //     price: tier.price.toString(),
  //   });
  //   setShowPriceTierForm(true);
  // };

  // const handleDeletePriceTier = async (tierId: string) => {
  //   if (!confirm('Are you sure you want to delete this price tier?')) return;

  //   try {
  //     await deletePriceTier(tierId);

  //     // Reload price tiers
  //     if (selectedProductForPriceTiers) {
  //       const res = await getProductPriceTiers(selectedProductForPriceTiers);
  //       setPriceTiers(res.data.priceTiers || []);
  //     }
  //   } catch (error: any) {
  //     alert(error.response?.data?.error || 'Failed to delete price tier');
  //   }
  // };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update order');
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDeliveryInfo(
        deliveryForm.orderId,
        deliveryForm.delivery_map_link,
        deliveryForm.delivery_image_link
      );
      setShowDeliveryForm(false);
      setDeliveryForm({
        orderId: '',
        delivery_map_link: '',
        delivery_image_link: '',
      });
      loadData();
      alert('Delivery info sent successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update delivery');
    }
  };

  const handleShowDeliveryForm = (order: Order) => {
    setDeliveryForm({
      orderId: order.id,
      delivery_map_link: '',
      delivery_image_link: '',
    });
    setShowDeliveryForm(true);
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!confirm(`${isAdmin ? 'Remove' : 'Grant'} admin privileges?`)) return;

    try {
      await updateUserAdmin(userId, isAdmin);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) return;

    try {
      await deleteUser(userId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    const hoursStr = prompt(`Ban user @${username} for how many hours?`, '24');
    if (!hoursStr) return;

    const hours = parseInt(hoursStr);
    if (isNaN(hours) || hours <= 0) {
      alert('Invalid number of hours');
      return;
    }

    try {
      await banUser(userId, hours);
      loadData();
      alert(`User @${username} has been banned for ${hours} hours`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!confirm(`Unban user @${username}?`)) return;

    try {
      await unbanUser(userId);
      loadData();
      alert(`User @${username} has been unbanned`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unban user');
    }
  };

  // Chat handlers
  const handleSelectConversation = async (userId: string) => {
    setSelectedConversation(userId);
    try {
      const res = await getChatMessages(userId);
      setChatMessages(res.data.messages);
      // Mark as read
      await markChatAsRead(userId);
      // Reload conversations to update unread count
      loadData();
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedConversation) return;

    try {
      await sendChatMessage(newChatMessage, selectedConversation);
      setNewChatMessage('');
      // Reload conversation
      const res = await getChatMessages(selectedConversation);
      setChatMessages(res.data.messages);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  // Promo code handlers
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promoData = {
        code: promoForm.code.toUpperCase(),
        discount_type: promoForm.discount_type,
        discount_value: parseFloat(promoForm.discount_value),
        max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : undefined,
        valid_until: promoForm.valid_until || undefined,
        min_order_amount: promoForm.min_order_amount ? parseFloat(promoForm.min_order_amount) : undefined,
      };

      if (editingPromo) {
        await updatePromoCode(editingPromo.id, promoData);
      } else {
        await createPromoCode(promoData);
      }

      setShowPromoForm(false);
      setEditingPromo(null);
      setPromoForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        valid_until: '',
        min_order_amount: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save promo code');
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      max_uses: promo.max_uses?.toString() || '',
      valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : '',
      min_order_amount: promo.min_order_amount.toString(),
    });
    setShowPromoForm(true);
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await deletePromoCode(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete promo code');
    }
  };

  const handleTogglePromo = async (promo: PromoCode) => {
    try {
      await updatePromoCode(promo.id, { is_active: !promo.is_active });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update promo code');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden cyber-card m-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold neon-glow">[ ADMIN ]</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cyber-button"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mt-4 space-y-2">
            {(['dashboard', 'products', 'orders', 'users', 'chat', 'settings'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 font-bold uppercase transition-all ${
                  activeTab === tab
                    ? 'bg-neon-green text-cyber-dark'
                    : 'text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={() => router.push('/')}
              className="w-full cyber-button"
            >
              🏠 Shop
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="w-full cyber-button"
            >
              👤 Profile
            </button>
          </div>
        )}
      </header>

      {/* Desktop Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block lg:w-64 cyber-card m-4 lg:sticky lg:top-4 lg:h-screen overflow-y-auto">
          <h1 className="text-3xl font-bold neon-glow mb-6">[ ADMIN ]</h1>

          <nav className="space-y-2 mb-6">
            {(['dashboard', 'products', 'orders', 'users', 'chat', 'promos', 'settings'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full px-4 py-3 font-bold uppercase transition-all text-left relative ${
                  activeTab === tab
                    ? 'bg-neon-green text-cyber-dark'
                    : 'text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {tab === 'dashboard' && '📊 '}
                {tab === 'products' && '📦 '}
                {tab === 'orders' && '🛒 '}
                {tab === 'users' && '👥 '}
                {tab === 'chat' && '💬 '}
                {tab === 'promos' && '🎟️ '}
                {tab === 'settings' && '⚙️ '}
                {tab}
                {tab === 'chat' && chatUnreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {chatUnreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="space-y-2 border-t border-neon-green/30 pt-4">
            <button
              onClick={() => router.push('/')}
              className="w-full cyber-button text-sm"
            >
              🏠 Shop
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="w-full cyber-button text-sm"
            >
              👤 Profile
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="text-center mt-20">
              <div className="loading mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && stats && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 neon-glow hidden lg:block">
                    Dashboard
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    <div className="cyber-card">
                      <h3 className="text-neon-cyan mb-2 text-sm">Total Users</h3>
                      <p className="text-3xl font-bold text-neon-green">
                        {stats.stats.totalUsers}
                      </p>
                    </div>
                    <div className="cyber-card">
                      <h3 className="text-neon-cyan mb-2 text-sm">Total Products</h3>
                      <p className="text-3xl font-bold text-neon-green">
                        {stats.stats.totalProducts}
                      </p>
                    </div>
                    <div className="cyber-card">
                      <h3 className="text-neon-cyan mb-2 text-sm">Total Orders</h3>
                      <p className="text-3xl font-bold text-neon-green">
                        {stats.stats.totalOrders}
                      </p>
                    </div>
                    <div className="cyber-card">
                      <h3 className="text-neon-cyan mb-2 text-sm">Total Revenue</h3>
                      <p className="text-3xl font-bold text-neon-green">
                        €{stats.stats.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="cyber-card">
                      <h3 className="text-neon-cyan mb-2 text-sm">Pending Deliveries</h3>
                      <p className="text-3xl font-bold text-yellow-500">
                        {stats.stats.pendingDeliveries}
                      </p>
                    </div>
                  </div>

                  <div className="cyber-card">
                    <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                      Recent Orders
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neon-green">
                            <th className="text-left p-2 text-neon-cyan">Order ID</th>
                            <th className="text-left p-2 text-neon-cyan">User</th>
                            <th className="text-left p-2 text-neon-cyan">Amount</th>
                            <th className="text-left p-2 text-neon-cyan">Status</th>
                            <th className="text-left p-2 text-neon-cyan">Delivery</th>
                            <th className="text-left p-2 text-neon-cyan">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders.map((order: any) => (
                            <tr key={order.id} className="border-b border-neon-green/30">
                              <td className="p-2">{order.id.slice(0, 8)}</td>
                              <td className="p-2">@{order.username}</td>
                              <td className="p-2">
                                €{order.total_amount}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`font-bold ${
                                    order.status === 'paid'
                                      ? 'text-neon-green'
                                      : order.status === 'pending'
                                      ? 'text-yellow-500'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-2">
                                <span
                                  className={`font-bold ${
                                    order.delivery_status === 'delivered'
                                      ? 'text-neon-green'
                                      : 'text-yellow-500'
                                  }`}
                                >
                                  {order.delivery_status}
                                </span>
                              </td>
                              <td className="p-2">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Products */}
              {activeTab === 'products' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold neon-glow hidden lg:block">
                      Products
                    </h2>
                    <button
                      onClick={() => {
                        setShowProductForm(!showProductForm);
                        setEditingProduct(null);
                        setProductForm({
                          name: '',
                          description: '',
                          price: '',
                          currency: 'EUR',
                          picture_link: '',
                          quantity: 1,
                        });
                      }}
                      className="cyber-button"
                    >
                      {showProductForm ? 'Cancel' : '+ Add Product'}
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="cyber-card mb-6">
                      <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                        {editingProduct ? 'Edit Product' : 'Create New Product'}
                      </h2>
                      <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-neon-cyan">
                              Product Name *
                            </label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={(e) =>
                                setProductForm({ ...productForm, name: e.target.value })
                              }
                              className="cyber-input"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block mb-2 text-neon-cyan">
                                Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={productForm.price}
                                onChange={(e) =>
                                  setProductForm({
                                    ...productForm,
                                    price: e.target.value,
                                  })
                                }
                                className="cyber-input"
                                required
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-neon-cyan">
                                Currency
                              </label>
                              <select
                                value={productForm.currency}
                                onChange={(e) =>
                                  setProductForm({
                                    ...productForm,
                                    currency: e.target.value,
                                  })
                                }
                                className="cyber-input"
                              >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="BTC">BTC</option>
                                <option value="ETH">ETH</option>
                              </select>
                            </div>
                            <div>
                              <label className="block mb-2 text-neon-cyan">
                                Quantity *
                              </label>
                              <select
                                value={productForm.quantity}
                                onChange={(e) =>
                                  setProductForm({
                                    ...productForm,
                                    quantity: parseInt(e.target.value),
                                  })
                                }
                                className="cyber-input"
                                required
                              >
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-neon-cyan">
                            Description
                          </label>
                          <textarea
                            value={productForm.description}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                description: e.target.value,
                              })
                            }
                            className="cyber-input"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-neon-cyan">
                            Picture Link (200x200) *
                          </label>
                          <input
                            type="url"
                            value={productForm.picture_link}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                picture_link: e.target.value,
                              })
                            }
                            className="cyber-input"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                          {productForm.picture_link && (
                            <div className="mt-2">
                              <img
                                src={productForm.picture_link}
                                alt="Preview"
                                className="w-32 h-32 object-cover border border-neon-green"
                              />
                            </div>
                          )}
                        </div>

                        <button type="submit" className="cyber-button w-full">
                          {editingProduct ? 'Update Product' : 'Create Product'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Location Manager */}
                  {selectedProductForLocations && (
                    <div className="cyber-card mb-6 border-2 border-neon-green">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-neon-cyan">
                          Manage Delivery Locations
                        </h2>
                        <button
                          onClick={() => {
                            setSelectedProductForLocations(null);
                            setProductSelectedCities([]);
                            setProductSelectedDistricts([]);
                          }}
                          className="text-red-500 hover:underline"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <p className="text-sm text-neon-cyan mb-4">
                        Select which cities and districts this product is available for delivery.
                      </p>

                      <div className="space-y-4">
                        {allCities.filter(c => c.is_active).map((city) => (
                          <div key={city.id} className="border border-neon-green/30 rounded p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <input
                                type="checkbox"
                                id={`city-${city.id}`}
                                checked={productSelectedCities.includes(city.id)}
                                onChange={() => handleToggleCity(city.id)}
                                className="w-5 h-5 accent-neon-green"
                              />
                              <label
                                htmlFor={`city-${city.id}`}
                                className="text-lg font-bold text-neon-green cursor-pointer"
                              >
                                {city.name}
                              </label>
                            </div>

                            {productSelectedCities.includes(city.id) && (
                              <div className="ml-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {allDistricts
                                  .filter(d => d.city_id === city.id && d.is_active)
                                  .map((district) => (
                                    <div key={district.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`district-${district.id}`}
                                        checked={productSelectedDistricts.some(
                                          d => d.cityId === city.id && d.districtId === district.id
                                        )}
                                        onChange={() => handleToggleDistrict(city.id, district.id)}
                                        className="w-4 h-4 accent-neon-cyan"
                                      />
                                      <label
                                        htmlFor={`district-${district.id}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        {district.name}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex gap-4">
                        <button
                          onClick={handleSaveLocations}
                          className="cyber-button flex-1"
                        >
                          💾 Save Locations
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProductForLocations(null);
                            setProductSelectedCities([]);
                            setProductSelectedDistricts([]);
                          }}
                          className="cyber-button flex-1 bg-red-500/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Price Tiers Manager removed - will be replaced with variants system in Етап 4 */}

                  <div className="cyber-card">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                      All Products ({products.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neon-green">
                            <th className="text-left p-2 text-neon-cyan">Picture</th>
                            <th className="text-left p-2 text-neon-cyan">Name</th>
                            <th className="text-left p-2 text-neon-cyan">Price</th>
                            <th className="text-left p-2 text-neon-cyan">Qty</th>
                            <th className="text-left p-2 text-neon-cyan">Status</th>
                            <th className="text-left p-2 text-neon-cyan">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr
                              key={product.id}
                              className="border-b border-neon-green/30"
                            >
                              <td className="p-2">
                                <img
                                  src={product.picture_link}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover border border-neon-green"
                                />
                              </td>
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">
                                €{product.price}
                              </td>
                              <td className="p-2">{product.quantity}</td>
                              <td className="p-2">
                                <span
                                  className={
                                    product.is_active
                                      ? 'text-neon-green'
                                      : 'text-red-500'
                                  }
                                >
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="text-neon-cyan hover:underline text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleManageLocations(product.id)}
                                    className="text-neon-green hover:underline text-sm"
                                  >
                                    Locations
                                  </button>
                                  {/* Price Tiers button - DISABLED
                                  <button
                                    onClick={() => handleManagePriceTiers(product.id)}
                                    className="text-yellow-500 hover:underline text-sm"
                                  >
                                    Price Tiers
                                  </button>
                                  */}
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-500 hover:underline text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 neon-glow hidden lg:block">
                    Orders
                  </h2>

                  {/* Filters */}
                  <div className="cyber-card mb-6">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-neon-cyan text-sm">
                          Payment Status
                        </label>
                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                          className="cyber-input"
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-neon-cyan text-sm">
                          Delivery Status
                        </label>
                        <select
                          value={orderDeliveryFilter}
                          onChange={(e) => setOrderDeliveryFilter(e.target.value)}
                          className="cyber-input"
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Form Modal */}
                  {showDeliveryForm && (
                    <div className="cyber-card mb-6 border-2 border-neon-green">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Add Delivery Info - Order #{deliveryForm.orderId.slice(0, 8)}
                      </h3>
                      <form onSubmit={handleDeliverySubmit} className="space-y-4">
                        <div>
                          <label className="block mb-2 text-neon-cyan">
                            Map Link (Link 1) *
                          </label>
                          <input
                            type="url"
                            value={deliveryForm.delivery_map_link}
                            onChange={(e) =>
                              setDeliveryForm({
                                ...deliveryForm,
                                delivery_map_link: e.target.value,
                              })
                            }
                            className="cyber-input"
                            placeholder="https://maps.google.com/..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-neon-cyan">
                            Image Link (Link 2) *
                          </label>
                          <input
                            type="url"
                            value={deliveryForm.delivery_image_link}
                            onChange={(e) =>
                              setDeliveryForm({
                                ...deliveryForm,
                                delivery_image_link: e.target.value,
                              })
                            }
                            className="cyber-input"
                            placeholder="https://example.com/delivery.jpg"
                            required
                          />
                        </div>
                        <div className="flex gap-4">
                          <button type="submit" className="cyber-button flex-1">
                            ✉️ Изпрати!
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeliveryForm(false)}
                            className="cyber-button flex-1 bg-red-500/20"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Orders List */}
                  <div className="cyber-card">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                      All Orders ({orders.length})
                    </h3>
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-neon-green/30 rounded p-4 space-y-3"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <span className="text-neon-cyan font-bold">
                                Order #{order.id.slice(0, 8)}
                              </span>
                              <span className="ml-4 text-neon-green">
                                @{order.username}
                              </span>
                              {order.telegram && (
                                <span className="ml-2 text-sm text-neon-cyan">
                                  ({order.telegram})
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(order.id, e.target.value)
                                }
                                className="cyber-input w-32 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-neon-cyan">Total:</span>{' '}
                              €{order.total_amount}
                            </div>
                            <div>
                              <span className="text-neon-cyan">Date:</span>{' '}
                              {new Date(order.created_at).toLocaleString()}
                            </div>
                            <div>
                              <span className="text-neon-cyan">Payment:</span>{' '}
                              <span
                                className={`font-bold ${
                                  order.status === 'paid'
                                    ? 'text-neon-green'
                                    : order.status === 'pending'
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-neon-cyan">Delivery:</span>{' '}
                              <span
                                className={`font-bold ${
                                  order.delivery_status === 'delivered'
                                    ? 'text-neon-green'
                                    : 'text-yellow-500'
                                }`}
                              >
                                {order.delivery_status}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-neon-cyan text-sm">Items:</span>
                            <div className="mt-2 space-y-1">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  {item.product_picture && (
                                    <img
                                      src={item.product_picture}
                                      alt={item.product_name}
                                      className="w-8 h-8 object-cover border border-neon-green"
                                    />
                                  )}
                                  <span>
                                    {item.product_name} x{item.quantity} (€{item.product_price})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.status === 'paid' && order.delivery_status === 'pending' && (
                            <button
                              onClick={() => handleShowDeliveryForm(order)}
                              className="cyber-button w-full"
                            >
                              📦 Add Delivery Info
                            </button>
                          )}

                          {order.delivery_status === 'delivered' && order.items[0]?.delivery_map_link && (
                            <div className="bg-neon-green/10 p-3 rounded text-sm space-y-1">
                              <div className="text-neon-green font-bold">✓ Delivered</div>
                              <div>
                                <a
                                  href={order.items[0].delivery_map_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neon-cyan hover:underline"
                                >
                                  📍 View Map
                                </a>
                              </div>
                              <div>
                                <a
                                  href={order.items[0].delivery_image_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neon-cyan hover:underline"
                                >
                                  📷 View Image
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 neon-glow hidden lg:block">
                    Users
                  </h2>

                  {/* Search */}
                  <div className="cyber-card mb-6">
                    <label className="block mb-2 text-neon-cyan">
                      Search Users
                    </label>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="cyber-input"
                      placeholder="Search by username..."
                    />
                  </div>

                  <div className="cyber-card">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                      All Users ({users.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neon-green">
                            <th className="text-left p-2 text-neon-cyan">Username</th>
                            <th className="text-left p-2 text-neon-cyan">Telegram</th>
                            <th className="text-left p-2 text-neon-cyan">Role</th>
                            <th className="text-left p-2 text-neon-cyan">Status</th>
                            <th className="text-left p-2 text-neon-cyan">Orders</th>
                            <th className="text-left p-2 text-neon-cyan">Total Spent</th>
                            <th className="text-left p-2 text-neon-cyan">Joined</th>
                            <th className="text-left p-2 text-neon-cyan">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => {
                            const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                            return (
                              <tr key={user.id} className="border-b border-neon-green/30">
                                <td className="p-2">@{user.username}</td>
                                <td className="p-2">{user.telegram || '-'}</td>
                                <td className="p-2">
                                  <span
                                    className={
                                      user.is_admin ? 'text-red-500' : 'text-neon-green'
                                    }
                                  >
                                    {user.is_admin ? 'ADMIN' : 'USER'}
                                  </span>
                                </td>
                                <td className="p-2">
                                  {isBanned ? (
                                    <span className="badge-danger">
                                      🚫 BANNED
                                    </span>
                                  ) : (
                                    <span className="badge-success">
                                      ✓ Active
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">{user.total_orders}</td>
                                <td className="p-2">€{parseFloat(user.total_spent.toString()).toFixed(2)}</td>
                                <td className="p-2">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() =>
                                        handleToggleAdmin(user.id, !user.is_admin)
                                      }
                                      className="text-neon-cyan hover:underline text-sm"
                                    >
                                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                    {isBanned ? (
                                      <button
                                        onClick={() => handleUnbanUser(user.id, user.username)}
                                        className="text-neon-green hover:underline text-sm"
                                      >
                                        Unban
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleBanUser(user.id, user.username)}
                                        className="text-yellow-500 hover:underline text-sm"
                                      >
                                        Ban
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.username)}
                                      className="text-red-500 hover:underline text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat */}
              {activeTab === 'chat' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 neon-glow hidden lg:block">
                    User Messages
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Conversations ({conversations.length})
                      </h3>
                      <div className="space-y-2">
                        {conversations.length === 0 ? (
                          <div className="text-center text-neon-cyan/60 py-8 text-sm">
                            No conversations yet
                          </div>
                        ) : (
                          conversations.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => handleSelectConversation(conv.id)}
                              className={`w-full text-left p-3 rounded border transition-all ${
                                selectedConversation === conv.id
                                  ? 'bg-neon-green/20 border-neon-green'
                                  : 'bg-neon-cyan/10 border-neon-cyan/30 hover:border-neon-cyan'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-neon-green">
                                  @{conv.username}
                                </span>
                                {conv.unread_count > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                              {conv.telegram && (
                                <div className="text-xs text-neon-cyan/60 mb-1">
                                  {conv.telegram}
                                </div>
                              )}
                              <div className="text-sm text-neon-cyan/80 truncate">
                                {conv.last_message}
                              </div>
                              <div className="text-xs text-neon-cyan/60 mt-1">
                                {new Date(conv.last_message_at).toLocaleString()}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="lg:col-span-2">
                      {selectedConversation ? (
                        <div className="cyber-card">
                          <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                            Chat with @
                            {conversations.find((c) => c.id === selectedConversation)?.username}
                          </h3>

                          {/* Messages */}
                          <div className="border border-neon-green/30 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
                            {chatMessages.length === 0 ? (
                              <div className="text-center text-neon-cyan/60 py-8">
                                No messages in this conversation
                              </div>
                            ) : (
                              chatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`${
                                    msg.sender_type === 'admin' ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  <div
                                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                                      msg.sender_type === 'admin'
                                        ? 'bg-neon-green/20 border border-neon-green'
                                        : 'bg-neon-cyan/20 border border-neon-cyan'
                                    }`}
                                  >
                                    <div className="text-xs text-neon-cyan mb-1">
                                      {msg.sender_type === 'admin' ? 'You (Admin)' : 'User'}
                                    </div>
                                    <div className="break-words">{msg.message}</div>
                                    <div className="text-xs text-neon-cyan/60 mt-1">
                                      {new Date(msg.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Send Message Form */}
                          <form onSubmit={handleSendChatMessage} className="space-y-3">
                            <textarea
                              value={newChatMessage}
                              onChange={(e) => setNewChatMessage(e.target.value)}
                              placeholder="Type your message to user..."
                              className="cyber-input resize-none"
                              rows={3}
                            />
                            <button
                              type="submit"
                              disabled={!newChatMessage.trim()}
                              className="cyber-button w-full"
                            >
                              📤 Send Message
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="cyber-card">
                          <div className="text-center text-neon-cyan/60 py-20">
                            Select a conversation from the list to start chatting
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Promo Codes */}
              {activeTab === 'promos' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold neon-glow hidden lg:block">
                      Promo Codes
                    </h2>
                    <button
                      onClick={() => setShowPromoForm(true)}
                      className="cyber-button"
                    >
                      + Create Promo Code
                    </button>
                  </div>

                  {/* Promo Form Modal */}
                  {showPromoForm && (
                    <div className="cyber-card mb-6">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
                      </h3>
                      <form onSubmit={handlePromoSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Code: *
                            </span>
                            <input
                              type="text"
                              value={promoForm.code}
                              onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                              className="cyber-input w-full font-mono"
                              placeholder="SUMMER2024"
                              required
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Discount Type: *
                            </span>
                            <select
                              value={promoForm.discount_type}
                              onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                              className="cyber-input w-full"
                              required
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount (€)</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Discount Value: *
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={promoForm.discount_value}
                              onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                              className="cyber-input w-full"
                              placeholder={promoForm.discount_type === 'percentage' ? '10' : '5.00'}
                              required
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Max Uses (optional):
                            </span>
                            <input
                              type="number"
                              value={promoForm.max_uses}
                              onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                              className="cyber-input w-full"
                              placeholder="Leave empty for unlimited"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Valid Until (optional):
                            </span>
                            <input
                              type="date"
                              value={promoForm.valid_until}
                              onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                              className="cyber-input w-full"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm text-neon-cyan mb-1 block">
                              Min Order Amount (€):
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={promoForm.min_order_amount}
                              onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: e.target.value })}
                              className="cyber-input w-full"
                              placeholder="0.00"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button type="submit" className="cyber-button flex-1">
                            {editingPromo ? 'Update' : 'Create'} Promo Code
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPromoForm(false);
                              setEditingPromo(null);
                              setPromoForm({
                                code: '',
                                discount_type: 'percentage',
                                discount_value: '',
                                max_uses: '',
                                valid_until: '',
                                min_order_amount: '',
                              });
                            }}
                            className="cyber-button flex-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Promo Codes List */}
                  <div className="cyber-card">
                    {promoCodes.length === 0 ? (
                      <div className="text-center text-neon-cyan/60 py-12">
                        No promo codes yet. Create one to get started!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-neon-green/30">
                              <th className="text-left p-3 text-neon-cyan">Code</th>
                              <th className="text-left p-3 text-neon-cyan">Discount</th>
                              <th className="text-left p-3 text-neon-cyan">Usage</th>
                              <th className="text-left p-3 text-neon-cyan">Valid Until</th>
                              <th className="text-left p-3 text-neon-cyan">Status</th>
                              <th className="text-left p-3 text-neon-cyan">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promoCodes.map((promo) => (
                              <tr key={promo.id} className="border-b border-neon-green/10">
                                <td className="p-3 font-mono font-bold text-neon-green">
                                  {promo.code}
                                </td>
                                <td className="p-3">
                                  {promo.discount_type === 'percentage'
                                    ? `${promo.discount_value}%`
                                    : `€${promo.discount_value}`}
                                </td>
                                <td className="p-3">
                                  {promo.current_uses}
                                  {promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                                </td>
                                <td className="p-3">
                                  {promo.valid_until
                                    ? new Date(promo.valid_until).toLocaleDateString()
                                    : 'No expiry'}
                                </td>
                                <td className="p-3">
                                  <span className={`badge-${promo.is_active ? 'success' : 'danger'}`}>
                                    {promo.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleTogglePromo(promo)}
                                      className="text-xs cyber-button px-2 py-1"
                                    >
                                      {promo.is_active ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                      onClick={() => handleEditPromo(promo)}
                                      className="text-xs cyber-button px-2 py-1"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeletePromo(promo.id)}
                                      className="text-xs cyber-button px-2 py-1"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 neon-glow hidden lg:block">
                    Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        System Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-neon-cyan">Platform:</span>{' '}
                          <span className="text-neon-green">CryptoShop v2.0</span>
                        </div>
                        <div>
                          <span className="text-neon-cyan">Database:</span>{' '}
                          <span className="text-neon-green">✓ Connected (PostgreSQL)</span>
                        </div>
                        <div>
                          <span className="text-neon-cyan">Payment Gateway:</span>{' '}
                          <span className="text-neon-green">OxaPay API v1</span>
                        </div>
                        <div>
                          <span className="text-neon-cyan">Default Currency:</span>{' '}
                          <span className="text-neon-green">EUR (€)</span>
                        </div>
                      </div>
                    </div>

                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Environment Variables
                      </h3>
                      <p className="text-sm mb-3 text-neon-cyan">
                        Configure your backend .env file with:
                      </p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>• OXAPAY_API_KEY (OxaPay merchant API key)</li>
                        <li>• DATABASE_URL (PostgreSQL connection string)</li>
                        <li>• JWT_SECRET (Secret for JWT tokens)</li>
                        <li>• PORT (Default: 3001)</li>
                      </ul>
                    </div>

                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Webhook Configuration
                      </h3>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="text-neon-cyan">OxaPay Webhook URL:</span>
                        </div>
                        <code className="block p-2 bg-neon-green/10 text-neon-green rounded">
                          {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhook/oxapay
                        </code>
                        <p className="text-neon-cyan">
                          Add this URL to your OxaPay dashboard for payment notifications.
                        </p>
                      </div>
                    </div>

                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Security Checklist
                      </h3>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>JWT authentication enabled</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>Password hashing with bcrypt</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>CORS protection configured</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>Admin-only routes protected</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>OxaPay HMAC signature verification</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-neon-green">✓</span>
                          <span>Delivery info only visible after admin confirmation</span>
                        </li>
                      </ul>
                    </div>

                    <div className="cyber-card">
                      <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                        Database Management
                      </h3>
                      <div className="text-sm space-y-2">
                        <p className="text-neon-cyan">To run migrations:</p>
                        <code className="block p-2 bg-neon-green/10 text-neon-green rounded">
                          psql -U your_user -d your_db -f database/migration_v2.sql
                        </code>
                        <p className="text-neon-cyan mt-4">To backup database:</p>
                        <code className="block p-2 bg-neon-green/10 text-neon-green rounded">
                          pg_dump -U your_user your_db {'>'} backup.sql
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
