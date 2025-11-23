// /app/api/users/credits/deduct/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// POST /api/users/credits/deduct - Deduct one credit from user
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth: verify Firebase ID token
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    // Fetch user document
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
        credits: currentCredits 
      }, { status: 403 });
    }

    // Deduct one credit
    const newCredits = currentCredits - 1;
    await userRef.update({
      credits: newCredits,
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({ 
      success: true,
      credits: newCredits,
      message: 'Credit deducted successfully'
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/users/credits/deduct POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
