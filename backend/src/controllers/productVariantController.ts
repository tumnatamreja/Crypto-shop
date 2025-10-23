import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// ============================================
// PUBLIC ENDPOINTS - Customer-facing
// ============================================

/**
 * Get all available variants for a product
 * Auto-hides out-of-stock variants
 * GET /api/products/:productId/variants
 */
export const getProductVariants = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { cityId } = req.query;

    let variantsQuery = `
      SELECT DISTINCT
        pv.id,
        pv.variant_name,
        pv.variant_type,
        pv.amount,
        pv.price,
        pv.sort_order,
        COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) as total_available_stock
      FROM product_variants pv
      LEFT JOIN variant_stock vs ON pv.id = vs.variant_id
      WHERE pv.product_id = $1
        AND pv.is_active = true
    `;

    const params: any[] = [productId];

    // Filter by city if specified
    if (cityId) {
      variantsQuery += ` AND (vs.city_id = $2 OR vs.city_id IS NULL)`;
      params.push(cityId);
    }

    variantsQuery += `
      GROUP BY pv.id, pv.variant_name, pv.variant_type, pv.amount, pv.price, pv.sort_order
      HAVING COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) > 0
      ORDER BY pv.sort_order, pv.amount
    `;

    const result = await query(variantsQuery, params);

    res.json({
      variants: result.rows.map(v => ({
        id: v.id,
        name: v.variant_name,
        type: v.variant_type,
        amount: parseFloat(v.amount),
        price: parseFloat(v.price),
        availableStock: parseFloat(v.total_available_stock),
        displayName: `${v.variant_name} - €${parseFloat(v.price).toFixed(2)}`
      }))
    });

  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

/**
 * Check variant availability in specific city
 * GET /api/products/:productId/variants/:variantId/availability?cityId=xxx
 */
