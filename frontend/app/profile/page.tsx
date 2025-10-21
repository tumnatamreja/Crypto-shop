'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, getUserOrders } from '@/lib/api';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  items: Array<{
    product_name: string;
    product_price: number;
    quantity: number;
    map_link?: string;
    image_link?: string;
  }>;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        getProfile(),
        getUserOrders(),
      ]);
      setUser(profileRes.data.user);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error loading profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="cyber-card mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold neon-glow">[ PROFILE ]</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/')} className="cyber-button">
              Shop
            </button>
            {user?.is_admin && (
              <button
                onClick={() => router.push('/admin')}
                className="cyber-button"
              >
                Admin Panel
              </button>
            )}
            <button onClick={logout} className="cyber-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="cyber-card">
          <h2 className="text-2xl font-bold mb-4 text-neon-cyan">User Info</h2>
          <div className="space-y-2">
            <div>
              <span className="text-neon-cyan">Username:</span>{' '}
              <span className="text-neon-green font-bold">@{user?.username}</span>
            </div>
            {user?.telegram && (
              <div>
                <span className="text-neon-cyan">Telegram:</span>{' '}
                <span>{user.telegram}</span>
              </div>
            )}
            <div>
              <span className="text-neon-cyan">Role:</span>{' '}
              <span className={user?.is_admin ? 'text-red-500' : ''}>
                {user?.is_admin ? 'ADMIN' : 'USER'}
              </span>
            </div>
            <div>
              <span className="text-neon-cyan">Member since:</span>{' '}
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="cyber-card">
            <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
              Order History
            </h2>

            {orders.length === 0 ? (
              <div className="text-center text-neon-cyan/60 py-8">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-neon-green/30 rounded p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-neon-cyan">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span
                        className={`font-bold ${
                          order.status === 'paid'
                            ? 'text-neon-green'
                            : order.status === 'pending'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-neon-cyan">Date:</span>{' '}
                      {new Date(order.created_at).toLocaleString()}
                    </div>

                    <div className="mb-2">
                      <span className="text-neon-cyan">Total:</span>{' '}
                      <span className="font-bold">
                        {order.total_amount} {order.currency}
                      </span>
                    </div>

                    <div className="border-t border-neon-green/30 pt-2 mt-2">
                      <span className="text-neon-cyan font-bold">Items:</span>
                      <div className="space-y-2 mt-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="pl-4">
                            <div className="flex justify-between">
                              <span>
                                {item.product_name} x {item.quantity}
                              </span>
                              <span className="text-neon-green">
                                {item.product_price} {order.currency}
                              </span>
                            </div>

                            {/* Show links only for paid orders */}
                            {order.status === 'paid' &&
                              item.map_link &&
                              item.image_link && (
                                <div className="mt-2 space-y-1 text-sm">
                                  <div>
                                    <span className="text-neon-cyan">
                                      Map Link:
                                    </span>{' '}
                                    <a
                                      href={item.map_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-neon-green hover:underline"
                                    >
                                      {item.map_link}
                                    </a>
                                  </div>
                                  <div>
                                    <span className="text-neon-cyan">
                                      Image Link:
                                    </span>{' '}
                                    <a
                                      href={item.image_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-neon-green hover:underline"
                                    >
                                      {item.image_link}
                                    </a>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status === 'paid' && (
                      <div className="mt-3 p-2 bg-neon-green/10 border border-neon-green rounded">
                        <span className="text-neon-green text-sm">
                          ✓ Payment successful! Access links are shown above.
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
