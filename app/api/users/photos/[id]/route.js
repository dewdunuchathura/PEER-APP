import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth, withErrorHandler } from '@/middleware';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/users/photos/[id]
 * Delete a photo
 */
async function deleteHandler(request, { params }) {
  const { userId } = request.user;
  const { id: photoId } = params;

  try {
    // Verify ownership
    const photoResult = await sql`
      SELECT * FROM user_photos
      WHERE id = ${photoId} AND user_id = ${userId}
    `;

    if (photoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await sql`
      DELETE FROM user_photos
      WHERE id = ${photoId}
    `;

    // In production, also delete from S3:
    // await deleteFromS3(photoResult.rows[0].photo_url);

    logger.info('Photo deleted', { userId, photoId });

    return NextResponse.json(
      {
        success: true,
        message: 'Photo deleted'
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Delete photo error', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

export const DELETE = withErrorHandler(withAuth(deleteHandler));
