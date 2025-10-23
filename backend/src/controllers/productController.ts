import { Request, Response } from 'express';
import { query } from '../config/database';
import { Product } from '../types';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, price, currency, picture_link, quantity, is_active, created_at FROM products WHERE is_active = true ORDER BY created_at DESC'
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cityId } = req.query;

    const result = await query(
      'SELECT id, name, description, price, currency, picture_link, quantity, is_active FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Get available variants for this product (with stock if city provided)
    let variantsQuery = `
      SELECT DISTINCT
        pv.id,
        pv.variant_name,
        pv.variant_type,
        pv.amount,
        pv.price,
        pv.sort_order
    `;

    if (cityId) {
      variantsQuery += `,
        COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) as available_stock
      `;
    }

    variantsQuery += `
      FROM product_variants pv
    `;

    if (cityId) {
      variantsQuery += `
        LEFT JOIN variant_stock vs ON pv.id = vs.variant_id AND vs.city_id = $2
      `;
    }

    variantsQuery += `
      WHERE pv.product_id = $1 AND pv.is_active = true
    `;

    if (cityId) {
      variantsQuery += `
        GROUP BY pv.id, pv.variant_name, pv.variant_type, pv.amount, pv.price, pv.sort_order
        HAVING COALESCE(SUM(vs.stock_amount - vs.reserved_amount), 0) > 0
      `;
    }

    variantsQuery += `
      ORDER BY pv.sort_order, pv.amount
    `;

    const params = cityId ? [id, cityId] : [id];
    const variantsResult = await query(variantsQuery, params);

    product.variants = variantsResult.rows.map((v: any) => ({
      id: v.id,
      name: v.variant_name,
      type: v.variant_type,
      amount: parseFloat(v.amount),
      price: parseFloat(v.price),
      availableStock: cityId ? parseFloat(v.available_stock || 0) : null,
      displayName: `${v.variant_name} - €${parseFloat(v.price).toFixed(2)}`
    }));

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
