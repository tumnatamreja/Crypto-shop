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
    const response = await axios.post(
      `${OXAPAY_API_URL}/payment/invoice`,
      {
        amount,
        currency,
        order_id: orderId,
        callback_url: callbackUrl,
        return_url: `${process.env.FRONTEND_URL}/profile`,
        description: `CryptoShop Order #${orderId}`,
        fee_paid_by_payer: 1, // Customer pays the fee
        lifetime: 60 // 60 minutes expiration
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'merchant-api-key': process.env.OXAPAY_API_KEY || ''
        }
      }
    );

    // Response format: { status: "success", track_id: number, pay_url: string, ... }
    if (response.data.status === 'success') {
      return {
        trackId: response.data.track_id,
        orderId: orderId,
        payLink: response.data.pay_url,
        currency: response.data.currency || currency,
        amount: response.data.amount || amount
      };
    } else {
      throw new Error('Failed to create invoice: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error: any) {
    console.error('OxaPay API error:', error.response?.data || error.message);
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
