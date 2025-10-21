'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, getUserOrders, getChatMessages, sendChatMessage, markChatAsRead, getUnreadChatCount, getReferralStats } from '@/lib/api';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  delivery_status: string;
  created_at: string;
  items: Array<{
    product_name: string;
    product_picture?: string;
    product_price: number;
    quantity: number;
    delivery_map_link?: string;
    delivery_image_link?: string;
    delivered_at?: string;
  }>;
}

interface ChatMessage {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Referral state
  const [referralCode, setReferralCode] = useState<string>('');
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProfile();
    loadChat();
    loadReferralStats();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadChat();
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const loadChat = async () => {
    try {
      const res = await getChatMessages();
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadChatCount();
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadReferralStats = async () => {
    try {
      const res = await getReferralStats();
      setReferralCode(res.data.referralCode || '');
      setTotalReferrals(res.data.totalReferrals || 0);
      setTotalEarnings(res.data.totalEarnings || 0);
      setReferrals(res.data.referrals || []);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setChatLoading(true);
    try {
      await sendChatMessage(newMessage);
      setNewMessage('');
      await loadChat();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenChat = async () => {
    setShowChat(true);
    // Mark messages as read when opening chat
    try {
      await markChatAsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking as read:', error);
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
    <div className="min-h-screen p-4 md:p-8">
      <header className="cyber-card mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold neon-glow">[ PROFILE ]</h1>
          <div className="flex gap-4 flex-wrap">
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
        <div className="cyber-card h-fit">
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

          {/* Ban Warning */}
          {user?.banned_until && new Date(user.banned_until) > new Date() && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <div className="text-red-500 font-bold mb-2 flex items-center gap-2">
                <span>🚫</span> ACCOUNT BANNED
              </div>
              <div className="text-sm text-red-400">
                Your account is temporarily banned for spam protection.
              </div>
              <div className="text-xs text-red-300 mt-2">
                Until: {new Date(user.banned_until).toLocaleString()}
              </div>
            </div>
          )}

          {/* Chat Toggle Button */}
          <button
            onClick={handleOpenChat}
            className="cyber-button w-full mt-6 relative"
          >
            💬 Chat with Admin
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Referral Program */}
        <div className="cyber-card h-fit">
          <h2 className="text-2xl font-bold mb-4 text-neon-cyan flex items-center gap-2">
            <span>🎁</span> Referral Program
          </h2>

          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neon-green/10 border border-neon-green rounded-lg">
                <div className="text-xs text-neon-cyan mb-1">Total Referrals</div>
                <div className="text-2xl font-bold text-neon-green">{totalReferrals}</div>
              </div>
              <div className="p-4 bg-neon-cyan/10 border border-neon-cyan rounded-lg">
                <div className="text-xs text-neon-cyan mb-1">Earnings</div>
                <div className="text-2xl font-bold text-neon-cyan">€{totalEarnings.toFixed(2)}</div>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-sm text-neon-cyan mb-2 block">Your Referral Code:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode || 'Generating...'}
                  readOnly
                  className="cyber-input flex-1 font-mono text-neon-green"
                />
                <button
                  onClick={copyReferralLink}
                  className="cyber-button px-4"
                  disabled={!referralCode}
                >
                  {copySuccess ? '✓' : '📋'}
                </button>
              </div>
              {copySuccess && (
                <div className="text-xs text-neon-green mt-1">Referral link copied!</div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg text-sm">
              <div className="text-neon-cyan font-bold mb-1">How it works:</div>
              <ul className="space-y-1 text-xs opacity-80">
                <li>• Share your referral link with friends</li>
                <li>• They register and make their first purchase</li>
                <li>• You earn 10% commission on their order</li>
              </ul>
            </div>

            {/* Referral History */}
            {referrals.length > 0 && (
              <div>
                <div className="text-sm text-neon-cyan font-bold mb-2">Recent Referrals:</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {referrals.slice(0, 5).map((ref) => (
                    <div
                      key={ref.id}
                      className="p-2 bg-neon-green/5 border border-neon-green/30 rounded text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-neon-cyan">@{ref.referred_username}</span>
                        <span className={`badge-${ref.status === 'active' ? 'success' : 'warning'}`}>
                          {ref.status}
                        </span>
                      </div>
                      {ref.reward_amount > 0 && (
                        <div className="text-neon-green mt-1">
                          Earned: €{parseFloat(ref.reward_amount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat (visible when showChat is true) */}
        {showChat && (
          <div className="cyber-card h-fit lg:sticky lg:top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-neon-cyan">Admin Chat</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-neon-cyan hover:text-neon-green"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="border border-neon-green/30 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-neon-cyan/60 py-8">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${
                      msg.sender_type === 'user'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${
                        msg.sender_type === 'user'
                          ? 'bg-neon-green/20 border border-neon-green'
                          : 'bg-neon-cyan/20 border border-neon-cyan'
                      }`}
                    >
                      <div className="text-xs text-neon-cyan mb-1">
                        {msg.sender_type === 'user' ? 'You' : 'Admin'}
                      </div>
                      <div className="break-words">{msg.message}</div>
                      <div className="text-xs text-neon-cyan/60 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="cyber-input resize-none"
                rows={3}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !newMessage.trim()}
                className="cyber-button w-full"
              >
                {chatLoading ? 'Sending...' : '📤 Send Message'}
              </button>
            </form>
          </div>
        )}

        {/* Orders */}
        <div className={showChat ? 'lg:col-span-1' : 'lg:col-span-2'}>
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
                        €{order.total_amount}
                      </span>
                    </div>

                    {order.status === 'paid' && order.delivery_status === 'pending' && (
                      <div className="mb-2 p-2 bg-yellow-500/20 border border-yellow-500 rounded">
                        <span className="text-yellow-500 text-sm">
                          ⏳ Waiting for delivery confirmation from admin...
                        </span>
                      </div>
                    )}

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
                                €{item.product_price}
                              </span>
                            </div>

                            {/* Show links only for delivered orders */}
                            {order.delivery_status === 'delivered' &&
                              item.delivery_map_link &&
                              item.delivery_image_link && (
                                <div className="mt-2 space-y-1 text-sm bg-neon-green/10 p-2 rounded">
                                  <div className="text-neon-green font-bold mb-1">
                                    ✓ Delivered {item.delivered_at && `on ${new Date(item.delivered_at).toLocaleDateString()}`}
                                  </div>
                                  <div>
                                    <a
                                      href={item.delivery_map_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-neon-cyan hover:underline block"
                                    >
                                      📍 View Map Link
                                    </a>
                                  </div>
                                  <div>
                                    <a
                                      href={item.delivery_image_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-neon-cyan hover:underline block"
                                    >
                                      📷 View Image Link
                                    </a>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status === 'paid' && order.delivery_status === 'delivered' && (
                      <div className="mt-3 p-2 bg-neon-green/10 border border-neon-green rounded">
                        <span className="text-neon-green text-sm">
                          ✓ Order completed! Delivery links are shown above.
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
