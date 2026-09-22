import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/conversations
 * List all conversations for a user
 */
async function getHandler(request) {
  const { userId } = request.user;

  try {
    const result = await sql`
      SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = ${userId} THEN u2.first_name
          ELSE u1.first_name
        END as other_user_name,
        CASE 
          WHEN c.user1_id = ${userId} THEN u2.profile_picture_url
          ELSE u1.profile_picture_url
        END as other_user_photo,
        m.last_message,
        m.last_message_at,
        COUNT(CASE WHEN msg.read_at IS NULL AND msg.sender_id != ${userId} THEN 1 END) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN messages m ON c.id = m.conversation_id AND (m.created_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id))
      LEFT JOIN messages msg ON c.id = msg.conversation_id
      WHERE c.user1_id = ${userId} OR c.user2_id = ${userId}
      GROUP BY c.id, u1.first_name, u2.first_name, u1.profile_picture_url, u2.profile_picture_url, m.last_message, m.last_message_at
      ORDER BY c.updated_at DESC
    `;

    const conversations = result.rows.map(c => ({
      id: c.id,
      otherId: c.user1_id === userId ? c.user2_id : c.user1_id,
      otherName: c.other_user_name,
      otherPhoto: c.other_user_photo,
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count || 0,
      createdAt: c.created_at
    }));

    logger.info('Conversations listed', { userId, count: conversations.length });

    return NextResponse.json(
      {
        success: true,
        conversations,
        total: result.rowCount
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get conversations error', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
