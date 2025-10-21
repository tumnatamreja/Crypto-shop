import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { createInvoice } from '../services/oxapayService';

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    // Get product details
    const productIds = items.map((item: any) => item.productId);
    const products = await query(
      'SELECT * FROM products WHERE id = ANY($1) AND is_active = true',
      [productIds]
    );

    if (products.rows.length !== items.length) {
      return res.status(400).json({ error: 'Some products are not available' });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const product = products.rows.find(p => p.id === item.productId);
      if (!product) throw new Error('Product not found');

      totalAmount += parseFloat(product.price) * (item.quantity || 1);

      return {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        map_link: product.map_link,
        image_link: product.image_link,
        quantity: item.quantity || 1
      };
    });

    // Create order
    const orderResult = await query(
      'INSERT INTO orders (user_id, total_amount, currency, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.id, totalAmount, 'USD', 'pending']
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, map_link, image_link, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [order.id, item.product_id, item.product_name, item.product_price, item.map_link, item.image_link, item.quantity]
      );
    }

    // Create OxaPay invoice
    const callbackUrl = `${process.env.OXAPAY_CALLBACK_URL}?orderId=${order.id}`;
    const invoice = await createInvoice(totalAmount, 'USD', order.id, callbackUrl);

    // Update order with payment info
    await query(
      'UPDATE orders SET payment_id = $1, payment_url = $2 WHERE id = $3',
      [invoice.trackId.toString(), invoice.payLink, order.id]
    );

    res.json({
      orderId: order.id,
      paymentUrl: invoice.payLink,
      trackId: invoice.trackId,
      amount: totalAmount,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // OxaPay webhook sends: track_id, order_id, status, amount, currency, etc.
    const { track_id, order_id, status } = req.body;

    console.log('OxaPay Webhook received:', req.body);

    // Verify HMAC signature for security (optional but recommended)
    const hmacHeader = req.headers['hmac'] as string;
    if (hmacHeader && process.env.OXAPAY_API_KEY) {
      const crypto = require('crypto');
      const rawBody = JSON.stringify(req.body);
      const expectedHmac = crypto
        .createHmac('sha512', process.env.OXAPAY_API_KEY)
        .update(rawBody)
        .digest('hex');

      if (hmacHeader !== expectedHmac) {
        console.error('Invalid HMAC signature');
        return res.status(403).send('ok'); // Still return 'ok' to avoid retries
      }
    }

    if (!order_id) {
      console.error('No order_id in webhook');
      return res.status(200).send('ok'); // Return 'ok' to avoid retries
    }

    // Map OxaPay status to our status
    let orderStatus = 'pending';
    if (status === 'paid' || status === 'Paid') {
      orderStatus = 'paid';
    } else if (status === 'expired' || status === 'Expired') {
      orderStatus = 'expired';
    } else if (status === 'failed' || status === 'Failed') {
      orderStatus = 'failed';
    } else if (status === 'paying' || status === 'Paying') {
      orderStatus = 'pending'; // Still processing
    }

    // Update order status
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [orderStatus, order_id]
    );

    if (result.rows.length === 0) {
      console.error(`Order ${order_id} not found`);
    } else {
      console.log(`Order ${order_id} updated to status: ${orderStatus}`);
    }

    // IMPORTANT: OxaPay requires response to be "ok" with HTTP 200
    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 'ok' to avoid webhook retries
    res.status(200).send('ok');
  }
};