export const checkVariantAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const { cityId, amount } = req.query;

    if (!cityId) {
      return res.status(400).json({ error: 'City ID is required' });
    }

    const requestedAmount = amount ? parseFloat(amount as string) : 1;

    const result = await query(
      `SELECT
        (stock_amount - reserved_amount) as available_stock,
        CASE
          WHEN (stock_amount - reserved_amount) >= $3 THEN true
          ELSE false
        END as is_available
       FROM variant_stock
       WHERE variant_id = $1 AND city_id = $2`,
      [variantId, cityId, requestedAmount]
    );

    if (result.rows.length === 0) {
      return res.json({
        available: false,
        availableStock: 0,
        message: 'Variant not available in this city'
      });
    }

    const row = result.rows[0];
    res.json({
      available: row.is_available,
      availableStock: parseFloat(row.available_stock),
      message: row.is_available
        ? 'Variant is available'
        : `Only ${row.available_stock} available, requested ${requestedAmount}`
    });

  } catch (error) {
    console.error('Error checking variant availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

// ============================================
// ADMIN ENDPOINTS - Variant Management
// ============================================

/**
 * Get all variants for a product (including inactive and stock info)
 * GET /api/admin/products/:productId/variants
 */
export const getAdminProductVariants = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await query(
      `SELECT
        pv.id,
        pv.variant_name,
        pv.variant_type,
        pv.amount,
        pv.price,
        pv.is_active,
        pv.sort_order,
        pv.created_at,
        COALESCE(SUM(vs.stock_amount), 0) as total_stock,
        COALESCE(SUM(vs.reserved_amount), 0) as total_reserved,
        COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) as total_available
       FROM product_variants pv
       LEFT JOIN variant_stock vs ON pv.id = vs.variant_id
       WHERE pv.product_id = $1
       GROUP BY pv.id
       ORDER BY pv.sort_order, pv.amount`,
      [productId]
    );

    res.json({
      variants: result.rows.map(v => ({
        id: v.id,
        name: v.variant_name,
        type: v.variant_type,
        amount: parseFloat(v.amount),
        price: parseFloat(v.price),
        isActive: v.is_active,
        sortOrder: v.sort_order,
        createdAt: v.created_at,
        totalStock: parseFloat(v.total_stock),
        totalReserved: parseFloat(v.total_reserved),
        totalAvailable: parseFloat(v.total_available)
      }))
    });

  } catch (error) {
    console.error('Error fetching admin variants:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
};

/**
 * Create new variant for product
 * POST /api/admin/products/:productId/variants
 */
export const createVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { variantName, variantType, amount, price, sortOrder } = req.body;

    // Validation
    if (!variantName || !variantType || !amount || price === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: variantName, variantType, amount, price'
      });
    }

    if (variantType !== 'гр' && variantType !== 'бр') {
      return res.status(400).json({
        error: 'Variant type must be "гр" or "бр"'
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    // Create variant
    const variantResult = await query(
      `INSERT INTO product_variants
       (product_id, variant_name, variant_type, amount, price, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, variantName, variantType, amount, price, sortOrder || 0]
    );

    const variant = variantResult.rows[0];

    // Initialize stock for all active cities
    const citiesResult = await query(
      `SELECT id FROM cities WHERE is_active = true`
    );

    for (const city of citiesResult.rows) {
      await query(
        `INSERT INTO variant_stock (variant_id, city_id, stock_amount)
         VALUES ($1, $2, $3)`,
        [variant.id, city.id, 0] // Start with 0 stock, admin will set it
      );
    }

    res.status(201).json({
      message: 'Variant created successfully',
      variant: {
        id: variant.id,
        name: variant.variant_name,
        type: variant.variant_type,
        amount: parseFloat(variant.amount),
        price: parseFloat(variant.price)
      }
    });

  } catch (error: any) {
    console.error('Error creating variant:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        error: 'Variant with this name already exists for this product'
      });
    }

    res.status(500).json({ error: 'Failed to create variant' });
  }
};

/**
 * Update variant
 * PUT /api/admin/variants/:variantId
 */
export const updateVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const { variantName, variantType, amount, price, isActive, sortOrder } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (variantName !== undefined) {
      updates.push(`variant_name = $${paramCount++}`);
      values.push(variantName);
    }
    if (variantType !== undefined) {
      if (variantType !== 'гр' && variantType !== 'бр') {
        return res.status(400).json({ error: 'Variant type must be "гр" or "бр"' });
      }
      updates.push(`variant_type = $${paramCount++}`);
      values.push(variantType);
    }
    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updates.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (price !== undefined) {
      if (parseFloat(price) < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    if (sortOrder !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sortOrder);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(variantId);

    const result = await query(
      `UPDATE product_variants
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json({
      message: 'Variant updated successfully',
      variant: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating variant:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Variant with this name already exists for this product'
      });
    }

    res.status(500).json({ error: 'Failed to update variant' });
  }
};

/**
 * Delete variant
 * DELETE /api/admin/variants/:variantId
 */
export const deleteVariant = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;

    // Check if variant has been ordered
    const ordersCheck = await query(
      `SELECT COUNT(*) as order_count
       FROM order_items
       WHERE variant_id = $1`,
      [variantId]
    );

    if (parseInt(ordersCheck.rows[0].order_count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete variant that has been ordered. Consider deactivating it instead.'
      });
    }

    // Delete variant (stock will be cascade deleted)
    const result = await query(
      `DELETE FROM product_variants WHERE id = $1 RETURNING *`,
      [variantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    res.json({ message: 'Variant deleted successfully' });

  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
};

// ============================================
// ADMIN ENDPOINTS - Stock Management
// ============================================

/**
 * Get stock for all cities for a variant
 * GET /api/admin/variants/:variantId/stock
 */
export const getVariantStock = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;

    const result = await query(
      `SELECT
        vs.id,
        vs.variant_id,
        vs.city_id,
        c.name as city_name,
        vs.stock_amount,
        vs.reserved_amount,
        (vs.stock_amount - vs.reserved_amount) as available_stock,
        vs.low_stock_threshold,
        vs.last_restock_date,
        vs.updated_at,
        CASE
          WHEN (vs.stock_amount - vs.reserved_amount) <= 0 THEN 'out_of_stock'
          WHEN (vs.stock_amount - vs.reserved_amount) <= vs.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM variant_stock vs
       JOIN cities c ON vs.city_id = c.id
       WHERE vs.variant_id = $1
       ORDER BY c.sort_order, c.name`,
      [variantId]
    );

    res.json({
      stock: result.rows.map(s => ({
        id: s.id,
        cityId: s.city_id,
        cityName: s.city_name,
        stockAmount: parseFloat(s.stock_amount),
        reservedAmount: parseFloat(s.reserved_amount),
        availableStock: parseFloat(s.available_stock),
        lowStockThreshold: parseFloat(s.low_stock_threshold),
        stockStatus: s.stock_status,
        lastRestockDate: s.last_restock_date,
        updatedAt: s.updated_at
      }))
    });

  } catch (error) {
    console.error('Error fetching variant stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

/**
 * Update stock for specific city
 * PUT /api/admin/variants/:variantId/stock/:cityId
 */
export const updateVariantStock = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId, cityId } = req.params;
    const { stockAmount, lowStockThreshold } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (stockAmount !== undefined) {
      if (parseFloat(stockAmount) < 0) {
        return res.status(400).json({ error: 'Stock amount cannot be negative' });
      }
      updates.push(`stock_amount = $${paramCount++}`);
      values.push(stockAmount);
      updates.push(`last_restock_date = NOW()`);
    }

    if (lowStockThreshold !== undefined) {
      updates.push(`low_stock_threshold = $${paramCount++}`);
      values.push(lowStockThreshold);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(variantId, cityId);

    const result = await query(
      `UPDATE variant_stock
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE variant_id = $${paramCount} AND city_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      stock: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

/**
 * Bulk update stock for multiple cities
 * POST /api/admin/variants/:variantId/stock/bulk
 */
export const bulkUpdateVariantStock = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const { stockUpdates } = req.body; // Array of { cityId, stockAmount, lowStockThreshold }

    if (!Array.isArray(stockUpdates)) {
      return res.status(400).json({ error: 'stockUpdates must be an array' });
    }

    for (const update of stockUpdates) {
      const { cityId, stockAmount, lowStockThreshold } = update;

      await query(
        `UPDATE variant_stock
         SET stock_amount = $1,
             low_stock_threshold = $2,
             last_restock_date = NOW(),
             updated_at = NOW()
         WHERE variant_id = $3 AND city_id = $4`,
        [stockAmount, lowStockThreshold || 10, variantId, cityId]
      );
    }

    res.json({ message: 'Stock updated successfully for all cities' });

  } catch (error) {
    console.error('Error bulk updating stock:', error);
    res.status(500).json({ error: 'Failed to bulk update stock' });
  }
};
