import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';

/**
 * POST /api/qr-scan
 * Handle QR code scan for event check-in
 */
export async function POST(request) {
  try {
    const { qr_data, user_id, event_id } = await request.json();

    if (!qr_data || !user_id || !event_id) {
      return NextResponse.json(
        { error: 'Missing required fields: qr_data, user_id, event_id' },
        { status: 400 }
      );
    }

    // Verify QR code format (should be event ID encoded)
    if (!qr_data.includes(event_id)) {
      return NextResponse.json(
        { error: 'Invalid QR code for this event' },
        { status: 400 }
      );
    }

    // Check if user is registered for this event
    const registrationCheck = await sql`
      SELECT id FROM event_registrations
      WHERE user_id = ${user_id} AND event_id = ${event_id}
    `;

    if (registrationCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not registered for this event' },
        { status: 403 }
      );
    }

    // Record check-in
    const checkInResult = await sql`
      INSERT INTO event_check_ins (user_id, event_id, checked_in_at)
      VALUES (${user_id}, ${event_id}, NOW())
      ON CONFLICT (user_id, event_id) DO UPDATE
      SET checked_in_at = NOW()
      RETURNING id, checked_in_at
    `;

    logger.info('User checked in via QR', { user_id, event_id });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully checked in to event',
        check_in: {
          id: checkInResult.rows[0].id,
          checked_in_at: checkInResult.rows[0].checked_in_at
        }
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('QR scan error', error);
    return NextResponse.json(
      { error: 'Failed to process QR scan' },
      { status: 500 }
    );
  }
}
