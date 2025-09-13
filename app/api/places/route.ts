import { NextRequest, NextResponse } from 'next/server';
import type { NextApiHandler } from 'next';

interface PlacesRequest {
  destination: string;
  interests: string[];
}

interface PlaceResult {
  placeId: string;
  name: string;
  types: string[];
  rating: number;
  userRatingCount: number;
  photoReference?: string;
}

interface PlacesResponse {
  places: PlaceResult[];
}

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.types',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
].join(',');

// --- Firebase Auth Verification ---
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}

async function verifyFirebaseToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function buildQueries(destination: string, interests: string[]): string[] {
  // Map interests to query templates
  const templates: Record<string, string> = {
    food: 'best restaurants in',
    history: 'historical landmarks in',
    adventure: 'adventure activities in',
    nature: 'nature spots in',
    shopping: 'shopping places in',
    nightlife: 'nightlife in',
    art: 'art galleries in',
    beaches: 'beaches in',
    mountains: 'mountains in',
    // fallback
    default: 'attractions in',
  };
  const queries = interests.map(
    (interest) => `${templates[interest] || templates.default} ${destination}`
  );
  // Always add a general attractions query
  queries.push(`top attractions in ${destination}`);
  return Array.from(new Set(queries));
}

async function fetchPlaces(query: string): Promise<PlaceResult[]> {
  const res = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 10,
      languageCode: 'en',
    }),
  });
  if (!res.ok) throw new Error('Google Places API error');
  const data = await res.json();
  return (
    data.places || []
  ).map((p: any) => ({
    placeId: p.id,
    name: p.displayName?.text || '',
    types: p.types || [],
    rating: p.rating || 0,
    userRatingCount: p.userRatingCount || 0,
    photoReference: p.photos?.[0]?.name,
  }));
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const uid = await verifyFirebaseToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Parse & Validate Body ---
  let body: PlacesRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.destination || !Array.isArray(body.interests)) {
    return NextResponse.json({ error: 'Missing destination or interests' }, { status: 400 });
  }

  // --- Google Places API Calls ---
  try {
    const queries = buildQueries(body.destination, body.interests);
    const results = await Promise.all(
      queries.map((q) => fetchPlaces(q))
    );
    // Flatten, dedupe by placeId, prioritize by userRatingCount
    const allPlaces = results.flat();
    const deduped: Record<string, PlaceResult> = {};
    for (const place of allPlaces) {
      if (
        !deduped[place.placeId] ||
        place.userRatingCount > deduped[place.placeId].userRatingCount
      ) {
        deduped[place.placeId] = place;
      }
    }
    // Sort by userRatingCount desc, then rating desc
    const places = Object.values(deduped)
      .sort((a, b) => b.userRatingCount - a.userRatingCount || b.rating - a.rating)
      .slice(0, 30);
    return NextResponse.json({ places } satisfies PlacesResponse);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
