import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withErrorHandler } from '@/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]/status
 * Public endpoint — returns current round state for real-time client polling.
 * No auth required so all clients can poll efficiently.
 */
async function getHandler(request, { params }) {
  const { id: eventId } = params;

  try {
    const result = await sql`
      SELECT
        e.status,
        e.current_round,
        e.num_rounds,
        e.round_duration_seconds,
        e.round_started_at,
        e.round_ends_at,
        COUNT(DISTINCT CASE WHEN er.gender = 'male'   THEN er.id END) as men_count,
        COUNT(DISTINCT CASE WHEN er.gender = 'female' THEN er.id END) as women_count,
        COUNT(DISTINCT er.id) as total_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.id = ${eventId}
      GROUP BY e.id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ev = result.rows[0];
    const now = new Date();
    const roundEndsAt = ev.round_ends_at ? new Date(ev.round_ends_at) : null;
    const timeRemaining = roundEndsAt
      ? Math.max(0, Math.floor((roundEndsAt - now) / 1000))
      : null;

    return NextResponse.json({
      success: true,
      status: ev.status,
      currentRound: ev.current_round || 0,
      numRounds: ev.num_rounds,
      roundDurationSeconds: ev.round_duration_seconds,
      roundEndsAt: ev.round_ends_at,
      timeRemainingSeconds: timeRemaining,
      menCount: parseInt(ev.men_count) || 0,
      womenCount: parseInt(ev.women_count) || 0,
      totalCount: parseInt(ev.total_count) || 0,
    });
  } catch (error) {
    console.error('Event status error', error);
    return NextResponse.json({ error: 'Failed to get event status' }, { status: 500 });
  }
}

export const GET = withErrorHandler(getHandler);
