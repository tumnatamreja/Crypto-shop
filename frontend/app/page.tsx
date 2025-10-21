'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts, createCheckout, validatePromoCode, getProductPriceTiers } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  picture_link: string;
  quantity: number;
}

interface PriceTier {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

const CITIES = ['София', 'Пловдив'];
const DISTRICTS = {
  'Пловдив': ['Център', 'Каршияка', 'Мл. Хълм', 'Смирненски', 'Мараша'],
  'София': ['Дианабад', 'Младост 1', 'Студентски град', 'Белите брези', 'Стрелбище', 'Гоце Делчев', 'Бъкстон', 'Манастирски ливади', 'Борово', 'Красна поляна', 'Център']
};
const QUANTITY_OPTIONS = [1, 2, 3, 5, 10, 20];

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [priceTiers, setPriceTiers] = useState<{ [key: string]: PriceTier[] }>({});
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Order form fields
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);

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
      const productsData = response.data.products;
      setProducts(productsData);

      // Load price tiers for each product
      const tiersData: { [key: string]: PriceTier[] } = {};
      for (const product of productsData) {
        try {
          const tiersResponse = await getProductPriceTiers(product.id);
          tiersData[product.id] = tiersResponse.data.priceTiers || [];
        } catch (error) {
          console.error(`Error loading price tiers for ${product.id}:`, error);
          tiersData[product.id] = [];
        }
      }
      setPriceTiers(tiersData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCartQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: quantity });
    }
  };

  const getProductPrice = (productId: string, quantity: number): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const tiers = priceTiers[productId] || [];
    const tier = tiers.find(t => t.quantity === quantity);
    return tier ? parseFloat(tier.price.toString()) : parseFloat(product.price.toString());
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setDistrict(''); // Reset district when city changes
  };

  const handlePromoCodeValidation = async () => {
    if (!promoCode.trim()) {
      setPromoValid(null);
      setPromoDiscount(0);
      return;
    }

    try {
      const response = await validatePromoCode(promoCode, cartSubtotal);
      if (response.data.valid) {
        setPromoValid(true);
        setPromoDiscount(response.data.discountAmount);
      }
    } catch (error: any) {
      setPromoValid(false);
      setPromoDiscount(0);
      alert(error.response?.data?.error || 'Invalid promo code');
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

    if (!city || !district) {
      alert('Please select both city and district');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await createCheckout(items, city, district, promoCode || undefined);
      // Redirect to our white-label payment page instead of OxaPay
      router.push(`/payment/${response.data.orderId}`);
    } catch (error: any) {
      const errorData = error.response?.data;

      if (errorData?.banned) {
        // User is banned
        const remainingMinutes = errorData.remainingMinutes || 0;
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutes`;

        alert(
          `🚫 ACCOUNT TEMPORARILY BANNED\n\n` +
          `Your account has been temporarily banned for spam protection.\n\n` +
          `Remaining time: ${timeStr}\n\n` +
          `Reason: ${errorData.message || 'Too many orders in a short time'}`
        );
      } else if (errorData?.error === 'Active order exists') {
        // Already has pending order
        alert(
          `⚠️ ACTIVE ORDER EXISTS\n\n` +
          `You already have a pending order.\n` +
          `Please complete or wait for it to be processed before creating a new one.\n\n` +
          `Check your profile to view your active orders.`
        );
      } else {
        // Generic error
        alert(errorData?.message || errorData?.error || 'Checkout failed');
      }
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

  const cartSubtotal = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    return sum + getProductPrice(productId, quantity) * quantity;
  }, 0);

  const cartTotal = cartSubtotal - promoDiscount;
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
          products.map((product) => {
            const currentQuantity = cart[product.id] || 0;
            const currentPrice = currentQuantity > 0 ? getProductPrice(product.id, currentQuantity) : product.price;

            return (
              <div key={product.id} className="product-card">
                <img
                  src={product.picture_link}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-neon-cyan">
                    {product.name}
                  </h3>
                  <p className="text-sm mb-4 opacity-80">{product.description}</p>

                  <div className="mb-4">
                    <div className="price-tag">
                      €{currentPrice.toFixed(2)}
                    </div>
                    {priceTiers[product.id] && priceTiers[product.id].length > 0 && (
                      <div className="text-xs text-neon-cyan/70 mt-1">
                        Special pricing available
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm text-neon-cyan mb-2 block">Quantity:</span>
                      <select
                        value={currentQuantity}
                        onChange={(e) => setCartQuantity(product.id, parseInt(e.target.value))}
                        className="cyber-input w-full"
                      >
                        <option value="0">Select quantity</option>
                        {QUANTITY_OPTIONS.map(qty => {
                          const price = getProductPrice(product.id, qty);
                          return (
                            <option key={qty} value={qty}>
                              {qty} {qty === 1 ? 'unit' : 'units'} - €{price.toFixed(2)} each
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    {currentQuantity > 0 && (
                      <div className="p-3 bg-neon-green/10 border border-neon-green rounded-lg">
                        <div className="text-sm text-neon-cyan">
                          Subtotal: <span className="font-bold text-neon-green">
                            €{(currentPrice * currentQuantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 right-8 cyber-card max-w-md max-h-[80vh] overflow-y-auto">
          <h3 className="text-2xl font-bold mb-4 text-neon-cyan flex items-center gap-2">
            <span>🛒</span> Cart ({cartCount} items)
          </h3>

          {/* Cart Items */}
          <div className="space-y-2 mb-4 pb-4 border-b border-neon-green/30">
            {Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              const price = getProductPrice(productId, quantity);
              return (
                <div key={productId} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{product.name}</div>
                    <div className="text-xs text-neon-cyan/60">
                      {quantity} × €{price.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-bold text-neon-green">
                    €{(price * quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Delivery Location */}
          <div className="space-y-3 mb-4 pb-4 border-b border-neon-green/30">
            <h4 className="font-bold text-neon-cyan flex items-center gap-2">
              <span>📍</span> Delivery Location
            </h4>

            <label className="block">
              <span className="text-sm text-neon-cyan mb-1 block">City:</span>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="cyber-input w-full"
                required
              >
                <option value="">Select city</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {city && (
              <label className="block">
                <span className="text-sm text-neon-cyan mb-1 block">District:</span>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="cyber-input w-full"
                  required
                >
                  <option value="">Select district</option>
                  {DISTRICTS[city as keyof typeof DISTRICTS]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Promo Code */}
          <div className="mb-4 pb-4 border-b border-neon-green/30">
            <h4 className="font-bold text-neon-cyan mb-3 flex items-center gap-2">
              <span>🎟️</span> Promo Code
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="cyber-input flex-1"
              />
              <button
                onClick={handlePromoCodeValidation}
                className="cyber-button px-4"
                disabled={!promoCode.trim()}
              >
                Apply
              </button>
            </div>
            {promoValid === true && (
              <div className="mt-2 text-sm text-neon-green flex items-center gap-1">
                <span>✓</span> Promo code applied! -€{promoDiscount.toFixed(2)}
              </div>
            )}
            {promoValid === false && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <span>✗</span> Invalid promo code
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-neon-cyan">Subtotal:</span>
              <span>€{cartSubtotal.toFixed(2)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-neon-green">
                <span>Discount:</span>
                <span>-€{promoDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-neon-green/30 pt-2">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="price-tag text-xl">€{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || !city || !district}
            className="cyber-button w-full text-lg"
          >
            {checkoutLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading"></span> Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💳</span> Checkout with Crypto
              </span>
            )}
          </button>

          {(!city || !district) && (
            <div className="mt-2 text-xs text-yellow-500 text-center">
              Please select delivery location
            </div>
          )}
        </div>
      )}
    </div>
  );
}
