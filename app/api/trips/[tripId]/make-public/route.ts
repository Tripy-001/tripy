// /app/api/trips/[tripId]/make-public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';
import axios from 'axios';

type Params = { tripId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// POST /api/trips/[tripId]/make-public - Make a trip public
export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    // Auth: verify Firebase ID token
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId } = await resolveParams(context);
    
    // Check if user has access (must be owner)
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess || !accessCheck.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only trip owners can make trips public' }, { status: 403 });
    }

    // Get trip data
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data();
    if (!tripData) {
      return NextResponse.json({ error: 'Trip data not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { title, summary, description, tags, is_paid, price } = body;

    // Validate required fields
    if (!title || !summary) {
      return NextResponse.json({ error: 'Title and summary are required' }, { status: 400 });
    }

    if (is_paid && (!price || typeof price !== 'string' || price.trim() === '' || parseFloat(price) <= 0)) {
      return NextResponse.json({ error: 'Valid price is required for paid trips' }, { status: 400 });
    }

    // Prepare request payload for backend API
    const backendPayload = {
      trip_id: tripId,
      title: title.trim(),
      summary: summary.trim(),
      description: description?.trim() || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []),
      is_paid: Boolean(is_paid),
      ...(is_paid && { price: typeof price === 'string' ? price.trim() : String(price) }),
    };

    // Call backend API
    const base = (process.env.FASTAPI_URL || '').trim();
    const normalizedBase = base.replace(/\/$/, '');
    const endpoint = `${normalizedBase}/api/v1/trips/${tripId}/make-public`;

    if (!base) {
      console.error('[make-public] FASTAPI_URL not set; skipping backend call');
      return NextResponse.json({ error: 'Backend service not configured' }, { status: 500 });
    }

    try {
      const backendResponse = await axios.post(endpoint, backendPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      // Store purchase records in Firestore for paid trips
      if (is_paid) {
        const purchasesRef = adminDb.collection('public_trip_purchases');
        // This will be used to track who purchased the trip
        // We'll create a document structure: { trip_id, user_id, purchased_at, price }
        // But we don't create it here - it will be created when a user purchases
      }

      return NextResponse.json({
        success: true,
        message: 'Trip made public successfully',
        data: backendResponse.data,
      });
    } catch (axiosError: unknown) {
      const error = axiosError as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('[make-public] Backend API error:', error);
      
      if (error.response) {
        return NextResponse.json(
          { error: error.response.data || 'Backend API error', status: error.response.status },
          { status: error.response.status || 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to communicate with backend service' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in /api/trips/[tripId]/make-public:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

