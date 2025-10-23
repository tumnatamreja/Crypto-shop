'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, createCheckout, getProductVariants, getProductCities, getProductDistricts } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  picture_link: string;
  quantity: number;
  variants?: Variant[];
}

interface Variant {
  id: string;
  name: string;
  type: string;
  amount: number;
  price: number;
  availableStock?: number;
  displayName: string;
}

interface City {
  id: string;
  name: string;
  name_en: string | null;
}

interface District {
  id: string;
  name: string;
  name_en: string | null;
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    loadProductData();
    loadCities();
  }, [productId]);

  useEffect(() => {
    if (selectedCityId) {
      loadDistricts(selectedCityId);
      loadVariants(selectedCityId);
    } else {
      setDistricts([]);
      setSelectedDistrictId('');
      setVariants([]);
      setSelectedVariantId('');
    }
  }, [selectedCityId]);

  const loadProductData = async () => {
    try {
      const productResponse = await getProduct(productId);
      setProduct(productResponse.data.product);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Product not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (cityId: string) => {
    try {
      setLoadingVariants(true);
      setSelectedVariantId(''); // Reset variant selection
      const response = await getProductVariants(productId, cityId);
      setVariants(response.data.variants || []);

      // Auto-select first variant if available
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariantId(response.data.variants[0].id);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const loadCities = async () => {
    try {
      const response = await getProductCities(productId);
      setCities(response.data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadDistricts = async (cityId: string) => {
    try {
      setLoadingDistricts(true);
      setSelectedDistrictId(''); // Reset district selection
      const response = await getProductDistricts(productId, cityId);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const getSelectedVariant = () => {
    return variants.find(v => v.id === selectedVariantId);
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariant();
    if (variant) {
      return variant.price;
    }
    return product ? parseFloat(product.price.toString()) : 0;
  };

  const getTotalPrice = () => {
    return getCurrentPrice() * quantity;
  };

  const handleCheckout = async () => {
    if (!product) return;

    // Validate required fields
    if (!selectedCityId) {
      alert('Please select a city for delivery');
      return;
    }

    if (!selectedDistrictId) {
      alert('Please select a district for delivery');
      return;
    }

    if (!selectedVariantId) {
      alert('Please select a variant');
      return;
    }

    try {
      setSubmitting(true);

      const response = await createCheckout(
        [{ productId: product.id, variantId: selectedVariantId, quantity }],
        selectedCityId,
        selectedDistrictId,
        promoCode.trim() || undefined
      );

      // Redirect to payment page
      router.push(`/payment/${response.data.orderId}`);
    } catch (error: any) {
      console.error('Checkout error:', error);

      // Handle specific error messages
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to create order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="loading"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="cyber-card text-center">
            <p className="text-gray-400">Product not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="cyber-button mb-6 text-sm py-2 px-4"
          >
            ← Back to Products
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image and Info */}
            <div className="cyber-card">
              <div className="aspect-square overflow-hidden rounded-lg mb-6">
                <img
                  src={product.picture_link}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h1 className="text-3xl font-bold text-gradient mb-4">
                {product.name}
              </h1>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-lg">
                <h3 className="font-bold text-neon-red mb-2">ℹ️ Product Info:</h3>
                <p className="text-sm text-gray-300">
                  Select your delivery location to see available variants and stock.
                </p>
              </div>
            </div>

            {/* Order Form */}
            <div className="cyber-card">
              <h2 className="text-2xl font-bold text-gradient mb-6">Place Order</h2>

              {/* Delivery Location - FIRST (variants depend on city) */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-neon-red mb-4">📍 Delivery Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City / Град *
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      className="cyber-input"
                      required
                    >
                      <option value="">Select city / Избери град</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      District / Квартал *
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="cyber-input"
                      disabled={!selectedCityId || loadingDistricts}
                      required
                    >
                      <option value="">
                        {!selectedCityId
                          ? 'First select city / Първо избери град'
                          : loadingDistricts
                          ? 'Loading... / Зареждане...'
                          : 'Select district / Избери квартал'}
                      </option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Variant Selector - appears after city selection */}
              {selectedCityId && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Variant / Вариант *
                  </label>
                  {loadingVariants ? (
                    <div className="cyber-input flex items-center justify-center">
                      <span className="loading inline-block w-5 h-5 mr-2"></span>
                      Loading variants...
                    </div>
                  ) : variants.length === 0 ? (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                      ⚠️ No variants available in this city. Try another city.
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="cyber-input"
                        required
                      >
                        <option value="">Select variant / Избери вариант</option>
                        {variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.displayName}
                            {variant.availableStock !== null && variant.availableStock !== undefined
                              ? ` (Stock: ${variant.availableStock}${variant.type})`
                              : ''}
                          </option>
                        ))}
                      </select>
                      {selectedVariantId && getSelectedVariant() && (
                        <div className="mt-2 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              {getSelectedVariant()?.name} ({getSelectedVariant()?.amount}{getSelectedVariant()?.type})
                            </span>
                            <span className="font-bold text-neon-green">
                              €{getSelectedVariant()?.price.toFixed(2)}
                            </span>
                          </div>
                          {getSelectedVariant()?.availableStock !== null && (
                            <div className="text-xs text-gray-400 mt-1">
                              Available: {getSelectedVariant()?.availableStock}{getSelectedVariant()?.type}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              {selectedVariantId && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 bg-neon-red/20 border border-neon-red rounded-lg hover:bg-neon-red/30 transition-colors text-xl font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="cyber-input text-center font-bold text-xl"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 bg-neon-red/20 border border-neon-red rounded-lg hover:bg-neon-red/30 transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Price Display */}
              {selectedVariantId && (
                <div className="mb-6 p-6 bg-gradient-to-br from-neon-red/10 to-neon-orange/10 border border-neon-red rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Price per item:</div>
                  <div className="price-tag text-3xl mb-3">
                    €{getCurrentPrice().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Total:</div>
                  <div className="text-2xl font-bold text-neon-red">
                    €{getTotalPrice().toFixed(2)}
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="cyber-input"
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting || !selectedCityId || !selectedDistrictId || !selectedVariantId}
                className="cyber-button w-full text-lg py-4"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading inline-block w-5 h-5"></span>
                    Processing...
                  </span>
                ) : !selectedCityId ? (
                  'Select City First'
                ) : !selectedDistrictId ? (
                  'Select District'
                ) : !selectedVariantId ? (
                  'Select Variant'
                ) : (
                  'Proceed to Payment'
                )}
              </button>

              {/* Info Notice */}
              <div className="mt-4 p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                <p className="text-xs text-gray-400">
                  ℹ️ You will be redirected to our secure white-label payment page where you can select your preferred cryptocurrency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
