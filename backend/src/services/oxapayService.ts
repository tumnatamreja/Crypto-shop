import axios from 'axios';
import { OxaPayInvoice } from '../types';

const OXAPAY_API_URL = 'https://api.oxapay.com/merchants';

export const createInvoice = async (
  amount: number,
  currency: string,
  orderId: string,
  callbackUrl: string
): Promise<OxaPayInvoice> => {
  try {
    const response = await axios.post(
      `${OXAPAY_API_URL}/request`,
      {
        merchant: process.env.OXAPAY_MERCHANT_ID,
        amount,
        currency,
        orderId,
        callbackUrl,
        returnUrl: `${process.env.FRONTEND_URL}/profile`,
        description: `CryptoShop Order #${orderId}`,
        feePaidByPayer: 1 // Customer pays the fee
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OXAPAY_API_KEY}`
        }
      }
    );

    if (response.data.result === 100) {
      return {
        trackId: response.data.trackId,
        orderId: response.data.orderId,
        payLink: response.data.payLink,
        currency: response.data.currency,
        amount: response.data.amount
      };
    } else {
      throw new Error('Failed to create invoice: ' + response.data.message);
    }
  } catch (error) {
    console.error('OxaPay API error:', error);
    throw new Error('Payment provider error');
  }
};

export const verifyPayment = async (trackId: number): Promise<any> => {
  try {
    const response = await axios.post(
      `${OXAPAY_API_URL}/inquiry`,
      {
        merchant: process.env.OXAPAY_MERCHANT_ID,
        trackId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OXAPAY_API_KEY}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('OxaPay verify error:', error);
    throw new Error('Payment verification error');
  }
};
