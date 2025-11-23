// /app/api/public_trips/[id]/purchase/route.ts
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

// POST /api/public_trips/[id]/purchase - Purchase a paid public trip
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
    const body = await req.json();
    const { trip_id, price } = body;

    // Verify the public trip exists and is paid
    const publicTripRef = adminDb.collection('public_trips').doc(id);
    const publicTripSnap = await publicTripRef.get();

    if (!publicTripSnap.exists) {
      return NextResponse.json({ error: 'Public trip not found' }, { status: 404 });
    }

    const publicTripData = publicTripSnap.data();
    if (!publicTripData) {
      return NextResponse.json({ error: 'Public trip data not found' }, { status: 404 });
    }

    // Check if trip is paid
    const isPaid = publicTripData.is_paid ?? false;
    if (!isPaid) {
      return NextResponse.json({ error: 'This trip is free and does not require purchase' }, { status: 400 });
    }

    // Check if user already purchased this trip
    const purchasesRef = adminDb.collection('public_trip_purchases');
    const existingPurchase = await purchasesRef
      .where('user_id', '==', userId)
      .where('trip_id', '==', trip_id || id)
      .get();

    if (!existingPurchase.empty) {
      return NextResponse.json({ 
        error: 'You have already purchased this trip',
        already_purchased: true 
      }, { status: 400 });
    }

    // Create purchase record (mock payment - no actual payment processing)
    const purchaseRef = purchasesRef.doc();
    const purchasePrice = price || publicTripData.price || '0';
    const purchaseData = {
      user_id: userId,
      trip_id: trip_id || id,
      price: typeof purchasePrice === 'string' ? purchasePrice : String(purchasePrice),
      purchased_at: Timestamp.now(),
      payment_status: 'completed', // Mock status
      payment_method: 'mock', // Indicates this is a mock payment
    };

    await purchaseRef.set(purchaseData);

    // Clone the trip for the purchaser
    try {
      const sourceTripId = publicTripData.source_trip_id;
      if (sourceTripId) {
        const originalTripRef = adminDb.collection('trips').doc(sourceTripId);
        const originalTripSnap = await originalTripRef.get();

        if (originalTripSnap.exists) {
          const originalTripData = originalTripSnap.data();
          if (originalTripData) {
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
              message: 'Trip purchased and cloned successfully',
              purchase_id: purchaseRef.id,
              trip_id: newTripRef.id,
              cloned: true,
            }, { status: 200 });
          }
        }
      }
    } catch (cloneError) {
      console.error('Error cloning trip after purchase:', cloneError);
      // Still return success for purchase, but log the clone error
    }

    return NextResponse.json({
      success: true,
      message: 'Trip purchased successfully',
      purchase_id: purchaseRef.id,
      cloned: false,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/public_trips/[id]/purchase POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

