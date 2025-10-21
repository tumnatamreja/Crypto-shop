'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts, createCheckout } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_link: string;
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    setCart({ ...cart, [productId]: (cart[productId] || 0) + 1 });
  };

  const removeFromCart = (productId: string) => {
    if (cart[productId] > 1) {
      setCart({ ...cart, [productId]: cart[productId] - 1 });
    } else {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const items = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await createCheckout(items);
      window.location.href = response.data.paymentUrl;
    } catch (error: any) {
      alert(error.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const cartTotal = products
    .filter((p) => cart[p.id])
    .reduce((sum, p) => sum + p.price * cart[p.id], 0);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="cyber-card mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold neon-glow">[ CRYPTOSHOP ]</h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <span className="text-neon-cyan">
                  {user.is_admin && '[ADMIN] '}@{user.username}
                </span>
                {user.is_admin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="cyber-button"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={() => router.push('/profile')}
                  className="cyber-button"
                >
                  Profile
                </button>
                <button onClick={logout} className="cyber-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="cyber-button"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="cyber-button"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full text-center">
            <div className="loading mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center text-neon-cyan">
            No products available
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="cyber-card">
              <img
                src={product.image_link}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-4 border border-neon-green"
              />
              <h3 className="text-xl font-bold mb-2 text-neon-cyan">
                {product.name}
              </h3>
              <p className="text-sm mb-4 opacity-80">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold">
                  {product.price} {product.currency}
                </span>
              </div>
              <div className="flex gap-2">
                {cart[product.id] ? (
                  <>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="cyber-button flex-1"
                    >
                      -
                    </button>
                    <span className="flex items-center justify-center px-4 text-neon-cyan font-bold">
                      {cart[product.id]}
                    </span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="cyber-button flex-1"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => addToCart(product.id)}
                    className="cyber-button w-full"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 right-8 cyber-card max-w-md">
          <h3 className="text-xl font-bold mb-4 text-neon-cyan">
            Shopping Cart ({cartCount} items)
          </h3>
          <div className="space-y-2 mb-4">
            {products
              .filter((p) => cart[p.id])
              .map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>
                    {p.name} x {cart[p.id]}
                  </span>
                  <span className="text-neon-cyan">
                    {(p.price * cart[p.id]).toFixed(2)} {p.currency}
                  </span>
                </div>
              ))}
          </div>
          <div className="border-t border-neon-green pt-4 mb-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-neon-cyan">{cartTotal.toFixed(2)} USD</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="cyber-button w-full"
          >
            {checkoutLoading ? 'Processing...' : 'Checkout with Crypto'}
          </button>
        </div>
      )}
    </div>
  );
}
