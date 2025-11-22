// /app/api/trips/[tripId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';

type Params = { tripId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// GET /api/trips/[tripId] - Get a specific trip
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    // Auth: verify Firebase ID token
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

  // Support Next.js 15 where params may be a Promise
  const { tripId } = await resolveParams(context);
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check if user has access (owner or collaborator)
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    const data = tripSnap.data() as { userId?: string; createdAt?: unknown; updatedAt?: unknown; collaborators?: string[] } | undefined;

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

    const createdAtMs = toMillis(data.createdAt);
    const updatedAtMs = toMillis(data.updatedAt);

    return NextResponse.json(
      {
        trip: {
          id: tripSnap.id,
          ...data,
          ...(createdAtMs ? { createdAt: new Date(createdAtMs).toISOString() } : {}),
          ...(updatedAtMs ? { updatedAt: new Date(updatedAtMs).toISOString() } : {}),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId] GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/trips/[tripId] - Update a specific trip
export async function PUT(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    // Auth
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

  const { tripId } = await resolveParams(context);
    const updateData = await req.json();

    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check if user has access (owner or collaborator)
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    // Prevent ownership/creation timestamp changes
    // Only owner can modify collaborators
    const safeUpdate = { ...(updateData || {}) } as Record<string, unknown>;
    delete safeUpdate.userId;
    delete safeUpdate.createdAt;
    if (!accessCheck.isOwner && 'collaborators' in safeUpdate) {
      delete safeUpdate.collaborators;
    }
    const updatedTrip = {
      ...safeUpdate,
      updatedAt: Timestamp.now(),
    };

    await tripRef.update(updatedTrip);

    return NextResponse.json({ message: 'Trip updated successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId] PUT:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/trips/[tripId] - Delete a specific trip
export async function DELETE(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    // Auth
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

  const { tripId } = await resolveParams(context);
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Only owner can delete trips
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can delete this trip' }, { status: 403 });
    }

    await tripRef.delete();

    return NextResponse.json({ message: 'Trip deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId] DELETE:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';