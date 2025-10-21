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
  getAdminUsers,
  updateUserAdmin,
} from '@/lib/api';

type Tab = 'dashboard' | 'products' | 'orders' | 'users' | 'settings';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  map_link: string;
  image_link: string;
  is_active: boolean;
}

interface Order {
  id: string;
  username: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  items: any[];
}

interface User {
  id: string;
  username: string;
  telegram: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

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
    currency: 'USD',
    map_link: '',
    image_link: '',
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Users
  const [users, setUsers] = useState<User[]>([]);

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
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await getDashboardStats();
        setStats(res.data);
      } else if (activeTab === 'products') {
        const res = await getAdminProducts();
        setProducts(res.data.products);
      } else if (activeTab === 'orders') {
        const res = await getAdminOrders();
        setOrders(res.data.orders);
      } else if (activeTab === 'users') {
        const res = await getAdminUsers();
        setUsers(res.data.users);
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
        currency: 'USD',
        map_link: '',
        image_link: '',
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
      map_link: product.map_link,
      image_link: product.image_link,
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update order');
    }
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

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="cyber-card mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold neon-glow">[ ADMIN PANEL ]</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/')} className="cyber-button">
              Shop
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="cyber-button"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="cyber-card mb-8">
        <div className="flex gap-4 overflow-x-auto">
          {(['dashboard', 'products', 'orders', 'users', 'settings'] as Tab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-bold uppercase transition-all ${
                  activeTab === tab
                    ? 'bg-neon-green text-cyber-dark'
                    : 'text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center">
          <div className="loading mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Dashboard */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="cyber-card">
                  <h3 className="text-neon-cyan mb-2">Total Users</h3>
                  <p className="text-4xl font-bold text-neon-green">
                    {stats.stats.totalUsers}
                  </p>
                </div>
                <div className="cyber-card">
                  <h3 className="text-neon-cyan mb-2">Total Products</h3>
                  <p className="text-4xl font-bold text-neon-green">
                    {stats.stats.totalProducts}
                  </p>
                </div>
                <div className="cyber-card">
                  <h3 className="text-neon-cyan mb-2">Total Orders</h3>
                  <p className="text-4xl font-bold text-neon-green">
                    {stats.stats.totalOrders}
                  </p>
                </div>
                <div className="cyber-card">
                  <h3 className="text-neon-cyan mb-2">Total Revenue</h3>
                  <p className="text-4xl font-bold text-neon-green">
                    ${stats.stats.totalRevenue.toFixed(2)}
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
                        <th className="text-left p-2 text-neon-cyan">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order: any) => (
                        <tr key={order.id} className="border-b border-neon-green/30">
                          <td className="p-2">{order.id.slice(0, 8)}</td>
                          <td className="p-2">@{order.username}</td>
                          <td className="p-2">
                            {order.total_amount} {order.currency}
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
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowProductForm(!showProductForm);
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      description: '',
                      price: '',
                      currency: 'USD',
                      map_link: '',
                      image_link: '',
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

                      <div className="grid grid-cols-2 gap-4">
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
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
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
                        Map Link (Link 1) *
                      </label>
                      <input
                        type="url"
                        value={productForm.map_link}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            map_link: e.target.value,
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
                        value={productForm.image_link}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            image_link: e.target.value,
                          })
                        }
                        className="cyber-input"
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>

                    <button type="submit" className="cyber-button w-full">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </form>
                </div>
              )}

              <div className="cyber-card">
                <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                  Products ({products.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neon-green">
                        <th className="text-left p-2 text-neon-cyan">Name</th>
                        <th className="text-left p-2 text-neon-cyan">Price</th>
                        <th className="text-left p-2 text-neon-cyan">Description</th>
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
                          <td className="p-2">{product.name}</td>
                          <td className="p-2">
                            {product.price} {product.currency}
                          </td>
                          <td className="p-2 max-w-xs truncate">
                            {product.description || '-'}
                          </td>
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
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-neon-cyan hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-500 hover:underline"
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
            <div className="cyber-card">
              <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                All Orders ({orders.length})
              </h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-neon-green/30 rounded p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-neon-cyan">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className="ml-4 text-neon-green">
                          @{order.username}
                        </span>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order.id, e.target.value)
                        }
                        className="cyber-input w-32"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-neon-cyan">Total:</span>{' '}
                        {order.total_amount} {order.currency}
                      </div>
                      <div>
                        <span className="text-neon-cyan">Date:</span>{' '}
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-neon-cyan">Items:</span>{' '}
                        {order.items
                          .map((item) => `${item.product_name} x${item.quantity}`)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="cyber-card">
              <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                All Users ({users.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neon-green">
                      <th className="text-left p-2 text-neon-cyan">Username</th>
                      <th className="text-left p-2 text-neon-cyan">Telegram</th>
                      <th className="text-left p-2 text-neon-cyan">Role</th>
                      <th className="text-left p-2 text-neon-cyan">Joined</th>
                      <th className="text-left p-2 text-neon-cyan">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
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
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() =>
                              handleToggleAdmin(user.id, !user.is_admin)
                            }
                            className="text-neon-cyan hover:underline"
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="cyber-card">
              <h2 className="text-2xl font-bold mb-4 text-neon-cyan">Settings</h2>
              <div className="space-y-4">
                <div className="p-4 border border-neon-green/30 rounded">
                  <h3 className="text-neon-cyan font-bold mb-2">
                    Environment Variables
                  </h3>
                  <p className="text-sm mb-2">
                    Configure your backend .env file with:
                  </p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• OXAPAY_API_KEY</li>
                    <li>• OXAPAY_MERCHANT_ID</li>
                    <li>• DATABASE_URL</li>
                    <li>• JWT_SECRET</li>
                  </ul>
                </div>

                <div className="p-4 border border-neon-green/30 rounded">
                  <h3 className="text-neon-cyan font-bold mb-2">
                    Payment Provider
                  </h3>
                  <p className="text-sm">
                    Currently using: <span className="text-neon-green">OxaPay</span>
                  </p>
                  <p className="text-sm mt-2">
                    Webhook URL:{' '}
                    <code className="text-neon-green">
                      {process.env.NEXT_PUBLIC_API_URL}/api/webhook/oxapay
                    </code>
                  </p>
                </div>

                <div className="p-4 border border-neon-green/30 rounded">
                  <h3 className="text-neon-cyan font-bold mb-2">
                    Database Status
                  </h3>
                  <p className="text-neon-green">✓ Connected</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
