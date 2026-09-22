import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * POST /api/events/[id]/join
 * User registers for an event
 */
async function postHandler(request, { params }) {
  const { userId } = request.user;
  const { id: eventId } = params;

  try {
    const { gender, genderBalancePreference } = await request.json();

    if (!gender || !genderBalancePreference) {
      return NextResponse.json(
        { error: 'Gender and preference required' },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingResult = await sql`
      SELECT id FROM event_registrations
      WHERE event_id = ${eventId} AND user_id = ${userId}
    `;

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      );
    }

    // Check event capacity
    const eventResult = await sql`
      SELECT e.*, COUNT(DISTINCT er.id) as registered_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.id = ${eventId}
      GROUP BY e.id
    `;

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];
    if (event.registered_count >= event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      );
    }

    // Register user
    const registrationResult = await sql`
      INSERT INTO event_registrations (
        event_id, user_id, gender, gender_balance_preference
      ) VALUES (${eventId}, ${userId}, ${gender}, ${genderBalancePreference})
      RETURNING *
    `;

    logger.info('User joined event', { userId, eventId });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined event',
        registration: {
          id: registrationResult.rows[0].id,
          eventId,
          userId,
          createdAt: registrationResult.rows[0].created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Event join error', error);
    return NextResponse.json(
      { error: 'Failed to join event' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
