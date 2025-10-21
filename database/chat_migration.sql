-- Chat System Migration
-- Add messages table for user-admin communication

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Combined index for unread admin messages
CREATE INDEX idx_messages_unread_admin ON messages(user_id, is_read) WHERE sender_type = 'user';

COMMENT ON TABLE messages IS 'Stores chat messages between users and admins';
COMMENT ON COLUMN messages.sender_type IS 'Either "user" or "admin" - who sent this message';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the recipient';
