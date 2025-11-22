// /app/api/trips/[tripId]/collaborators/route.ts
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

// GET /api/trips/[tripId]/collaborators - Get all collaborators
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId } = await resolveParams(context);
    
    // Check if user has access to this trip
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const collaborators = tripData.collaborators || [];
    const ownerId = tripData.userId;

    // Fetch user details for all collaborators and owner
    const userIds = [ownerId, ...collaborators].filter(Boolean) as string[];
    const userPromises = userIds.map(async (uid) => {
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          return {
            id: uid,
            email: userData?.email || '',
            name: userData?.name || userData?.displayName || 'Unknown User',
            isOwner: uid === ownerId,
          };
        }
        // Fallback to Firebase Auth if user doc doesn't exist
        const authUser = await adminAuth.getUser(uid);
        return {
          id: uid,
          email: authUser.email || '',
          name: authUser.displayName || 'Unknown User',
          isOwner: uid === ownerId,
        };
      } catch (error) {
        console.error(`Error fetching user ${uid}:`, error);
        return {
          id: uid,
          email: '',
          name: 'Unknown User',
          isOwner: uid === ownerId,
        };
      }
    });

    const users = await Promise.all(userPromises);

    return NextResponse.json({
      collaborators: users.filter((u) => !u.isOwner),
      owner: users.find((u) => u.isOwner),
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/collaborators GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips/[tripId]/collaborators - Add a collaborator (direct add, bypasses invitation)
// Note: For inviting by email, use /api/trips/[tripId]/invitations instead
export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId } = await resolveParams(context);
    const { userId: newCollaboratorId } = await req.json();

    if (!newCollaboratorId) {
      return NextResponse.json({ error: 'userId is required. Use /api/trips/[tripId]/invitations to invite by email.' }, { status: 400 });
    }

    // Only owner can add collaborators
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can add collaborators' }, { status: 403 });
    }

    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const currentCollaborators = tripData.collaborators || [];
    const ownerId = tripData.userId;

    // Prevent adding owner as collaborator
    if (newCollaboratorId === ownerId) {
      return NextResponse.json({ error: 'Cannot add trip owner as collaborator' }, { status: 400 });
    }

    // Prevent duplicate collaborators
    if (currentCollaborators.includes(newCollaboratorId)) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    // Add collaborator
    const updatedCollaborators = [...currentCollaborators, newCollaboratorId];
    await tripRef.update({
      collaborators: updatedCollaborators,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: 'Collaborator added successfully',
      collaboratorId: newCollaboratorId,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/collaborators POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

