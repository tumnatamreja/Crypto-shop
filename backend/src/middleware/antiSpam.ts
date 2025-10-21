import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

// Check if user is currently banned
export const checkBan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      'SELECT banned_until FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.banned_until) {
      const bannedUntil = new Date(user.banned_until);
      const now = new Date();

      if (bannedUntil > now) {
        const remainingMinutes = Math.ceil((bannedUntil.getTime() - now.getTime()) / (1000 * 60));
        return res.status(403).json({
          error: 'Account temporarily banned',
          banned: true,
          bannedUntil: bannedUntil.toISOString(),
          remainingMinutes: remainingMinutes,
          message: `Your account is temporarily banned for spam protection. Please try again in ${remainingMinutes} minutes.`
        });
      } else {
        // Ban expired, clear it
        await query(
          'UPDATE users SET banned_until = NULL WHERE id = $1',
          [userId]
        );
      }
    }

    next();
  } catch (error) {
    console.error('Ban check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check for active pending orders (limit 1 active order per user)
export const checkActivePendingOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT COUNT(*) as count FROM orders
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    const activeOrderCount = parseInt(result.rows[0].count);

    if (activeOrderCount > 0) {
      return res.status(429).json({
        error: 'Active order exists',
        message: 'You already have an active pending order. Please complete or cancel it before creating a new one.'
      });
    }

    next();
  } catch (error) {
    console.error('Active order check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Rate limiting: max 3 orders per 30 minutes
export const checkRateLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await query(
      `SELECT COUNT(*) as count FROM orders
       WHERE user_id = $1 AND created_at > $2`,
      [userId, thirtyMinutesAgo]
    );

    const recentOrderCount = parseInt(result.rows[0].count);

    console.log(`User ${userId} has ${recentOrderCount} orders in last 30 minutes`);

    if (recentOrderCount >= 3) {
      // BAN user for 24 hours
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await query(
        'UPDATE users SET banned_until = $1 WHERE id = $2',
        [banUntil, userId]
      );

      console.log(`🚫 User ${userId} BANNED until ${banUntil.toISOString()} for spam (${recentOrderCount} orders in 30 min)`);

      return res.status(429).json({
        error: 'Rate limit exceeded',
        banned: true,
        bannedUntil: banUntil.toISOString(),
        message: 'Too many orders in a short time. Your account has been temporarily banned for 24 hours for spam protection.',
        recentOrders: recentOrderCount
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Combined anti-spam middleware (use this for checkout)
export const antiSpam = [
  checkBan,
  checkActivePendingOrders,
  checkRateLimit
];
