import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/matches
 * Get all matches for a user in an event
 */
async function getHandler(request) {
  const { userId } = request.user;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventId required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT 
        m.*,
        CASE 
          WHEN m.user1_id = ${userId} THEN u2.first_name
          ELSE u1.first_name
        END as partner_name,
        CASE 
          WHEN m.user1_id = ${userId} THEN u2.profile_picture_url
          ELSE u1.profile_picture_url
        END as partner_photo,
        CASE 
          WHEN m.user1_id = ${userId} THEN u2.bio
          ELSE u1.bio
        END as partner_bio,
        CASE 
          WHEN m.user1_id = ${userId} THEN u2.location_city
          ELSE u1.location_city
        END as partner_location
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE (m.user1_id = ${userId} OR m.user2_id = ${userId})
        AND m.event_id = ${eventId}
      ORDER BY m.created_at DESC
    `;

    const matches = result.rows.map(m => ({
      id: m.id,
      roundId: m.round_id,
      roundNumber: m.round_number,
      partnerId: m.user1_id === userId ? m.user2_id : m.user1_id,
      partnerName: m.partner_name,
      partnerPhoto: m.partner_photo,
      partnerBio: m.partner_bio,
      partnerLocation: m.partner_location,
      userAction: m.user1_id === userId ? m.user1_action : m.user2_action,
      partnerAction: m.user1_id === userId ? m.user2_action : m.user1_action,
      isMutual: m.user1_action === 'like' && m.user2_action === 'like',
      createdAt: m.match_start_time
    }));

    logger.info('Matches retrieved', { userId, eventId, count: matches.length });

    return NextResponse.json(
      {
        success: true,
        matches,
        total: result.rowCount
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get matches error', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
