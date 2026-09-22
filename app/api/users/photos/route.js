import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * POST /api/users/photos
 * Upload a photo (demo: stores base64 or URL)
 * For production, integrate AWS S3 or Cloudinary
 */
async function postHandler(request) {
  const { userId } = request.user;

  try {
    const formData = await request.formData();
    const file = formData.get('photo');

    if (!file) {
      return NextResponse.json(
        { error: 'Photo file required' },
        { status: 400 }
      );
    }

    // Convert to base64 for demo
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const photoDataUri = `data:${file.type};base64,${base64}`;

    // In production, upload to S3:
    // const s3Url = await uploadToS3(buffer, file.name, file.type);

    // Save to database
    const result = await sql`
      INSERT INTO user_photos (user_id, photo_url, display_order)
      VALUES (${userId}, ${photoDataUri}, (
        SELECT COALESCE(MAX(display_order), 0) + 1
        FROM user_photos
        WHERE user_id = ${userId}
      ))
      RETURNING *
    `;

    const photo = result.rows[0];
    logger.info('Photo uploaded', { userId, photoId: photo.id });

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: photo.id,
          url: photo.photo_url,
          uploadedAt: photo.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Photo upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/photos
 * Get all photos for current user
 */
async function getHandler(request) {
  const { userId } = request.user;

  try {
    const result = await sql`
      SELECT * FROM user_photos
      WHERE user_id = ${userId}
      ORDER BY display_order ASC
    `;

    logger.info('Photos retrieved', { userId, count: result.rowCount });

    return NextResponse.json(
      {
        success: true,
        photos: result.rows.map(p => ({
          id: p.id,
          url: p.photo_url,
          order: p.display_order,
          uploadedAt: p.created_at
        })),
        total: result.rowCount
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get photos error', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
export const GET = withErrorHandler(withAuth(getHandler));
