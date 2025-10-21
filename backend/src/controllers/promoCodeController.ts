import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

/**
 * Validate and apply promo code
 */
export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code required' });
    }

    // Fetch promo code
    const result = await query(
      `SELECT * FROM promo_codes
       WHERE UPPER(code) = UPPER($1) AND is_active = true`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    const promoCode = result.rows[0];

    // Check if expired
    if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    // Check if max uses reached
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }

    // Check minimum order amount
    if (orderAmount < parseFloat(promoCode.min_order_amount)) {
      return res.status(400).json({
        error: `Minimum order amount is €${promoCode.min_order_amount}`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = (orderAmount * parseFloat(promoCode.discount_value)) / 100;
    } else if (promoCode.discount_type === 'fixed') {
      discountAmount = parseFloat(promoCode.discount_value);
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    res.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discount_type,
      discountValue: promoCode.discount_value,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
};

/**
 * Record promo code usage (called when order is created)
 */
export const recordPromoCodeUsage = async (
  promoCode: string,
  userId: string,
  orderId: string,
  discountAmount: number
) => {
  try {
    // Get promo code ID
    const result = await query(
      'SELECT id FROM promo_codes WHERE UPPER(code) = UPPER($1)',
      [promoCode]
    );

    if (result.rows.length === 0) {
      console.error(`Promo code ${promoCode} not found`);
      return;
    }

    const promoCodeId = result.rows[0].id;

    // Record usage
    await query(
      `INSERT INTO promo_code_usage (promo_code_id, user_id, order_id, discount_amount)
       VALUES ($1, $2, $3, $4)`,
      [promoCodeId, userId, orderId, discountAmount]
    );

    // Increment current_uses
    await query(
      'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = $1',
      [promoCodeId]
    );

    console.log(`✓ Promo code ${promoCode} applied: -€${discountAmount}`);
  } catch (error) {
    console.error('Record promo code usage error:', error);
  }
};

/**
 * Admin: Create promo code
 */
export const createPromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      max_uses,
      valid_until,
      min_order_amount,
    } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, valid_until, min_order_amount, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        max_uses || null,
        valid_until || null,
        min_order_amount || 0,
        req.user!.id,
      ]
    );

    res.status(201).json({
      message: 'Promo code created',
      promoCode: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique violation
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    console.error('Create promo code error:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
};

/**
 * Admin: Get all promo codes
 */
export const getAllPromoCodes = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM promo_codes
       ORDER BY created_at DESC`
    );

    res.json({
      promoCodes: result.rows,
    });
  } catch (error) {
    console.error('Get promo codes error:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
};

/**
 * Admin: Update promo code
 */
export const updatePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active, max_uses, valid_until } = req.body;

    const result = await query(
      `UPDATE promo_codes
       SET is_active = COALESCE($1, is_active),
           max_uses = COALESCE($2, max_uses),
           valid_until = COALESCE($3, valid_until),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [is_active, max_uses, valid_until, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({
      message: 'Promo code updated',
      promoCode: result.rows[0],
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
};

/**
 * Admin: Delete promo code
 */
export const deletePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM promo_codes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    console.error('Delete promo code error:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
};
