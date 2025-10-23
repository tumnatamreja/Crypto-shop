import { Response } from 'express';
import { AuthRequest } from '../types';
import { query } from '../config/database';

/**
 * Send a message (user to admin or admin to user)
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, recipientUserId } = req.body;
    const senderId = req.user!.id;
    const isAdmin = req.user!.is_admin;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Determine sender type and user_id for the conversation
    let senderType: 'user' | 'admin';
    let conversationUserId: string;

    if (isAdmin) {
      // Admin sending message to a user
      if (!recipientUserId) {
        return res.status(400).json({ error: 'Recipient user ID is required' });
      }
      senderType = 'admin';
      conversationUserId = recipientUserId;
    } else {
      // User sending message to admin
      senderType = 'user';
      conversationUserId = senderId;
    }

    const result = await query(
      `INSERT INTO messages (user_id, sender_type, message, is_read)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, user_id, sender_type, message, is_read, created_at`,
      [conversationUserId, senderType, message.trim()]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Get messages for current user (user sees their conversation, admin sees all)
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.is_admin;
    const { targetUserId } = req.query;

    let messages;

    if (isAdmin && targetUserId) {
      // Admin viewing specific user's conversation
      messages = await query(
        `SELECT m.*, u.username
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.user_id = $1
         ORDER BY m.created_at ASC`,
        [targetUserId]
      );
    } else if (isAdmin && !targetUserId) {
      // Admin viewing all conversations (last message per user)
      messages = await query(
        `WITH latest_messages AS (
          SELECT DISTINCT ON (user_id)
            m.*,
            u.username,
            u.telegram
          FROM messages m
          JOIN users u ON m.user_id = u.id
          ORDER BY m.user_id, m.created_at DESC
        )
        SELECT * FROM latest_messages
        ORDER BY created_at DESC`
      );
    } else {
      // Regular user viewing their own conversation with admin
      messages = await query(
        `SELECT * FROM messages
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [userId]
      );
    }

    res.json({
      messages: messages.rows,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * Get unread message count (for notifications)
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.is_admin;

    let unreadCount;

    if (isAdmin) {
      // Count unread messages from users (sent by users)
      unreadCount = await query(
        `SELECT COUNT(*) as count
         FROM messages
         WHERE sender_type = 'user' AND is_read = FALSE`
      );
    } else {
      // Count unread messages for this user (sent by admin)
      unreadCount = await query(
        `SELECT COUNT(*) as count
         FROM messages
         WHERE user_id = $1 AND sender_type = 'admin' AND is_read = FALSE`,
        [userId]
      );
    }

    res.json({
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.is_admin;
    const { conversationUserId } = req.body;

    if (isAdmin) {
      // Admin marking user's messages as read (messages sent by user)
      if (!conversationUserId) {
        return res.status(400).json({ error: 'Conversation user ID is required' });
      }
      await query(
        `UPDATE messages
         SET is_read = TRUE
         WHERE user_id = $1 AND sender_type = 'user' AND is_read = FALSE`,
        [conversationUserId]
      );
    } else {
      // User marking admin's messages as read
      await query(
        `UPDATE messages
         SET is_read = TRUE
         WHERE user_id = $1 AND sender_type = 'admin' AND is_read = FALSE`,
        [userId]
      );
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

/**
 * Get conversations list (admin only - list of users with messages)
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await query(
      `SELECT
        u.id,
        u.username,
        u.telegram,
        COUNT(CASE WHEN m.sender_type = 'user' AND m.is_read = FALSE THEN 1 END) as unread_count,
        MAX(m.created_at) as last_message_at,
        (SELECT message FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM users u
       JOIN messages m ON m.user_id = u.id
       WHERE u.is_admin = FALSE
       GROUP BY u.id, u.username, u.telegram
       ORDER BY last_message_at DESC`
    );

    res.json({
      conversations: conversations.rows,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};
