import { Request, Response } from 'express';
import { query } from '../config/database';
import { Product } from '../types';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, price, currency, image_link, is_active, created_at FROM products WHERE is_active = true ORDER BY created_at DESC'
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

    const result = await query(
      'SELECT id, name, description, price, currency, image_link, is_active FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
