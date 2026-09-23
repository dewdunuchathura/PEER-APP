/**
 * Database helper functions for PEARD
 * Uses Vercel Postgres (sql template tag)
 */

import { sql } from '@vercel/postgres';
import { logger } from './logger';

/**
 * Health check - test database connection
 */
export async function healthCheck() {
  try {
    const result = await sql`SELECT 1 as status`;
    return { healthy: true, responseTime: 0 };
  } catch (error) {
    logger.error('Database health check failed', error);
    return { healthy: false, error: error.message };
  }
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phoneNumber) {
  try {
    const result = await sql`
      SELECT * FROM users
      WHERE phone_number = ${phoneNumber}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    logger.error('getUserByPhone error', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const result = await sql`
      SELECT * FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    logger.error('getUserById error', error);
    throw error;
  }
}

/**
 * Create new user
 */
export async function createUser(phoneNumber) {
  try {
    const result = await sql`
      INSERT INTO users (phone_number, created_at, updated_at)
      VALUES (${phoneNumber}, NOW(), NOW())
      RETURNING *
    `;
    logger.info('User created', { userId: result.rows[0].id });
    return result.rows[0];
  } catch (error) {
    logger.error('createUser error', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUser(userId, data) {
  try {
    const {
      first_name,
      last_name,
      email,
      bio,
      height_cm,
      zodiac_sign,
      instagram_handle,
      location_city,
      location_state,
      location_country,
      birth_date,
    } = data;

    const result = await sql`
      UPDATE users
      SET
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        email = COALESCE(${email}, email),
        bio = COALESCE(${bio}, bio),
        height_cm = COALESCE(${height_cm}, height_cm),
        zodiac_sign = COALESCE(${zodiac_sign}, zodiac_sign),
        instagram_handle = COALESCE(${instagram_handle}, instagram_handle),
        location_city = COALESCE(${location_city}, location_city),
        location_state = COALESCE(${location_state}, location_state),
        location_country = COALESCE(${location_country}, location_country),
        birth_date = COALESCE(${birth_date ?? null}, birth_date),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('updateUser error', error);
    throw error;
  }
}

/**
 * Create OTP verification record
 */
export async function createOTP(phoneNumber, otpCode, expiresAt) {
  try {
    const result = await sql`
      INSERT INTO otp_verification (phone_number, otp_code, expires_at)
      VALUES (${phoneNumber}, ${otpCode}, ${expiresAt})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('createOTP error', error);
    throw error;
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(phoneNumber, otpCode) {
  try {
    const result = await sql`
      SELECT * FROM otp_verification
      WHERE phone_number = ${phoneNumber}
        AND otp_code = ${otpCode}
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    logger.error('verifyOTP error', error);
    throw error;
  }
}

/**
 * Delete used OTP
 */
export async function deleteOTP(otpId) {
  try {
    await sql`
      DELETE FROM otp_verification
      WHERE id = ${otpId}
    `;
  } catch (error) {
    logger.error('deleteOTP error', error);
    throw error;
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId) {
  try {
    const result = await sql`
      SELECT * FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    logger.error('getEventById error', error);
    throw error;
  }
}

/**
 * Register user for event
 */
export async function registerForEvent(eventId, userId, gender, genderBalance) {
  try {
    const result = await sql`
      INSERT INTO event_registrations (
        event_id, user_id, gender, gender_balance_preference
      ) VALUES (${eventId}, ${userId}, ${gender}, ${genderBalance})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('registerForEvent error', error);
    throw error;
  }
}

/**
 * Get user conversations
 */
export async function getUserConversations(userId) {
  try {
    const result = await sql`
      SELECT * FROM conversations
      WHERE user1_id = ${userId} OR user2_id = ${userId}
      ORDER BY updated_at DESC
    `;
    return result.rows;
  } catch (error) {
    logger.error('getUserConversations error', error);
    throw error;
  }
}

/**
 * Create conversation
 */
export async function createConversation(userId1, userId2, matchId) {
  try {
    const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    
    const result = await sql`
      INSERT INTO conversations (user1_id, user2_id, match_id)
      VALUES (${id1}, ${id2}, ${matchId})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    return result.rows[0] || null;
  } catch (error) {
    logger.error('createConversation error', error);
    throw error;
  }
}

/**
 * Save message
 */
export async function saveMessage(conversationId, senderId, content) {
  try {
    const result = await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${conversationId}, ${senderId}, ${content})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('saveMessage error', error);
    throw error;
  }
}

/**
 * Get conversation messages
 */
export async function getMessages(conversationId, limit = 50, offset = 0) {
  try {
    const result = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    logger.error('getMessages error', error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId, userId) {
  try {
    await sql`
      UPDATE messages
      SET read_at = NOW()
      WHERE conversation_id = ${conversationId}
        AND sender_id != ${userId}
        AND read_at IS NULL
    `;
  } catch (error) {
    logger.error('markMessagesAsRead error', error);
    throw error;
  }
}

/**
 * Save photo
 */
export async function savePhoto(userId, photoUrl, order = 1) {
  try {
    const result = await sql`
      INSERT INTO user_photos (user_id, photo_url, display_order)
      VALUES (${userId}, ${photoUrl}, ${order})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('savePhoto error', error);
    throw error;
  }
}

/**
 * Get user photos
 */
export async function getUserPhotos(userId) {
  try {
    const result = await sql`
      SELECT * FROM user_photos
      WHERE user_id = ${userId}
      ORDER BY display_order ASC
    `;
    return result.rows;
  } catch (error) {
    logger.error('getUserPhotos error', error);
    throw error;
  }
}

/**
 * Delete photo
 */
export async function deletePhoto(photoId, userId) {
  try {
    const result = await sql`
      DELETE FROM user_photos
      WHERE id = ${photoId} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rowCount > 0;
  } catch (error) {
    logger.error('deletePhoto error', error);
    throw error;
  }
}

/**
 * Record transaction
 */
export async function recordTransaction(userId, matchId, amount, type = 'drink_purchase') {
  try {
    const result = await sql`
      INSERT INTO transactions (user_id, match_id, amount, type, status)
      VALUES (${userId}, ${matchId}, ${amount}, ${type}, 'completed')
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    logger.error('recordTransaction error', error);
    throw error;
  }
}

/**
 * Get user transactions
 */
export async function getUserTransactions(userId, limit = 50) {
  try {
    const result = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    logger.error('getUserTransactions error', error);
    throw error;
  }
}

/**
 * Database transaction wrapper
 */
export async function transaction(callback) {
  try {
    await sql`BEGIN`;
    const result = await callback();
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    logger.error('Transaction failed', error);
    throw error;
  }
}
