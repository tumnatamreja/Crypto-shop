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
    let currency = 'EUR';
    const orderItems = items.map((item: any) => {
      const product = products.rows.find(p => p.id === item.productId);
      if (!product) throw new Error('Product not found');

      totalAmount += parseFloat(product.price) * (item.quantity || 1);
      currency = product.currency || 'EUR';

      return {
        product_id: product.id,
        product_name: product.name,
        product_picture: product.picture_link,
        product_price: product.price,
        quantity: item.quantity || 1
      };
    });

    // Create order
    const orderResult = await query(
      'INSERT INTO orders (user_id, total_amount, currency, status, delivery_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user!.id, totalAmount, currency, 'pending', 'pending']
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_picture, product_price, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.product_id, item.product_name, item.product_picture, item.product_price, item.quantity]
      );
    }

    // Create OxaPay invoice
    // Build callback URL - should point to our webhook endpoint
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const callbackUrl = `${baseUrl}/api/webhook/oxapay`;

    console.log('Creating invoice:', { totalAmount, currency, orderId: order.id, callbackUrl });

    const invoice = await createInvoice(totalAmount, currency, order.id, callbackUrl);

    console.log('Invoice created:', invoice);

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
      currency: currency
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create payment',
      details: error.message
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // OxaPay v1 webhook sends: trackId, orderid, status, amount, payAmount, currency, etc.
    const { trackId, orderid, status } = req.body;

    console.log('=== OxaPay Webhook received ===');
    console.log('Full payload:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);

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
        console.error('Expected:', expectedHmac);
        console.error('Received:', hmacHeader);
        return res.status(403).send('ok'); // Still return 'ok' to avoid retries
      }
    }

    // OxaPay v1 uses 'orderid' (lowercase)
    const order_id = orderid;

    if (!order_id) {
      console.error('No orderid in webhook');
      return res.status(200).send('ok'); // Return 'ok' to avoid retries
    }

    // Map OxaPay status to our status
    // OxaPay statuses: Waiting, Confirming, Paid, Expired, Failed
    let orderStatus = 'pending';
    const statusLower = status ? status.toLowerCase() : '';

    if (statusLower === 'paid' || statusLower === 'confirming') {
      orderStatus = 'paid';
    } else if (statusLower === 'expired') {
      orderStatus = 'expired';
    } else if (statusLower === 'failed') {
      orderStatus = 'failed';
    } else if (statusLower === 'waiting') {
      orderStatus = 'pending';
    }

    console.log(`Updating order ${order_id} to status: ${orderStatus}`);

    // Update order status
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [orderStatus, order_id]
    );

    if (result.rows.length === 0) {
      console.error(`Order ${order_id} not found in database`);
    } else {
      console.log(`✓ Order ${order_id} successfully updated to status: ${orderStatus}`);
    }

    // IMPORTANT: OxaPay requires response to be "ok" with HTTP 200
    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 'ok' to avoid webhook retries
    res.status(200).send('ok');
  }
};
