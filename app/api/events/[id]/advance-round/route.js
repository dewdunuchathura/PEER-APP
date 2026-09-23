import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/advance-round
 * Host/admin: advance the event to the next round.
 * Sets current_round, round_started_at, round_ends_at on the events row.
 * All clients polling /status will pick up the new round automatically.
 */
async function postHandler(request, { params }) {
  const { userId } = request.user;
  const { id: eventId } = params;

  try {
    // Fetch event + caller's phone for admin check
    const eventResult = await sql`
      SELECT e.*, u.phone_number AS caller_phone
      FROM events e
      CROSS JOIN (SELECT phone_number FROM users WHERE id = ${userId}) u
      WHERE e.id = ${eventId}
    `;

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ev = eventResult.rows[0];

    // Check host or server-side admin list
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
    const isHost = ev.created_by_user_id === userId;
    const isAdmin = adminPhones.includes(ev.caller_phone);

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the event host or an admin can advance rounds' }, { status: 403 });
    }

    if (ev.status === 'completed') {
      return NextResponse.json({ error: 'Event is already completed', completed: true }, { status: 400 });
    }

    const currentRound = ev.current_round || 0;
    const numRounds = ev.num_rounds || 6;
    const roundDuration = ev.round_duration_seconds || 120;

    if (currentRound >= numRounds) {
      await sql`
        UPDATE events SET status = 'completed', updated_at = NOW()
        WHERE id = ${eventId}
      `;
      logger.info('Event marked completed', { eventId });
      return NextResponse.json({ success: true, completed: true, message: 'All rounds done — event completed' });
    }

    const nextRound = currentRound + 1;
    const roundEndsAt = new Date(Date.now() + roundDuration * 1000);

    await sql`
      UPDATE events SET
        current_round = ${nextRound},
        round_started_at = NOW(),
        round_ends_at = ${roundEndsAt.toISOString()},
        status = 'ongoing',
        updated_at = NOW()
      WHERE id = ${eventId}
    `;

    logger.info('Round advanced', { eventId, nextRound, roundEndsAt });

    return NextResponse.json({
      success: true,
      currentRound: nextRound,
      numRounds,
      roundEndsAt: roundEndsAt.toISOString(),
      timeRemainingSeconds: roundDuration,
      completed: false,
    });
  } catch (error) {
    logger.error('Advance round error', error);
    return NextResponse.json({ error: 'Failed to advance round' }, { status: 500 });
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
