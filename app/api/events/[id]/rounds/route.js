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
    // Get ALL registered users (pair by registration order if gender missing)
    const allResult = await sql`
      SELECT er.user_id, er.gender FROM event_registrations er
      WHERE er.event_id = ${eventId}
      ORDER BY er.created_at ASC
    `;

    let men = allResult.rows.filter(r => r.gender === 'male').map(r => r.user_id);
    let women = allResult.rows.filter(r => r.gender === 'female').map(r => r.user_id);

    // Fallback: if no gender data, split by registration order
    if (men.length === 0 || women.length === 0) {
      const all = allResult.rows.map(r => r.user_id);
      men = all.filter((_, i) => i % 2 === 0);
      women = all.filter((_, i) => i % 2 !== 0);
    }

    if (men.length === 0 || women.length === 0) {
      return NextResponse.json(
        { error: 'Need at least 2 registered users' },
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
        u1.first_name as user1_name, u1.last_name as user1_lastname,
        u1.profile_picture_url as user1_photo, u1.bio as user1_bio,
        u1.location_city as user1_city, u1.location_country as user1_country,
        u2.first_name as user2_name, u2.last_name as user2_lastname,
        u2.profile_picture_url as user2_photo, u2.bio as user2_bio,
        u2.location_city as user2_city, u2.location_country as user2_country
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

    const partnerCity = isUser1 ? m.user2_city : m.user1_city;
    const partnerCountry = isUser1 ? m.user2_country : m.user1_country;
    const partnerLocation = [partnerCity, partnerCountry].filter(Boolean).join(', ');

    return NextResponse.json({
      success: true,
      match: {
        id: m.id,
        roundNumber: m.round_number,
        partnerId: isUser1 ? m.user2_id : m.user1_id,
        partnerName: isUser1 ? `${m.user2_name || ''} ${m.user2_lastname || ''}`.trim() : `${m.user1_name || ''} ${m.user1_lastname || ''}`.trim(),
        partnerPhoto: isUser1 ? m.user2_photo : m.user1_photo,
        partnerBio: isUser1 ? m.user2_bio : m.user1_bio,
        partnerLocation,
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
