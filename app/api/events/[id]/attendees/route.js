import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]/attendees
 * Host/admin: full attendee list with check-in status.
 */
async function getHandler(request, { params }) {
  const { userId } = request.user;
  const { id: eventId } = params;

  try {
    // Fetch event + caller's phone for host/admin check
    const authResult = await sql`
      SELECT e.created_by_user_id, u.phone_number AS caller_phone
      FROM events e
      CROSS JOIN (SELECT phone_number FROM users WHERE id = ${userId}) u
      WHERE e.id = ${eventId}
    `;

    if (authResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { created_by_user_id, caller_phone } = authResult.rows[0];
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
    const isHost = created_by_user_id === userId;
    const isAdmin = adminPhones.includes(caller_phone);

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await sql`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.phone_number,
        er.gender,
        er.created_at AS registered_at,
        eci.checked_in_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      LEFT JOIN event_check_ins eci
        ON eci.user_id = u.id AND eci.event_id = er.event_id
      WHERE er.event_id = ${eventId}
      ORDER BY er.created_at ASC
    `;

    const attendees = result.rows;
    const menCount     = attendees.filter(a => a.gender === 'male').length;
    const womenCount   = attendees.filter(a => a.gender === 'female').length;
    const checkedInCount = attendees.filter(a => a.checked_in_at).length;

    logger.info('Attendees fetched', { eventId, count: attendees.length });

    return NextResponse.json({
      success: true,
      attendees: attendees.map(a => ({
        id: a.id,
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown',
        phone: a.phone_number ? a.phone_number.substring(0, 5) + '***' : '',
        gender: a.gender,
        registeredAt: a.registered_at,
        checkedIn: !!a.checked_in_at,
        checkedInAt: a.checked_in_at,
      })),
      summary: { total: attendees.length, men: menCount, women: womenCount, checkedIn: checkedInCount },
    });
  } catch (error) {
    logger.error('Attendees fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
