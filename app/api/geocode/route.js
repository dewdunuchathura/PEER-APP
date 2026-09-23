import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware';

export const dynamic = 'force-dynamic';

// Simple in-memory LRU-style cache: query → { data, ts }
const geocodeCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 500;

/**
 * GET /api/geocode?q=london
 * Proxies Nominatim with proper User-Agent and server-side caching.
 * Clients must never call Nominatim directly (rate-limit / ToS reasons).
 */
async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.data });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&featuretype=city&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Peard Dating App/1.0',
          'Accept-Language': 'en',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = data
      .map(item => {
        const a = item.address;
        const city = a.city || a.town || a.village || a.county || item.display_name.split(',')[0];
        const country = a.country || '';
        return { label: `${city}, ${country}`, lat: item.lat, lon: item.lon };
      })
      .filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i);

    // Evict oldest entry if cache is full
    if (geocodeCache.size >= MAX_CACHE_SIZE) {
      geocodeCache.delete(geocodeCache.keys().next().value);
    }
    geocodeCache.set(cacheKey, { data: results, ts: Date.now() });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocode proxy error', error);
    return NextResponse.json({ results: [] });
  }
}

export const GET = withErrorHandler(getHandler);
