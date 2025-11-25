// /app/api/public_trips/[id]/cloned-trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

const resolveParams = async (context: RouteParams): Promise<{ id: string }> => {
  const p = context?.params instanceof Promise ? await context.params : context.params;
  return p;
};

// GET /api/public_trips/[id]/cloned-trip - Get the cloned trip ID for a purchased public trip
export async function GET(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { id } = await resolveParams(context);

    // Check if user has purchased this trip
    const purchasesRef = adminDb.collection('public_trip_purchases');
    const purchaseCheck = await purchasesRef
      .where('user_id', '==', userId)
      .where('trip_id', '==', id)
      .get();

    if (purchaseCheck.empty) {
      return NextResponse.json({ error: 'Trip not purchased' }, { status: 404 });
    }

    // Find the cloned trip by searching for trips with clonedFrom metadata
    const tripsRef = adminDb.collection('trips');
    const clonedTrips = await tripsRef
      .where('userId', '==', userId)
      .where('clonedFrom.public_trip_id', '==', id)
      .limit(1)
      .get();

    if (clonedTrips.empty) {
      return NextResponse.json({ error: 'Cloned trip not found' }, { status: 404 });
    }

    const clonedTrip = clonedTrips.docs[0];
    return NextResponse.json({
      trip_id: clonedTrip.id,
      trip: {
        id: clonedTrip.id,
        ...clonedTrip.data(),
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/public_trips/[id]/cloned-trip GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

