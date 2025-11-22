// /app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

// GET /api/trips - Fetch all trips for authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth: verify Firebase ID token
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId !== authUid) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other users\' trips' }, { status: 403 });
    }

    // Helper to normalize various timestamp shapes to epoch ms
    const toMillis = (value: unknown): number => {
      if (value && typeof value === 'object') {
        type TS1 = { toMillis: () => number };
        type TS2 = { toDate: () => Date };
        type TS3 = { _seconds?: number; _nanoseconds?: number; seconds?: number; nanoseconds?: number };
        const v = value as Record<string, unknown>;
        if ('toMillis' in v && typeof (v as TS1).toMillis === 'function') return (v as TS1).toMillis();
        if ('toDate' in v && typeof (v as TS2).toDate === 'function') return (v as TS2).toDate().getTime();
        const raw = value as TS3;
        const secs = raw._seconds ?? raw.seconds;
        const nanos = raw._nanoseconds ?? raw.nanoseconds;
        if (typeof secs === 'number') return secs * 1000 + Math.round((typeof nanos === 'number' ? nanos : 0) / 1e6);
      }
      if (typeof value === 'string' || value instanceof Date || typeof value === 'number') {
        const d = value instanceof Date ? value : new Date(value as string | number);
        return d.getTime() || 0;
      }
      return 0;
    };

    // Query trips owned by user
    const ownedTripsQuery = adminDb.collection('trips').where('userId', '==', userId);
    const ownedTripsSnapshot = await ownedTripsQuery.get();

    // Query trips where user is a collaborator
    const collaboratedTripsQuery = adminDb.collection('trips').where('collaborators', 'array-contains', userId);
    const collaboratedTripsSnapshot = await collaboratedTripsQuery.get();

    // Combine both results and deduplicate by trip ID
    const tripMap = new Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; isOwner: boolean }>();

    // Add owned trips
    ownedTripsSnapshot.docs.forEach((doc) => {
      tripMap.set(doc.id, { doc, isOwner: true });
    });

    // Add collaborated trips (only if not already added as owned)
    collaboratedTripsSnapshot.docs.forEach((doc) => {
      if (!tripMap.has(doc.id)) {
        tripMap.set(doc.id, { doc, isOwner: false });
      }
    });

    // Sort newest first in-memory to avoid requiring a composite index
    const trips = Array.from(tripMap.values())
      .map(({ doc, isOwner }) => {
        const data = doc.data() as Record<string, unknown>;
        const createdAtMs = toMillis(data.createdAt);
        const updatedAtMs = toMillis(data.updatedAt);
        return {
          id: doc.id,
          ...data,
          isOwner, // Add flag to indicate if user is owner or collaborator
          ...(createdAtMs ? { createdAt: new Date(createdAtMs).toISOString() } : {}),
          ...(updatedAtMs ? { updatedAt: new Date(updatedAtMs).toISOString() } : {}),
        };
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => toMillis(b.createdAt) - toMillis(a.createdAt));

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips - Create a new trip
// Note: Trip creation in this app is handled by /api/trips/generate.
// Keeping this POST to avoid breaking clients, but returning 405 to steer usage.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Use /api/trips/generate to create trips.' },
    { status: 405 }
  );
}

export const dynamic = 'force-dynamic';