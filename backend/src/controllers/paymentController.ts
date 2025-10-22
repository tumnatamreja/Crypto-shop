import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { createStaticAddress } from '../services/oxapayService';

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { items, promoCode, city_id, district_id, city, district } = req.body; // Array of { productId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    // Validate location fields - support both ID-based and text-based for backward compatibility
    if (!city_id && !city) {
      return res.status(400).json({ error: 'City is required' });
    }

    if (!district_id && !district) {
      return res.status(400).json({ error: 'District is required' });
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

    // Calculate total (check for quantity-based pricing)
    let subtotal = 0;
    let currency = 'EUR';
    const orderItems = [];

    for (const item of items) {
      const product = products.rows.find((p: any) => p.id === item.productId);
      if (!product) throw new Error('Product not found');

      currency = product.currency || 'EUR';
      let itemPrice = parseFloat(product.price);
      const quantity = item.quantity || 1;

      // Check for quantity-based pricing
      const priceTier = await query(
        'SELECT price FROM product_price_tiers WHERE product_id = $1 AND quantity = $2',
        [product.id, quantity]
      );

      if (priceTier.rows.length > 0) {
        itemPrice = parseFloat(priceTier.rows[0].price);
      }

      subtotal += itemPrice * quantity;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_picture: product.picture_link,
        product_price: itemPrice,
        quantity: quantity
      });
    }

    // Apply promo code if provided
    let discountAmount = 0;
    let finalPromoCode = null;

    if (promoCode && promoCode.trim().length > 0) {
      const promoResult = await query(
        `SELECT * FROM promo_codes
         WHERE UPPER(code) = UPPER($1) AND is_active = true`,
        [promoCode.trim()]
      );

      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];

        // Validate expiration
        if (!promo.valid_until || new Date(promo.valid_until) >= new Date()) {
          // Validate max uses
          if (!promo.max_uses || promo.current_uses < promo.max_uses) {
            // Validate minimum order amount
            if (subtotal >= parseFloat(promo.min_order_amount || 0)) {
              // Calculate discount
              if (promo.discount_type === 'percentage') {
                discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
              } else if (promo.discount_type === 'fixed') {
                discountAmount = parseFloat(promo.discount_value);
              }

              // Ensure discount doesn't exceed subtotal
              if (discountAmount > subtotal) {
                discountAmount = subtotal;
              }

              finalPromoCode = promo.code;

              // Increment promo code usage
              await query(
                'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = $1',
                [promo.id]
              );
            }
          }
        }
      }
    }

    const totalAmount = subtotal - discountAmount;

    // Create order with location and promo fields
    const orderResult = await query(
      `INSERT INTO orders (user_id, total_amount, subtotal, discount_amount, promo_code, currency, status, delivery_status, city_id, district_id, city, district)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        req.user!.id,
        totalAmount,
        subtotal,
        discountAmount,
        finalPromoCode,
        currency,
        'pending',
        'pending',
        city_id || null,
        district_id || null,
        city || null,
        district || null
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_picture, product_price, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.product_id, item.product_name, item.product_picture, item.product_price, item.quantity]
      );
    }

    // No need to create OxaPay invoice here - user will select currency on payment page
    console.log('Order created successfully:', order.id);

    res.json({
      orderId: order.id,
      amount: totalAmount,
      subtotal: subtotal,
      discount: discountAmount,
      promoCode: finalPromoCode,
      currency: currency,
      city: city,
      district: district
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

      // Process referral reward if order is paid
      if (orderStatus === 'paid' && result.rows[0]) {
        const order = result.rows[0];
        try {
          // Check if user was referred
          const referralResult = await query(
            `SELECT id, referrer_user_id, status
             FROM referrals
             WHERE referred_user_id = $1 AND status = 'pending'`,
            [order.user_id]
          );

          if (referralResult.rows.length > 0) {
            const referral = referralResult.rows[0];
            const rewardPercentage = 10; // 10% commission
            const rewardAmount = (parseFloat(order.total_amount) * rewardPercentage) / 100;

            // Update referral record
            await query(
              `UPDATE referrals SET status = 'active', reward_amount = $1, activated_at = NOW()
               WHERE id = $2`,
              [rewardAmount, referral.id]
            );

            // Update referrer earnings
            await query(
              `UPDATE users
               SET total_referral_earnings = total_referral_earnings + $1,
                   total_referrals = total_referrals + 1
               WHERE id = $2`,
              [rewardAmount, referral.referrer_user_id]
            );

            console.log(`✓ Referral reward processed: €${rewardAmount} for user ${referral.referrer_user_id}`);
          }
        } catch (referralError) {
          console.error('Error processing referral reward:', referralError);
          // Don't fail the webhook if referral processing fails
        }
      }
    }

    // IMPORTANT: OxaPay requires response to be "ok" with HTTP 200
    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 'ok' to avoid webhook retries
    res.status(200).send('ok');
  }
};

// Create static payment address for white-label payment page
export const createStaticAddressHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, currency, network } = req.body;

    if (!orderId || !currency) {
      return res.status(400).json({ error: 'Order ID and currency are required' });
    }

    console.log('Creating static address:', { orderId, currency, network });

    // Get order details
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user!.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Create static address via OxaPay
    const staticAddress = await createStaticAddress(
      parseFloat(order.total_amount),
      currency,
      network || currency,
      orderId
    );

    // Update order with payment details
    await query(
      'UPDATE orders SET payment_id = $1, currency = $2 WHERE id = $3',
      [staticAddress.trackId || staticAddress.address, currency, orderId]
    );

    res.json({
      address: staticAddress.address,
      qrCode: staticAddress.qrCode,
      amount: order.total_amount,
      currency: currency,
      network: network || currency,
    });
  } catch (error: any) {
    console.error('Create static address error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create payment address',
      message: error.response?.data?.message || error.message
    });
  }
};
