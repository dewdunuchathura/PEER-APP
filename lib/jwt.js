'use server';

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-min-32-characters-required'
);

export async function signToken(payload, expiresIn = '7d') {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(JWT_SECRET);
    return token;
  } catch (error) {
    console.error('JWT sign error:', error);
    throw new Error('Failed to sign token');
  }
}

export async function verifyToken(token) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch (error) {
    console.error('JWT verify error:', error);
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
