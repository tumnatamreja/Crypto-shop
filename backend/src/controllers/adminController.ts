import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// Dashboard Stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalRevenue, pendingDeliveries] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      query('SELECT COUNT(*) FROM orders'),
      query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'paid'"),
      query("SELECT COUNT(*) FROM orders WHERE status = 'paid' AND delivery_status = 'pending'")
    ]);

    const recentOrders = await query(
      `SELECT o.id, o.total_amount, o.currency, o.status, o.delivery_status, o.created_at, u.username, u.telegram
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
        totalRevenue: parseFloat(totalRevenue.rows[0].revenue),
        pendingDeliveries: parseInt(pendingDeliveries.rows[0].count)
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
    const { name, description, price, currency, picture_link, quantity } = req.body;

    if (!name || !price || !picture_link) {
      return res.status(400).json({ error: 'Name, price, and picture_link are required' });
    }

    const result = await query(
      'INSERT INTO products (name, description, price, currency, picture_link, quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description || null, price, currency || 'EUR', picture_link, quantity || 1]
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
    const { name, description, price, currency, picture_link, quantity, is_active } = req.body;

    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, currency = $4, picture_link = $5, quantity = $6, is_active = $7 WHERE id = $8 RETURNING *',
      [name, description, price, currency, picture_link, quantity, is_active, id]
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
    const { status, delivery_status } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause += ' WHERE o.status = $1';
      params.push(status);
    }

    if (delivery_status) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ` o.delivery_status = $${params.length + 1}`;
      params.push(delivery_status);
    }

    const result = await query(
      `SELECT o.*, u.username, u.telegram,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'product_picture', oi.product_picture,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'delivery_map_link', oi.delivery_map_link,
            'delivery_image_link', oi.delivery_image_link
          )
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.username, u.telegram
      ORDER BY o.created_at DESC`,
      params
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

// Delivery Management
export const updateDeliveryInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { delivery_map_link, delivery_image_link } = req.body;

    if (!delivery_map_link || !delivery_image_link) {
      return res.status(400).json({ error: 'Both delivery links are required' });
    }

    // Update all order items for this order
    await query(
      `UPDATE order_items
       SET delivery_map_link = $1,
           delivery_image_link = $2,
           delivered_at = CURRENT_TIMESTAMP
       WHERE order_id = $3`,
      [delivery_map_link, delivery_image_link, orderId]
    );

    // Update order delivery status
    const result = await query(
      `UPDATE orders
       SET delivery_status = 'delivered'
       WHERE id = $1
       RETURNING *`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0], message: 'Delivery info updated successfully' });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User Management with stats
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE u.username ILIKE $1';
      params.push(`%${search}%`);
    }

    const result = await query(
      `SELECT
        u.id,
        u.username,
        u.telegram,
        u.is_admin,
        u.created_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
      ${whereClause}
      GROUP BY u.id, u.username, u.telegram, u.is_admin, u.created_at
      ORDER BY u.created_at DESC`,
      params
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

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Delete user (CASCADE will delete orders and order_items)
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${result.rows[0].username} deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
