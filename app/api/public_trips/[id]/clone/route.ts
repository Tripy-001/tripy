// /app/api/public_trips/[id]/clone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

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

// POST /api/public_trips/[id]/clone - Clone a public trip for the purchaser
export async function POST(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { id } = await resolveParams(context);

    // Verify the public trip exists
    const publicTripRef = adminDb.collection('public_trips').doc(id);
    const publicTripSnap = await publicTripRef.get();

    if (!publicTripSnap.exists) {
      return NextResponse.json({ error: 'Public trip not found' }, { status: 404 });
    }

    const publicTripData = publicTripSnap.data();
    if (!publicTripData) {
      return NextResponse.json({ error: 'Public trip data not found' }, { status: 404 });
    }

    // Verify user has purchased this trip
    const purchasesRef = adminDb.collection('public_trip_purchases');
    const purchaseCheck = await purchasesRef
      .where('user_id', '==', userId)
      .where('trip_id', '==', id)
      .get();

    if (purchaseCheck.empty) {
      return NextResponse.json({ 
        error: 'You must purchase this trip before cloning it',
        requires_purchase: true 
      }, { status: 403 });
    }

    // Get the original trip data from trips collection
    const sourceTripId = publicTripData.source_trip_id;
    if (!sourceTripId) {
      return NextResponse.json({ error: 'Source trip ID not found' }, { status: 404 });
    }

    const originalTripRef = adminDb.collection('trips').doc(sourceTripId);
    const originalTripSnap = await originalTripRef.get();

    if (!originalTripSnap.exists) {
      return NextResponse.json({ error: 'Original trip not found' }, { status: 404 });
    }

    const originalTripData = originalTripSnap.data();
    if (!originalTripData) {
      return NextResponse.json({ error: 'Original trip data not found' }, { status: 404 });
    }

    // Create a new trip document with the purchaser as the owner
    const newTripRef = adminDb.collection('trips').doc();
    const clonedTripData = {
      userId: userId, // Purchaser becomes the owner
      collaborators: [], // Start with no collaborators
      status: originalTripData.status || 'planning',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userInput: originalTripData.userInput || {},
      itinerary: originalTripData.itinerary || null,
      title: originalTripData.title || publicTripData.title || 'Cloned Trip',
      summary: originalTripData.summary || publicTripData.summary || '',
      description: originalTripData.description || publicTripData.description || '',
      // Add metadata about the clone
      clonedFrom: {
        public_trip_id: id,
        source_trip_id: sourceTripId,
        cloned_at: Timestamp.now(),
      },
    };

    await newTripRef.set(clonedTripData);

    return NextResponse.json({
      success: true,
      message: 'Trip cloned successfully',
      trip_id: newTripRef.id,
      cloned_trip: {
        id: newTripRef.id,
        ...clonedTripData,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/public_trips/[id]/clone POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

