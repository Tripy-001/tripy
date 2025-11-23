// /app/api/users/credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

interface PurchaseRequestBody {
  plan: '1-credit' | '5-credits' | '10-credits';
}

const CREDIT_PLANS = {
  '1-credit': { credits: 1, price: 150 },
  '5-credits': { credits: 5, price: 650 },
  '10-credits': { credits: 10, price: 1000 },
};

// POST /api/users/credits/purchase - Purchase credits (mockup, no actual payment)
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

    const { plan }: PurchaseRequestBody = await req.json();

    if (!plan || !CREDIT_PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const selectedPlan = CREDIT_PLANS[plan];

    // Fetch user document
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentCredits = userData?.credits ?? 0;

    // Add credits to user account (mockup purchase - no actual payment)
    const newCredits = currentCredits + selectedPlan.credits;
    await userRef.update({
      credits: newCredits,
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({ 
      success: true,
      credits: newCredits,
      purchased: selectedPlan.credits,
      price: selectedPlan.price,
      message: `Successfully purchased ${selectedPlan.credits} credit${selectedPlan.credits > 1 ? 's' : ''}!`
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/users/credits/purchase POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
