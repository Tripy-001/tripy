// /app/api/trips/[tripId]/collaborators/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';

type Params = { tripId: string; userId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// DELETE /api/trips/[tripId]/collaborators/[userId] - Remove a collaborator
export async function DELETE(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId, userId: collaboratorToRemove } = await resolveParams(context);

    // Only owner can remove collaborators (or user can remove themselves)
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.isOwner && authUid !== collaboratorToRemove) {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can remove collaborators' }, { status: 403 });
    }

    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const currentCollaborators = tripData.collaborators || [];

    if (!currentCollaborators.includes(collaboratorToRemove)) {
      return NextResponse.json({ error: 'User is not a collaborator' }, { status: 400 });
    }

    // Remove collaborator
    const updatedCollaborators = currentCollaborators.filter((id) => id !== collaboratorToRemove);
    await tripRef.update({
      collaborators: updatedCollaborators,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: 'Collaborator removed successfully',
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/collaborators/[userId] DELETE:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

