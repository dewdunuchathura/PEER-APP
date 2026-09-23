import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * POST /api/events/[id]/rounds
 * Admin: Create all round pairings for the event
 * Pairs men with women they haven't met, rotating each round
 */
async function postHandler(request, { params }) {
  const { userId } = request.user;
  const { id: eventId } = params;

  try {
    // Get registered men and women
    const menResult = await sql`
      SELECT er.user_id FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ${eventId} AND (er.gender = 'male' OR u.gender = 'male')
    `;
    const womenResult = await sql`
      SELECT er.user_id FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ${eventId} AND (er.gender = 'female' OR u.gender = 'female')
    `;

    const men = menResult.rows.map(r => r.user_id);
    const women = womenResult.rows.map(r => r.user_id);

    if (men.length === 0 || women.length === 0) {
      return NextResponse.json(
        { error: 'Need at least one man and one woman registered' },
        { status: 400 }
      );
    }

    // Get event num_rounds
    const eventResult = await sql`SELECT num_rounds FROM events WHERE id = ${eventId}`;
    const numRounds = Math.min(eventResult.rows[0]?.num_rounds || 6, men.length, women.length, 6);

    // Delete any existing match records for this event
    await sql`DELETE FROM matches WHERE event_id = ${eventId}`;

    // Create pairings: each round, rotate women
    let created = 0;
    for (let round = 1; round <= numRounds; round++) {
      for (let i = 0; i < men.length; i++) {
        const womanIndex = (i + round - 1) % women.length;
        await sql`
          INSERT INTO matches (event_id, round_number, user1_id, user2_id)
          VALUES (${eventId}, ${round}, ${men[i]}, ${women[womanIndex]})
          ON CONFLICT DO NOTHING
        `;
        created++;
      }
    }

    // Set event current_round to 1 and status to ongoing
    await sql`
      UPDATE events SET status = 'ongoing', updated_at = NOW() WHERE id = ${eventId}
    `;

    logger.info('Rounds created', { eventId, rounds: numRounds, pairs: created });

    return NextResponse.json({
      success: true,
      message: `Created ${numRounds} rounds with ${created} pairings`,
      rounds: numRounds,
      men: men.length,
      women: women.length
    });
  } catch (error) {
    logger.error('Create rounds error', error);
    return NextResponse.json({ error: 'Failed to create rounds' }, { status: 500 });
  }
}

/**
 * GET /api/events/[id]/rounds?round=1
 * Get pairings for a specific round
 */
async function getHandler(request, { params }) {
  const { userId } = request.user;
  const { id: eventId } = params;
  const { searchParams } = new URL(request.url);
  const round = parseInt(searchParams.get('round') || '1');

  try {
    const result = await sql`
      SELECT
        m.*,
        u1.first_name as user1_name, u1.profile_picture_url as user1_photo, u1.bio as user1_bio,
        u2.first_name as user2_name, u2.profile_picture_url as user2_photo, u2.bio as user2_bio
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.event_id = ${eventId} AND m.round_number = ${round}
        AND (m.user1_id = ${userId} OR m.user2_id = ${userId})
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ match: null, message: 'No match found for this round' });
    }

    const m = result.rows[0];
    const isUser1 = m.user1_id === userId;

    return NextResponse.json({
      success: true,
      match: {
        id: m.id,
        roundNumber: m.round_number,
        partnerId: isUser1 ? m.user2_id : m.user1_id,
        partnerName: isUser1 ? m.user2_name : m.user1_name,
        partnerPhoto: isUser1 ? m.user2_photo : m.user1_photo,
        partnerBio: isUser1 ? m.user2_bio : m.user1_bio,
        myAction: isUser1 ? m.user1_action : m.user2_action,
      }
    });
  } catch (error) {
    logger.error('Get round match error', error);
    return NextResponse.json({ error: 'Failed to get match' }, { status: 500 });
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
export const GET = withErrorHandler(withAuth(getHandler));
