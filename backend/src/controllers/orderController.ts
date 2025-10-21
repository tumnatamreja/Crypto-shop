import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'product_picture', oi.product_picture,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'delivery_map_link', CASE WHEN o.delivery_status = 'delivered' THEN oi.delivery_map_link ELSE NULL END,
            'delivery_image_link', CASE WHEN o.delivery_status = 'delivered' THEN oi.delivery_image_link ELSE NULL END,
            'delivered_at', oi.delivered_at
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [req.user!.id]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'product_picture', oi.product_picture,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'delivery_map_link', CASE WHEN o.delivery_status = 'delivered' THEN oi.delivery_map_link ELSE NULL END,
            'delivery_image_link', CASE WHEN o.delivery_status = 'delivered' THEN oi.delivery_image_link ELSE NULL END,
            'delivered_at', oi.delivered_at
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id`,
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
