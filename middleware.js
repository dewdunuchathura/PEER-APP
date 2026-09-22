import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-min-32-characters-required'
);

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = [
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/health'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - check JWT
  const token = extractTokenFromBearer(request.headers.get('authorization'));

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authorization token' },
      { status: 401 }
    );
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', verified.payload.user_id);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

function extractTokenFromBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export const config = {
  matcher: ['/api/:path*'],
};
