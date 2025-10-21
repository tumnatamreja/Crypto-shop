import axios from 'axios';
import { OxaPayInvoice } from '../types';

const OXAPAY_API_URL = 'https://api.oxapay.com/v1';

export const createInvoice = async (
  amount: number,
  currency: string,
  orderId: string,
  callbackUrl: string
): Promise<OxaPayInvoice> => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const payload = {
      amount,
      currency,
      order_id: orderId,
      callback_url: callbackUrl,
      return_url: `${frontendUrl}/profile`,
      description: `CryptoShop Order #${orderId.slice(0, 8)}`,
      fee_paid_by_payer: 1, // Customer pays the fee
      lifetime: 60 // 60 minutes expiration
    };

    console.log('OxaPay API Request:', {
      url: `${OXAPAY_API_URL}/payment/invoice`,
      payload,
      apiKey: process.env.OXAPAY_API_KEY ? '***SET***' : '***MISSING***'
    });

    const response = await axios.post(
      `${OXAPAY_API_URL}/payment/invoice`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'merchant-api-key': process.env.OXAPAY_API_KEY || ''
        }
      }
    );

    console.log('OxaPay API Response:', response.data);

    // Response format: { status: "success", track_id: number, pay_url: string, ... }
    if (response.data && response.data.result === 100) {
      // OxaPay v1 API returns result=100 for success
      return {
        trackId: response.data.trackId,
        orderId: orderId,
        payLink: response.data.payLink,
        currency: response.data.currency || currency,
        amount: response.data.amount || amount
      };
    } else {
      const errorMsg = response.data?.message || response.data?.error || 'Unknown error';
      console.error('OxaPay API failed:', response.data);
      throw new Error(`Failed to create invoice: ${errorMsg}`);
    }
  } catch (error: any) {
    console.error('OxaPay API error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error('Payment provider error: ' + (error.response?.data?.message || error.message));
  }
};

export const verifyPayment = async (trackId: number): Promise<any> => {
  try {
    const response = await axios.post(
      `${OXAPAY_API_URL}/payment/information`,
      {
        track_id: trackId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'merchant-api-key': process.env.OXAPAY_API_KEY || ''
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('OxaPay verify error:', error.response?.data || error.message);
    throw new Error('Payment verification error');
  }
};

export const createStaticAddress = async (
  amount: number,
  currency: string,
  network: string,
  orderId: string
): Promise<any> => {
  try {
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const callbackUrl = `${baseUrl}/api/webhook/oxapay`;

    // Map currency to proper format for OxaPay
    let apiCurrency = currency;

    // For tokens with different networks (USDT, USDC, etc)
    if (currency === 'USDT' || currency === 'USDC' || currency === 'DAI' || currency === 'BUSD') {
      if (network === 'TRX') {
        apiCurrency = `${currency}_TRX`;
      } else if (network === 'ETH') {
        apiCurrency = `${currency}_ETH`;
      } else if (network === 'BSC') {
        apiCurrency = `${currency}_BSC`;
      } else if (network === 'POLYGON') {
        apiCurrency = `${currency}_POLYGON`;
      } else if (network === 'TON') {
        apiCurrency = `${currency}_TON`;
      }
    }

    const payload = {
      amount: amount,
      currency: apiCurrency,
      orderId: orderId,
      callbackUrl: callbackUrl,
      feePaidByPayer: 1,
    };

    console.log('OxaPay Static Address Request:', {
      url: `${OXAPAY_API_URL}/merchants/request/staticAddress`,
      payload,
      apiKey: process.env.OXAPAY_API_KEY ? '***SET***' : '***MISSING***'
    });

    const response = await axios.post(
      `${OXAPAY_API_URL}/merchants/request/staticAddress`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'merchant-api-key': process.env.OXAPAY_API_KEY || ''
        }
      }
    );

    console.log('OxaPay Static Address Response:', response.data);

    if (response.data && response.data.result === 100) {
      return {
        address: response.data.address,
        trackId: response.data.trackId,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${response.data.address}`,
      };
    } else {
      const errorMsg = response.data?.message || response.data?.error || 'Unknown error';
      console.error('OxaPay Static Address failed:', response.data);
      throw new Error(`Failed to create static address: ${errorMsg}`);
    }
  } catch (error: any) {
    console.error('OxaPay Static Address error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error('Payment provider error: ' + (error.response?.data?.message || error.message));
  }
};
