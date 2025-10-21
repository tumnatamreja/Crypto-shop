import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// Dashboard Stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      query('SELECT COUNT(*) FROM orders'),
      query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'paid'")
    ]);

    const recentOrders = await query(
      `SELECT o.id, o.total_amount, o.currency, o.status, o.created_at, u.username
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    res.json({
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalProducts: parseInt(totalProducts.rows[0].count),
        totalOrders: parseInt(totalOrders.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].revenue)
      },
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Product Management
export const getAllProductsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, currency, map_link, image_link } = req.body;

    if (!name || !price || !map_link || !image_link) {
      return res.status(400).json({ error: 'Name, price, map_link, and image_link are required' });
    }

    const result = await query(
      'INSERT INTO products (name, description, price, currency, map_link, image_link) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description || null, price, currency || 'USD', map_link, image_link]
    );

    res.status(201).json({ product: result.rows[0], message: 'Product created successfully' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, currency, map_link, image_link, is_active } = req.body;

    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, currency = $4, map_link = $5, image_link = $6, is_active = $7 WHERE id = $8 RETURNING *',
      [name, description, price, currency, map_link, image_link, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0], message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete
    const result = await query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Order Management
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT o.*, u.username,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, u.username
      ORDER BY o.created_at DESC`
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'failed', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0], message: 'Order updated successfully' });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User Management
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, telegram, is_admin, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    const result = await query(
      'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, username, telegram, is_admin',
      [is_admin, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0], message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
