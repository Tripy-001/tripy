import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify User Authentication
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Check user credits
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const currentCredits = userData?.credits ?? 0;
    
    if (currentCredits < 1) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        message: 'You need at least 1 credit to generate a trip. Please purchase more credits.',
        credits: currentCredits 
      }, { status: 403 });
    }

    // 3. Deduct one credit
    await userRef.update({
      credits: currentCredits - 1,
      updatedAt: Timestamp.now()
    });

    // 4. Get User Input
    const userInput = await request.json();

    // 5. Create a new trip document in Firestore
    const tripRef = adminDb.collection('trips').doc(); // Auto-generate ID
    const newTrip = {
      userId: userId,
      collaborators: [], // Initialize empty collaborators array
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      userInput: userInput,
      itinerary: null,
    };
    await tripRef.set(newTrip);
    const tripId = tripRef.id;
     const outboundPayload = {
      tripId: tripId,
      userInput: userInput,
    };
    const base = (process.env.FASTAPI_URL || '').trim();
    const normalizedBase = base.replace(/\/$/, '');
    const endpoint = `${normalizedBase}/api/v1/generate-trip`;

    // Fire-and-forget axios request (no await, no status mutation here). Backend will update the trip document later.
    if (!base) {
      console.error('[generate-trip] FASTAPI_URL not set; skipping backend trigger');
    } else {
      // Intentionally not awaiting; minimal error logging only.
      axios.post(endpoint, outboundPayload).catch((err: unknown) => {
        const message = (typeof err === 'object' && err && 'message' in err) ? String((err as { message?: unknown }).message) : 'Unknown axios error';
        console.error('[generate-trip] Fire-and-forget axios error:', message);
      });
    }
    // 6. Immediately return the tripId and updated credits to the frontend
    return NextResponse.json({ 
      success: true, 
      tripId: tripId,
      credits: currentCredits - 1 
    });
  } catch (error: unknown) {
    console.error('Error in /api/trips/generate:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
