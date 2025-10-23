import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { createWhiteLabelPayment } from '../services/oxapayService';

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { items, promoCode, city_id, district_id, city, district } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    // Validate location fields
    if (!city_id && !city) {
      return res.status(400).json({ error: 'City is required' });
    }

    if (!district_id && !district) {
      return res.status(400).json({ error: 'District is required' });
    }

    // Calculate total using VARIANTS (NEW)
    let subtotal = 0;
    let currency = 'EUR';
    const orderItems = [];

    for (const item of items) {
      const { productId, variantId, quantity } = item;

      if (!variantId) {
        return res.status(400).json({ error: 'Variant is required for each item' });
      }

      // Get variant details
      const variantResult = await query(
        `SELECT pv.*, p.name as product_name, p.picture_link, p.currency
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         WHERE pv.id = $1 AND pv.is_active = true AND p.is_active = true`,
        [variantId]
      );

      if (variantResult.rows.length === 0) {
        return res.status(400).json({ error: 'Variant not found or inactive' });
      }

      const variant = variantResult.rows[0];

      // Check stock availability in selected city
      if (city_id) {
        const stockResult = await query(
          `SELECT (stock_amount - reserved_amount) as available_stock
           FROM variant_stock
           WHERE variant_id = $1 AND city_id = $2`,
          [variantId, city_id]
        );

        if (stockResult.rows.length === 0 || parseFloat(stockResult.rows[0].available_stock) < quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${variant.variant_name}. Available: ${stockResult.rows[0]?.available_stock || 0}`
          });
        }

        // Reserve stock
        await query(
          `UPDATE variant_stock
           SET reserved_amount = reserved_amount + $1
           WHERE variant_id = $2 AND city_id = $3`,
          [quantity, variantId, city_id]
        );
      }

      currency = variant.currency || 'EUR';
      const itemPrice = parseFloat(variant.price);
      const itemQuantity = quantity || 1;

      subtotal += itemPrice * itemQuantity;

      orderItems.push({
        product_id: productId,
        variant_id: variantId,
        product_name: variant.product_name,
        product_picture: variant.picture_link,
        product_price: itemPrice,
        quantity: itemQuantity,
        variant_name: variant.variant_name,
        variant_amount: parseFloat(variant.amount)
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

    // Create order
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

    // Create order items with variant info
    for (const item of orderItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_picture, product_price, quantity, variant_name, variant_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [order.id, item.product_id, item.variant_id, item.product_name, item.product_picture, item.product_price, item.quantity, item.variant_name, item.variant_amount]
      );
    }

    console.log('Order created successfully with variants:', order.id);

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

      // Release reserved stock if order failed/expired
      if (orderStatus === 'expired' || orderStatus === 'failed') {
        try {
          // Get order items with variant info
          const orderItemsResult = await query(
            'SELECT variant_id, quantity FROM order_items WHERE order_id = $1 AND variant_id IS NOT NULL',
            [order_id]
          );

          // Get city_id from order
          const cityIdResult = await query(
            'SELECT city_id FROM orders WHERE id = $1',
            [order_id]
          );

          if (cityIdResult.rows.length > 0 && cityIdResult.rows[0].city_id) {
            const cityId = cityIdResult.rows[0].city_id;

            // Release reserved stock for each item
            for (const item of orderItemsResult.rows) {
              await query(
                `UPDATE variant_stock
                 SET reserved_amount = GREATEST(0, reserved_amount - $1)
                 WHERE variant_id = $2 AND city_id = $3`,
                [item.quantity, item.variant_id, cityId]
              );
            }

            console.log(`✓ Released reserved stock for order ${order_id}`);
          }
        } catch (stockError) {
          console.error('Error releasing reserved stock:', stockError);
        }
      }

      // Finalize stock (move from reserved to sold) if order is paid
      if (orderStatus === 'paid') {
        try {
          // Get order items with variant info
          const orderItemsResult = await query(
            'SELECT variant_id, quantity FROM order_items WHERE order_id = $1 AND variant_id IS NOT NULL',
            [order_id]
          );

          // Get city_id from order
          const cityIdResult = await query(
            'SELECT city_id FROM orders WHERE id = $1',
            [order_id]
          );

          if (cityIdResult.rows.length > 0 && cityIdResult.rows[0].city_id) {
            const cityId = cityIdResult.rows[0].city_id;

            // Deduct from both stock and reserved
            for (const item of orderItemsResult.rows) {
              await query(
                `UPDATE variant_stock
                 SET stock_amount = GREATEST(0, stock_amount - $1),
                     reserved_amount = GREATEST(0, reserved_amount - $1)
                 WHERE variant_id = $2 AND city_id = $3`,
                [item.quantity, item.variant_id, cityId]
              );
            }

            console.log(`✓ Finalized stock for paid order ${order_id}`);
          }
        } catch (stockError) {
          console.error('Error finalizing stock:', stockError);
        }
      }

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

// Create White Label payment (NEW - Correct OxaPay Implementation)
export const createWhiteLabelPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, payCurrency, network } = req.body;

    if (!orderId || !payCurrency || !network) {
      return res.status(400).json({ error: 'Order ID, pay currency, and network are required' });
    }

    console.log('Creating white label payment:', { orderId, payCurrency, network });

    // Get order details
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user!.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Create White Label payment via OxaPay
    // amount: order total in EUR
    // currency: EUR (price currency)
    // payCurrency: What customer pays with (BTC, USDT, ETH, etc)
    // network: TRC20, ERC20, BEP20, etc
    const payment = await createWhiteLabelPayment(
      parseFloat(order.total_amount),
      'EUR', // Always EUR for our products
      payCurrency,
      network,
      orderId
    );

    // Update order with payment tracking info
    await query(
      'UPDATE orders SET payment_id = $1 WHERE id = $2',
      [payment.trackId, orderId]
    );

    res.json({
      trackId: payment.trackId,
      payAmount: payment.payAmount, // Exact crypto amount to pay
      payAddress: payment.payAddress, // Payment address
      qrCode: payment.qrCode, // QR code URL from OxaPay
      payCurrency: payCurrency,
      network: network,
      message: payment.message
    });
  } catch (error: any) {
    console.error('Create white label payment error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create payment',
      message: error.response?.data?.message || error.message
    });
  }
};
