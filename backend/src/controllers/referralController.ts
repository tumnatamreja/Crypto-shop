import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

/**
 * Get user's referral stats and referrals
 */
export const getReferralStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's referral code and stats
    const userResult = await query(
      `SELECT referral_code, total_referrals, total_referral_earnings
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get list of referred users
    const referralsResult = await query(
      `SELECT
        r.id,
        r.status,
        r.reward_amount,
        r.created_at,
        r.activated_at,
        u.username as referred_username
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      referralCode: user.referral_code,
      totalReferrals: parseInt(user.total_referrals) || 0,
      totalEarnings: parseFloat(user.total_referral_earnings) || 0,
      referrals: referralsResult.rows,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
};

/**
 * Apply referral code during registration (called from authController)
 */
export const applyReferralCode = async (referralCode: string, newUserId: string) => {
  try {
    // Find referrer by code
    const referrerResult = await query(
      'SELECT id FROM users WHERE referral_code = $1',
      [referralCode.toUpperCase()]
    );

    if (referrerResult.rows.length === 0) {
      return { success: false, error: 'Invalid referral code' };
    }

    const referrerId = referrerResult.rows[0].id;

    // Create referral record
    await query(
      `INSERT INTO referrals (referrer_user_id, referred_user_id, status)
       VALUES ($1, $2, 'active')`,
      [referrerId, newUserId]
    );

    // Increment referrer's total_referrals
    await query(
      `UPDATE users
       SET total_referrals = total_referrals + 1
       WHERE id = $1`,
      [referrerId]
    );

    return { success: true, referrerId };
  } catch (error) {
    console.error('Apply referral code error:', error);
    return { success: false, error: 'Failed to apply referral code' };
  }
};

/**
 * Process referral reward when referred user makes first order
 */
export const processReferralReward = async (userId: string, orderAmount: number) => {
  try {
    // Check if this user was referred
    const referralResult = await query(
      `SELECT id, referrer_user_id, status
       FROM referrals
       WHERE referred_user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (referralResult.rows.length === 0) {
      return; // Not a referred user
    }

    const referral = referralResult.rows[0];

    // Calculate reward (e.g., 10% of first order)
    const rewardPercentage = 10;
    const rewardAmount = (orderAmount * rewardPercentage) / 100;

    // Update referral record
    await query(
      `UPDATE referrals
       SET status = 'rewarded', reward_amount = $1
       WHERE id = $2`,
      [rewardAmount, referral.id]
    );

    // Update referrer's earnings
    await query(
      `UPDATE users
       SET total_referral_earnings = total_referral_earnings + $1
       WHERE id = $2`,
      [rewardAmount, referral.referrer_user_id]
    );

    console.log(`✓ Referral reward processed: €${rewardAmount} for user ${referral.referrer_user_id}`);
  } catch (error) {
    console.error('Process referral reward error:', error);
  }
};

/**
 * Admin: Get all referrals
 */
export const getAllReferrals = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        r.id,
        r.status,
        r.reward_amount,
        r.created_at,
        r.activated_at,
        u1.username as referrer_username,
        u2.username as referred_username
       FROM referrals r
       JOIN users u1 ON r.referrer_user_id = u1.id
       JOIN users u2 ON r.referred_user_id = u2.id
       ORDER BY r.created_at DESC`
    );

    res.json({
      referrals: result.rows,
    });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
};
