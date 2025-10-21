'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrder } from '@/lib/api';
import axios from 'axios';

interface CryptoNetwork {
  network: string;
  displayName: string;
}

interface CryptoCurrency {
  code: string;
  name: string;
  icon: string;
  networks: CryptoNetwork[];
}

// OxaPay supported currencies with their networks
const SUPPORTED_CURRENCIES: CryptoCurrency[] = [
  {
    code: 'USDT',
    name: 'Tether',
    icon: '💵',
    networks: [
      { network: 'TRX', displayName: 'TRC20' },
      { network: 'ETH', displayName: 'ERC20' },
      { network: 'BSC', displayName: 'BEP20' },
      { network: 'POLYGON', displayName: 'Polygon' },
      { network: 'TON', displayName: 'TON' },
    ],
  },
  {
    code: 'USDC',
    name: 'USD Coin',
    icon: '💰',
    networks: [
      { network: 'ETH', displayName: 'ERC20' },
      { network: 'TRX', displayName: 'TRC20' },
      { network: 'BSC', displayName: 'BEP20' },
      { network: 'POLYGON', displayName: 'Polygon' },
      { network: 'TON', displayName: 'TON' },
    ],
  },
  {
    code: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    networks: [{ network: 'BTC', displayName: 'Bitcoin Network' }],
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    networks: [{ network: 'ETH', displayName: 'ERC20' }],
  },
  {
    code: 'TRX',
    name: 'Tron',
    icon: '◬',
    networks: [{ network: 'TRX', displayName: 'TRC20' }],
  },
  {
    code: 'BNB',
    name: 'Binance Coin',
    icon: '🔸',
    networks: [
      { network: 'BSC', displayName: 'BEP20' },
      { network: 'BNB', displayName: 'BEP2' },
    ],
  },
  {
    code: 'LTC',
    name: 'Litecoin',
    icon: 'Ł',
    networks: [{ network: 'LTC', displayName: 'Litecoin Network' }],
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    icon: 'Ð',
    networks: [{ network: 'DOGE', displayName: 'Dogecoin Network' }],
  },
  {
    code: 'BCH',
    name: 'Bitcoin Cash',
    icon: '฿',
    networks: [{ network: 'BCH', displayName: 'Bitcoin Cash Network' }],
  },
  {
    code: 'XRP',
    name: 'Ripple',
    icon: '✕',
    networks: [{ network: 'XRP', displayName: 'XRP Ledger' }],
  },
  {
    code: 'ADA',
    name: 'Cardano',
    icon: '₳',
    networks: [{ network: 'ADA', displayName: 'Cardano Network' }],
  },
  {
    code: 'SOL',
    name: 'Solana',
    icon: '◎',
    networks: [{ network: 'SOL', displayName: 'Solana Network' }],
  },
  {
    code: 'TON',
    name: 'Toncoin',
    icon: '💎',
    networks: [{ network: 'TON', displayName: 'TON Network' }],
  },
  {
    code: 'MATIC',
    name: 'Polygon',
    icon: '⬡',
    networks: [{ network: 'POLYGON', displayName: 'Polygon Network' }],
  },
  {
    code: 'DAI',
    name: 'Dai',
    icon: '◈',
    networks: [
      { network: 'ETH', displayName: 'ERC20' },
      { network: 'BSC', displayName: 'BEP20' },
      { network: 'POLYGON', displayName: 'Polygon' },
    ],
  },
  {
    code: 'SHIB',
    name: 'Shiba Inu',
    icon: '🐕',
    networks: [{ network: 'ETH', displayName: 'ERC20' }],
  },
  {
    code: 'BUSD',
    name: 'Binance USD',
    icon: '💵',
    networks: [
      { network: 'BSC', displayName: 'BEP20' },
      { network: 'ETH', displayName: 'ERC20' },
    ],
  },
];

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [trackId, setTrackId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);
  const [showCurrencySelect, setShowCurrencySelect] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Poll for payment status
  useEffect(() => {
    if (trackId && paymentStatus === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [trackId, paymentStatus]);

  const loadOrder = async () => {
    try {
      const response = await getOrder(orderId);
      setOrder(response.data);
      setAmount(response.data.total_amount);
      setTrackId(response.data.payment_id || '');
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Order not found');
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await getOrder(orderId);
      if (response.data.status !== 'pending') {
        setPaymentStatus(response.data.status);
        if (response.data.status === 'paid') {
          setTimeout(() => {
            router.push('/profile');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleCurrencySelect = async (currency: CryptoCurrency) => {
    setSelectedCurrency(currency.code);

    // If currency has only one network, auto-select it
    if (currency.networks.length === 1) {
      setSelectedNetwork(currency.networks[0].network);
      await createPaymentAddress(currency.code, currency.networks[0].network);
    } else {
      setShowCurrencySelect(false);
    }
  };

  const handleNetworkSelect = async (network: string) => {
    setSelectedNetwork(network);
    await createPaymentAddress(selectedCurrency, network);
  };

  const createPaymentAddress = async (currency: string, network: string) => {
    try {
      setLoading(true);

      // Create static address via OxaPay API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-static-address`,
        {
          orderId,
          currency,
          network,
        }
      );

      setPaymentAddress(response.data.address);
      setQrCodeUrl(response.data.qrCode);
      setShowCurrencySelect(false);
    } catch (error: any) {
      console.error('Error creating payment address:', error);
      alert(error.response?.data?.error || 'Failed to create payment address');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSelectedCurrencyData = () => {
    return SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => router.push('/profile')}
          className="cyber-button mb-4"
        >
          ← Back to Profile
        </button>

        <div className="cyber-card">
          <h1 className="text-3xl font-bold neon-glow mb-2">Crypto Payment</h1>
          <p className="text-neon-cyan">Order #{orderId.slice(0, 8)}</p>
        </div>
      </div>

      {/* Payment Status */}
      {paymentStatus === 'paid' && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="cyber-card bg-neon-green/20 border-neon-green">
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-neon-green mb-2">
                Payment Confirmed!
              </h2>
              <p className="text-neon-cyan">
                Redirecting to your profile...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currency Selection */}
      {showCurrencySelect && !selectedNetwork && (
        <div className="max-w-4xl mx-auto">
          <div className="cyber-card">
            <h2 className="text-2xl font-bold mb-6 text-neon-cyan">
              {!selectedCurrency ? 'Select Payment Currency' : 'Select Network'}
            </h2>

            {!selectedCurrency ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency)}
                    className="p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg hover:border-neon-cyan hover:bg-neon-cyan/20 transition-all"
                  >
                    <div className="text-3xl mb-2">{currency.icon}</div>
                    <div className="font-bold text-neon-green">{currency.code}</div>
                    <div className="text-xs text-neon-cyan/60">{currency.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => {
                    setSelectedCurrency('');
                    setSelectedNetwork('');
                  }}
                  className="cyber-button mb-4"
                >
                  ← Change Currency
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getSelectedCurrencyData()?.networks.map((network) => (
                    <button
                      key={network.network}
                      onClick={() => handleNetworkSelect(network.network)}
                      disabled={loading}
                      className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-lg hover:border-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-50"
                    >
                      <div className="font-bold text-lg text-neon-green mb-1">
                        {network.displayName}
                      </div>
                      <div className="text-sm text-neon-cyan/60">
                        {selectedCurrency} on {network.network}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Details */}
      {paymentAddress && selectedCurrency && selectedNetwork && (
        <div className="max-w-4xl mx-auto">
          <div className="cyber-card">
            <div className="mb-6">
              <button
                onClick={() => {
                  setPaymentAddress('');
                  setQrCodeUrl('');
                  setSelectedCurrency('');
                  setSelectedNetwork('');
                  setShowCurrencySelect(true);
                }}
                className="cyber-button"
              >
                ← Change Payment Method
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                  Scan QR Code
                </h3>
                {qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64" />
                  </div>
                ) : (
                  <div className="bg-neon-cyan/10 border-2 border-dashed border-neon-cyan/30 rounded-lg p-8">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-neon-cyan/60">QR Code will appear here</p>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                    Payment Information
                  </h3>

                  <div className="space-y-4">
                    {/* Amount */}
                    <div className="p-4 bg-neon-green/10 border border-neon-green rounded-lg">
                      <div className="text-sm text-neon-cyan mb-1">Amount to Pay:</div>
                      <div className="price-tag text-2xl">
                        €{amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-neon-cyan/60 mt-1">
                        Pay equivalent in {selectedCurrency}
                      </div>
                    </div>

                    {/* Currency & Network */}
                    <div className="p-4 bg-neon-cyan/10 border border-neon-cyan rounded-lg">
                      <div className="text-sm text-neon-cyan mb-1">Currency & Network:</div>
                      <div className="font-bold text-lg">
                        {getSelectedCurrencyData()?.icon} {selectedCurrency}
                      </div>
                      <div className="text-sm text-neon-cyan/60">
                        {getSelectedCurrencyData()?.networks.find(n => n.network === selectedNetwork)?.displayName}
                      </div>
                    </div>

                    {/* Payment Address */}
                    <div className="p-4 bg-neon-purple/10 border border-neon-purple rounded-lg">
                      <div className="text-sm text-neon-cyan mb-2">Payment Address:</div>
                      <div className="font-mono text-xs break-all mb-3 p-2 bg-cyber-dark/50 rounded">
                        {paymentAddress}
                      </div>
                      <button
                        onClick={copyAddress}
                        className="cyber-button w-full"
                      >
                        {copied ? '✓ Copied!' : '📋 Copy Address'}
                      </button>
                    </div>

                    {/* Status */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="text-sm text-yellow-500 mb-1">Status:</div>
                      <div className="font-bold">
                        {paymentStatus === 'pending' ? (
                          <span className="flex items-center gap-2">
                            <span className="loading inline-block w-4 h-4"></span>
                            Waiting for payment...
                          </span>
                        ) : paymentStatus === 'paid' ? (
                          <span className="text-neon-green">✓ Paid</span>
                        ) : (
                          <span className="capitalize">{paymentStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg">
                  <h4 className="font-bold text-neon-cyan mb-2">Instructions:</h4>
                  <ol className="text-sm space-y-1 text-neon-cyan/80 list-decimal list-inside">
                    <li>Send exactly €{amount.toFixed(2)} worth of {selectedCurrency}</li>
                    <li>To the address above</li>
                    <li>Using {getSelectedCurrencyData()?.networks.find(n => n.network === selectedNetwork)?.displayName} network</li>
                    <li>Wait for confirmation (usually 1-10 minutes)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
