import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/events
 * List all upcoming events with pagination
 */
async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await sql`
      SELECT 
        e.*,
        COUNT(DISTINCT er.id) as registered_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.status IN ('scheduled', 'ongoing')
        AND e.date >= CURRENT_DATE
      GROUP BY e.id
      ORDER BY e.date ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    logger.info('Events listed', { count: result.rows.length });

    return NextResponse.json(
      {
        success: true,
        events: result.rows.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          startTime: event.start_time,
          location: {
            name: event.location_name,
            address: event.location_address,
            latitude: event.location_lat,
            longitude: event.location_lng
          },
          capacity: event.max_participants,
          registered: event.registered_count,
          spotsAvailable: event.max_participants - event.registered_count,
          status: event.status,
          roundDuration: event.round_duration_seconds,
          numRounds: event.num_rounds
        })),
        total: result.rowCount,
        limit,
        offset
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Events listing error', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event (admin only)
 */
async function postHandler(request) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      title,
      description,
      date,
      startTime,
      location_name,
      location_address,
      location_lat,
      location_lng,
      maxParticipants = 28,
      numRounds = 6
    } = await request.json();

    if (!title || !date || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO events (
        title, description, date, start_time,
        location_name, location_address, location_lat, location_lng,
        max_participants, num_rounds, created_by_user_id, status
      ) VALUES (
        ${title}, ${description}, ${date}, ${startTime},
        ${location_name}, ${location_address}, ${location_lat}, ${location_lng},
        ${maxParticipants}, ${numRounds}, ${request.user.userId}, 'scheduled'
      )
      RETURNING *
    `;

    const event = result.rows[0];
    logger.info('Event created', { eventId: event.id, title });

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          startTime: event.start_time,
          createdAt: event.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Event creation error', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(withAuth(postHandler));
