import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';
import { validatePhone } from '@/lib/validators';
import { generateOTP, sendOTPviaSMS, isOTPValid, getOTPServiceStatus } from '@/lib/otp-service';

/**
 * POST /api/auth/send-otp
 * Generate and send OTP code via SMS
 * Comprehensive error handling and logging
 */
async function postHandler(request) {
  const requestId = Math.random().toString(36).substring(7);
  const logContext = { requestId, endpoint: '/api/auth/send-otp' };

  try {
    logger.info('OTP request received', logContext);

    // Parse request body
    let phoneNumber;
    try {
      const body = await request.json();
      phoneNumber = body?.phone_number;
    } catch (parseError) {
      logger.error('Failed to parse request body', {
        ...logContext,
        error: parseError.message
      });
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // ── Rate limiting: max 5 OTP sends per phone per hour ──────
    try {
      const rlResult = await sql`
        INSERT INTO otp_rate_limit (phone_number, send_count, window_start)
        VALUES (${phoneNumber}, 1, NOW())
        ON CONFLICT (phone_number) DO UPDATE SET
          send_count = CASE
            WHEN otp_rate_limit.window_start < NOW() - INTERVAL '1 hour' THEN 1
            ELSE otp_rate_limit.send_count + 1
          END,
          window_start = CASE
            WHEN otp_rate_limit.window_start < NOW() - INTERVAL '1 hour' THEN NOW()
            ELSE otp_rate_limit.window_start
          END
        RETURNING send_count
      `;
      if (rlResult.rows[0]?.send_count > 5) {
        logger.warn('OTP rate limit exceeded', { ...logContext, phone: phoneNumber.substring(0, 5) + '***' });
        return NextResponse.json(
          { error: 'Too many OTP requests. Please wait before trying again.' },
          { status: 429 }
        );
      }
    } catch (rlError) {
      // If rate limit table doesn't exist yet, log and continue
      logger.warn('Rate limit check skipped', { ...logContext, error: rlError.message });
    }

    // Validate phone number
    if (!phoneNumber) {
      logger.warn('Phone number missing from request', logContext);
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!validatePhone(phoneNumber)) {
      logger.warn('Invalid phone number format', {
        ...logContext,
        phoneNumber: phoneNumber.substring(0, 5) + '***' // Don't log full number
      });
      return NextResponse.json(
        { 
          error: 'Invalid phone number. Use E.164 format (+1234567890)',
          format: '+1 followed by 10-15 digits'
        },
        { status: 400 }
      );
    }

    // Generate OTP
    let otpCode;
    try {
      otpCode = generateOTP();
      logger.debug('OTP generated', { ...logContext, otpLength: otpCode.length });
    } catch (generateError) {
      logger.error('Failed to generate OTP', {
        ...logContext,
        error: generateError.message
      });
      return NextResponse.json(
        { error: 'Failed to generate OTP code' },
        { status: 500 }
      );
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    try {
      logger.info('Storing OTP in database', {
        ...logContext,
        expiresAt: expiresAt.toISOString()
      });

      await sql`
        INSERT INTO otp_verification (phone_number, otp_code, expires_at)
        VALUES (${phoneNumber}, ${otpCode}, ${expiresAt})
      `;

      logger.info('OTP stored successfully', logContext);
    } catch (dbError) {
      logger.error('Database error storing OTP', {
        ...logContext,
        error: dbError.message,
        code: dbError.code
      });

      // Check if it's a constraint violation (retry scenario)
      if (dbError.code === '23505') {
        logger.info('OTP already exists for this phone, updating', logContext);
        try {
          await sql`
            UPDATE otp_verification 
            SET otp_code = ${otpCode}, expires_at = ${expiresAt}
            WHERE phone_number = ${phoneNumber}
          `;
        } catch (updateError) {
          logger.error('Failed to update OTP', {
            ...logContext,
            error: updateError.message
          });
          return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to store OTP' },
          { status: 500 }
        );
      }
    }

    // Send OTP via SMS
    let smsResult = { mode: 'demo' };
    try {
      logger.info('Attempting to send OTP via SMS', logContext);
      smsResult = await sendOTPviaSMS(phoneNumber, otpCode);
      logger.info('OTP SMS sending result', {
        ...logContext,
        mode: smsResult.mode,
        messageSid: smsResult.messageSid || 'demo'
      });
    } catch (smsError) {
      logger.error('SMS sending failed', {
        ...logContext,
        error: smsError.message,
        smsMode: smsResult.mode
      });

      // In demo mode, continue. In live mode, this is an error
      if (smsResult.mode === 'live') {
        return NextResponse.json(
          { 
            error: `SMS delivery failed: ${smsError.message}`,
            requestId
          },
          { status: 500 }
        );
      }

      logger.warn('Continuing in demo mode despite SMS error', logContext);
    }

    // Success response
    logger.info('OTP request successful', {
      ...logContext,
      mode: smsResult.mode,
      expiresIn: 600
    });

    const response = {
      success: true,
      requestId,
      message: smsResult.mode === 'live'
        ? 'OTP sent to your phone'
        : 'OTP generated (demo mode - SMS not configured)',
      expiresIn: 600, // 10 minutes in seconds
      mode: smsResult.mode,
      serviceSid: smsResult.messageSid || null
    };

    // Only return OTP in demo mode AND non-production environment
    if (smsResult.mode === 'demo' && process.env.NODE_ENV !== 'production') {
      response.demo_otp = otpCode;
      response.demo_note = 'For testing only - use this code to verify';
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('Unexpected error in send-otp', {
      ...logContext,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        requestId
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/send-otp/status
 * Health check for OTP service
 */
async function getHandler(request) {
  try {
    const status = getOTPServiceStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    logger.error('Error getting OTP service status', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}

export const POST = postHandler;
export const GET = getHandler;
