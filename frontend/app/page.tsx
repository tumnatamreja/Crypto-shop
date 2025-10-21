'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts } from '@/lib/api';
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
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleProductClick = (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Redirect to a product details or order page
    router.push(`/order/${productId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="cyber-card text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">SinHuella Corp.</span>
          </h1>
          <p className="text-3xl md:text-4xl font-bold text-neon-red mb-4 neon-glow">
            БЪРЗО, ЛЕСНО, АНОНИМНО!
          </p>
          <p className="text-xl text-gray-300 mb-8">
            Вашият надежден анонимен магазин за крипто плащания
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="cyber-button">
              Разгледай Продукти
            </a>
            <button
              onClick={() => router.push('/register')}
              className="cyber-button"
            >
              Създай Акаунт
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="cyber-card text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-neon-red mb-2">Бързо</h3>
            <p className="text-gray-400 text-sm">
              Моментални транзакции и бърза обработка на поръчки
            </p>
          </div>
          <div className="cyber-card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-neon-red mb-2">Анонимно</h3>
            <p className="text-gray-400 text-sm">
              Пълна анонимност и сигурност на вашите данни
            </p>
          </div>
          <div className="cyber-card text-center">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-neon-red mb-2">Качество</h3>
            <p className="text-gray-400 text-sm">
              Само най-качествени продукти и услуги
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gradient mb-4">Наши Продукти</h2>
          <p className="text-gray-400">
            Разгледайте нашата селекция от качествени продукти
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-gray-400">Няма налични продукти в момента</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.picture_link}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-neon-red mb-2 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="price-tag text-xl">
                      €{parseFloat(product.price.toString()).toFixed(2)}
                    </div>
                    <button className="text-neon-red hover:text-neon-orange transition-colors font-bold text-sm">
                      Купи сега →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="cyber-card">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gradient mb-4">Контакт</h2>
              <p className="text-gray-400">
                Свържете се с нас за въпроси и поддръжка
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="https://t.me/yourtelegram"
                target="_blank"
                rel="noopener noreferrer"
                className="cyber-card hover:border-neon-red transition-all text-center p-6"
              >
                <div className="text-4xl mb-3">📱</div>
                <h3 className="text-lg font-bold text-neon-red mb-2">Telegram</h3>
                <p className="text-sm text-gray-400">24/7 Support</p>
              </a>

              <a
                href="mailto:support@sinhuella.com"
                className="cyber-card hover:border-neon-red transition-all text-center p-6"
              >
                <div className="text-4xl mb-3">✉️</div>
                <h3 className="text-lg font-bold text-neon-red mb-2">Email</h3>
                <p className="text-sm text-gray-400">support@sinhuella.com</p>
              </a>

              <div className="cyber-card text-center p-6">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-neon-red mb-2">Live Chat</h3>
                <p className="text-sm text-gray-400">In-app messaging</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="cyber-card text-center max-w-3xl mx-auto bg-gradient-to-br from-neon-red/10 to-neon-orange/10 border-neon-red">
          <h2 className="text-3xl font-bold text-gradient mb-4">
            Готови ли сте да започнете?
          </h2>
          <p className="text-gray-300 mb-6">
            Регистрирайте се сега и получете достъп до нашите продукти
          </p>
          <button
            onClick={() => router.push('/register')}
            className="cyber-button text-lg px-8"
          >
            Създай Безплатен Акаунт
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
