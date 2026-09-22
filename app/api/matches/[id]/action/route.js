import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * POST /api/matches/[id]/action
 * Record user action (like, pass, buy_drink) on a match
 */
async function postHandler(request, { params }) {
  const { userId } = request.user;
  const { id: matchId } = params;

  try {
    const { action } = await request.json();

    if (!['like', 'pass'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: like or pass' },
        { status: 400 }
      );
    }

    // Get the match
    const matchResult = await sql`
      SELECT * FROM matches WHERE id = ${matchId}
    `;

    if (matchResult.rows.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const match = matchResult.rows[0];

    // Determine which user is acting
    let updateQuery;
    if (match.user1_id === userId) {
      updateQuery = sql`
        UPDATE matches
        SET user1_action = ${action}, updated_at = NOW()
        WHERE id = ${matchId}
        RETURNING *
      `;
    } else if (match.user2_id === userId) {
      updateQuery = sql`
        UPDATE matches
        SET user2_action = ${action}, updated_at = NOW()
        WHERE id = ${matchId}
        RETURNING *
      `;
    } else {
      return NextResponse.json(
        { error: 'Not part of this match' },
        { status: 403 }
      );
    }

    const updatedMatch = await updateQuery;

    // Check if mutual like
    const updatedRow = updatedMatch.rows[0];
    const isMutual = updatedRow.user1_action === 'like' && updatedRow.user2_action === 'like';

    // If mutual like, create conversation
    if (isMutual) {
      const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;
      
      await sql`
        INSERT INTO conversations (user1_id, user2_id, match_id)
        VALUES (${Math.min(userId, partnerId)}, ${Math.max(userId, partnerId)}, ${matchId})
        ON CONFLICT DO NOTHING
      `;

      logger.info('Mutual match - conversation created', { userId, partnerId, matchId });
    }

    logger.info('Match action recorded', { userId, matchId, action, isMutual });

    return NextResponse.json(
      {
        success: true,
        action,
        isMutual,
        message: isMutual ? '🎉 You matched!' : `Action recorded: ${action}`
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Match action error', error);
    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
