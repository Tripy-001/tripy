import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

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

    // 2. Get User Input
    const userInput = await request.json();

    // 3. Create a new trip document in Firestore
    const tripRef = adminDb.collection('trips').doc(); // Auto-generate ID
    const newTrip = {
      userId: userId,
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      userInput: userInput,
      itinerary: null,
    };
    await tripRef.set(newTrip);
    const tripId = tripRef.id;
    console.log(newTrip);
    // 4. Trigger the FastAPI backend (fire and forget)
    // Ensure FASTAPI_URL is in your .env.local
    const response = fetch(`http://localhost:8000/api/v1/generate-trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: tripId,
        userInput: userInput,
      }),
      // Do not await
    }).catch((error) => {
      // Log this error server-side, but don't block the user response
      console.error('Error triggering FastAPI backend:', error);
    });
    console.log(response);
    // 5. Immediately return the tripId to the frontend
    return NextResponse.json({ success: true, tripId: tripId });
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
