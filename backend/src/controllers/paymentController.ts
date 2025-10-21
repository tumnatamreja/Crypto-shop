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
    const { orderId, status, trackId } = req.body;

    console.log('Webhook received:', { orderId, status, trackId });

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    // Update order status
    let orderStatus = 'pending';
    if (status === 'Paid' || status === 'paid') {
      orderStatus = 'paid';
    } else if (status === 'Expired' || status === 'expired') {
      orderStatus = 'expired';
    } else if (status === 'Failed' || status === 'failed') {
      orderStatus = 'failed';
    }

    await query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [orderStatus, orderId]
    );

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
