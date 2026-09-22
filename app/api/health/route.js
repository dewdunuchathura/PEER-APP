import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
async function getHandler(request) {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbResult = await sql`SELECT 1`;
    const dbTime = Date.now() - startTime;

    if (dbResult.rowCount === 0) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Database connection slow',
          timestamp: new Date().toISOString(),
          dbResponseTime: `${dbTime}ms`
        },
        { status: 503 }
      );
    }

    logger.info('Health check passed', { dbTime });

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dbResponseTime: `${dbTime}ms`,
        uptime: process.uptime(),
        version: '1.0.0'
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Health check failed', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

export const GET = getHandler;
