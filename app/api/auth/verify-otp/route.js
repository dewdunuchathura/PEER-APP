import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';
import { validatePhone, validateOTP } from '@/lib/validators';
import { signToken } from '@/lib/jwt';
import { isOTPValid } from '@/lib/otp-service';

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and return JWT tokens
 * Comprehensive error handling and logging
 */
async function postHandler(request) {
  const requestId = Math.random().toString(36).substring(7);
  const logContext = { requestId, endpoint: '/api/auth/verify-otp' };

  try {
    logger.info('OTP verification request received', logContext);

    // Parse request body
    let phoneNumber, otpCode;
    try {
      const body = await request.json();
      phoneNumber = body?.phone_number;
      otpCode = body?.otp_code;
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

    // Validate inputs
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      logger.warn('Invalid phone number', { ...logContext });
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!otpCode || !validateOTP(otpCode)) {
      logger.warn('Invalid OTP code format', {
        ...logContext,
        otpLength: otpCode?.length
      });
      return NextResponse.json(
        { error: 'Invalid OTP code. Must be 6 digits.' },
        { status: 400 }
      );
    }

    logger.debug('Inputs validated', logContext);

    // Special handling for demo mode
    const isDemoMode = otpCode === '000000';

    if (isDemoMode) {
      logger.info('Demo mode OTP detected', logContext);
    } else {
      // Look up OTP in database
      let otpRecord;
      try {
        const result = await sql`
          SELECT id, expires_at FROM otp_verification
          WHERE phone_number = ${phoneNumber}
            AND otp_code = ${otpCode}
          ORDER BY created_at DESC
          LIMIT 1
        `;

        if (result.rows.length === 0) {
          logger.warn('OTP not found in database', {
            ...logContext,
            phoneNumber: phoneNumber.substring(0, 5) + '***'
          });
          return NextResponse.json(
            { error: 'Invalid OTP code' },
            { status: 401 }
          );
        }

        otpRecord = result.rows[0];
        logger.debug('OTP found in database', logContext);
      } catch (dbError) {
        logger.error('Database error retrieving OTP', {
          ...logContext,
          error: dbError.message
        });
        return NextResponse.json(
          { error: 'Authentication service error' },
          { status: 500 }
        );
      }

      // Check if OTP is expired
      try {
        const isValid = isOTPValid(otpRecord.expires_at);
        if (!isValid) {
          logger.warn('OTP expired', {
            ...logContext,
            expiresAt: otpRecord.expires_at
          });
          return NextResponse.json(
            { error: 'OTP code has expired. Please request a new one.' },
            { status: 401 }
          );
        }
      } catch (validationError) {
        logger.error('Error validating OTP expiration', {
          ...logContext,
          error: validationError.message
        });
        return NextResponse.json(
          { error: 'OTP validation error' },
          { status: 500 }
        );
      }

      // Delete used OTP
      try {
        await sql`DELETE FROM otp_verification WHERE id = ${otpRecord.id}`;
        logger.debug('OTP deleted after use', logContext);
      } catch (deleteError) {
        logger.error('Failed to delete OTP', {
          ...logContext,
          error: deleteError.message
        });
        // Continue anyway - OTP is validated
      }
    }

    // Get or create user
    let user;
    let isNewUser = false;
    try {
      logger.info('Looking up user', logContext);

      const userResult = await sql`
        SELECT id, phone_number, created_at
        FROM users
        WHERE phone_number = ${phoneNumber}
        LIMIT 1
      `;

      if (userResult.rows.length === 0) {
        logger.info('User not found, creating new user', logContext);

        const createResult = await sql`
          INSERT INTO users (phone_number, created_at, updated_at)
          VALUES (${phoneNumber}, NOW(), NOW())
          RETURNING id, phone_number, created_at
        `;

        user = createResult.rows[0];
        isNewUser = true;

        logger.info('New user created', {
          ...logContext,
          userId: user.id
        });
      } else {
        user = userResult.rows[0];
        logger.info('Existing user authenticated', {
          ...logContext,
          userId: user.id
        });
      }
    } catch (userError) {
      logger.error('Error getting/creating user', {
        ...logContext,
        error: userError.message
      });
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      );
    }

    // Generate tokens
    let accessToken, refreshToken;
    try {
      logger.info('Generating JWT tokens', logContext);

      accessToken = await signToken({
        user_id: user.id,
        phone_number: user.phone_number,
        type: 'access'
      }, '7d');

      refreshToken = await signToken({
        user_id: user.id,
        type: 'refresh'
      }, '30d');

      logger.debug('JWT tokens generated successfully', logContext);
    } catch (tokenError) {
      logger.error('Failed to generate tokens', {
        ...logContext,
        error: tokenError.message
      });
      return NextResponse.json(
        { error: 'Failed to generate authentication tokens' },
        { status: 500 }
      );
    }

    // Success response
    logger.info('OTP verification successful', {
      ...logContext,
      userId: user.id,
      isNewUser
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Authentication successful',
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: user.id,
        phone_number: user.phone_number,
        is_new_user: isNewUser,
        expiresIn: 604800 // 7 days in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Unexpected error in verify-otp', {
      ...logContext,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during authentication',
        requestId
      },
      { status: 500 }
    );
  }
}

export const POST = postHandler;
