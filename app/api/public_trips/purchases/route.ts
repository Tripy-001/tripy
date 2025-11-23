// /app/api/public_trips/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

// GET /api/public_trips/purchases - Get all purchased trip IDs for the current user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const purchasesRef = adminDb.collection('public_trip_purchases');
    const snapshot = await purchasesRef.where('user_id', '==', userId).get();

    const tripIds = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.trip_id;
    }).filter(Boolean) as string[];

    return NextResponse.json({ trip_ids: tripIds }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/public_trips/purchases GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

