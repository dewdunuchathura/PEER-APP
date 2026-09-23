import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';
import {
  validateEmail,
  validateName,
  validateBio,
  validateInterests,
  validateHeight,
  validateZodiac,
  validateInstagram,
  validateDOB,
  sanitize
} from '@/lib/validators';

/**
 * GET /api/users
 * Get current user profile
 */
async function getHandler(request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID not found' },
      { status: 400 }
    );
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error('GET /api/users error', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users
 * Update user profile
 */
async function putHandler(request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID not found' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      bio,
      interests,
      height_cm,
      zodiac_sign,
      instagram_handle,
      location_city,
      location_state,
      location_country,
      birth_date,
    } = body;

    // Validate date of birth — must be 18+
    if (birth_date) {
      const dobResult = validateDOB(birth_date);
      if (!dobResult.valid) {
        const msg = dobResult.reason === 'minor'
          ? 'You must be 18 or older to use this app'
          : dobResult.reason === 'future_date'
            ? 'Date of birth cannot be in the future'
            : 'Invalid date of birth';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Validate inputs
    if (first_name && !validateName(first_name)) {
      return NextResponse.json(
        { error: 'Invalid first name' },
        { status: 400 }
      );
    }

    if (last_name && !validateName(last_name)) {
      return NextResponse.json(
        { error: 'Invalid last name' },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    if (bio && !validateBio(bio)) {
      return NextResponse.json(
        { error: 'Bio too long (max 500 chars)' },
        { status: 400 }
      );
    }

    if (interests && !validateInterests(interests)) {
      return NextResponse.json(
        { error: 'Invalid interests' },
        { status: 400 }
      );
    }

    if (height_cm && !validateHeight(height_cm)) {
      return NextResponse.json(
        { error: 'Invalid height' },
        { status: 400 }
      );
    }

    if (zodiac_sign && !validateZodiac(zodiac_sign)) {
      return NextResponse.json(
        { error: 'Invalid zodiac sign' },
        { status: 400 }
      );
    }

    if (instagram_handle && !validateInstagram(instagram_handle)) {
      return NextResponse.json(
        { error: 'Invalid Instagram handle' },
        { status: 400 }
      );
    }

    const updateData = {
      first_name: first_name ? sanitize(first_name) : undefined,
      last_name: last_name ? sanitize(last_name) : undefined,
      email: email ? sanitize(email) : undefined,
      bio: bio ? sanitize(bio) : undefined,
      interests: interests ? JSON.stringify(interests) : undefined,
      height_cm,
      zodiac_sign,
      instagram_handle: instagram_handle ? sanitize(instagram_handle) : undefined,
      location_city: location_city ? sanitize(location_city) : undefined,
      location_state: location_state ? sanitize(location_state) : undefined,
      location_country: location_country ? sanitize(location_country) : undefined,
      birth_date: birth_date || undefined,
    };

    const updatedUser = await updateUser(userId, updateData);

    logger.info('User profile updated', { userId });

    return NextResponse.json(
      {
        success: true,
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('PUT /api/users error', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
export const PUT = withErrorHandler(withAuth(putHandler));
