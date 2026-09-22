import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/conversations/[id]/messages
 * Get message history for a conversation
 */
async function getHandler(request, { params }) {
  const { userId } = request.user;
  const { id: conversationId } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Verify user is part of conversation
    const convResult = await sql`
      SELECT * FROM conversations WHERE id = ${conversationId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const messagesResult = await sql`
      SELECT 
        id, sender_id, content, created_at, read_at,
        (SELECT first_name FROM users WHERE id = sender_id) as sender_name
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Mark messages as read
    await sql`
      UPDATE messages
      SET read_at = NOW()
      WHERE conversation_id = ${conversationId}
        AND sender_id != ${userId}
        AND read_at IS NULL
    `;

    logger.info('Messages retrieved', { userId, conversationId, count: messagesResult.rowCount });

    return NextResponse.json(
      {
        success: true,
        messages: messagesResult.rows.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: m.created_at,
          readAt: m.read_at,
          isOwn: m.sender_id === userId
        })).reverse(),
        total: messagesResult.rowCount
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get messages error', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Send a new message
 */
async function postHandler(request, { params }) {
  const { userId } = request.user;
  const { id: conversationId } = params;

  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      );
    }

    // Verify user is part of conversation
    const convResult = await sql`
      SELECT * FROM conversations WHERE id = ${conversationId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save message
    const messageResult = await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${conversationId}, ${userId}, ${content})
      RETURNING *
    `;

    // Update conversation timestamp
    await sql`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}
    `;

    const message = messageResult.rows[0];
    logger.info('Message sent', { userId, conversationId });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: message.id,
          conversationId: message.conversation_id,
          content: message.content,
          createdAt: message.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Send message error', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
export const POST = withErrorHandler(withAuth(postHandler));
