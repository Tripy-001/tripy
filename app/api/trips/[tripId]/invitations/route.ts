// /app/api/trips/[tripId]/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';
import { sendInvitationEmail, sendCollaboratorAddedEmail } from '@/lib/emailService';
import crypto from 'crypto';

type Params = { tripId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// Generate secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/trips/[tripId]/invitations - Get pending invitations
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
    
    // Only owner can view invitations
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can view invitations' }, { status: 403 });
    }

    const invitationsRef = adminDb.collection('trips').doc(tripId).collection('invitations');
    const invitationsSnap = await invitationsRef
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const invitations = invitationsSnap.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt;
      
      return {
        id: doc.id,
        email: data.email,
        status: data.status,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
      };
    });

    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/invitations GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips/[tripId]/invitations - Create invitation
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
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Only owner can create invitations
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.isOwner) {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can invite collaborators' }, { status: 403 });
    }

    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const ownerId = tripData.userId;

    // Check if user already exists
    let existingUserId: string | null = null;
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      existingUserId = userRecord.uid;
      
      // Check if already a collaborator
      const currentCollaborators = tripData.collaborators || [];
      if (currentCollaborators.includes(existingUserId)) {
        return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
      }
    } catch (error) {
      // User doesn't exist - that's fine, we'll create an invitation
      existingUserId = null;
    }

    // Check for existing pending invitation
    const invitationsRef = adminDb.collection('trips').doc(tripId).collection('invitations');
    const existingInvitationSnap = await invitationsRef
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    if (!existingInvitationSnap.empty) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Get inviter details
    let inviterName = 'Someone';
    try {
      const inviterDoc = await adminDb.collection('users').doc(authUid).get();
      if (inviterDoc.exists) {
        const inviterData = inviterDoc.data();
        inviterName = inviterData?.name || inviterData?.displayName || inviterName;
      } else {
        const inviterAuth = await adminAuth.getUser(authUid);
        inviterName = inviterAuth.displayName || inviterAuth.email || inviterName;
      }
    } catch (error) {
      console.error('Error fetching inviter details:', error);
    }

    // Get trip name for email
    const tripName = tripData.userInput?.destination || 'a trip';

    // Create invitation token
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation document
    const invitationData = {
      email: email.toLowerCase(),
      token,
      invitedBy: authUid,
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      existingUserId, // null if new user
    };

    const invitationDoc = await invitationsRef.add(invitationData);

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/invitations/accept?token=${token}&tripId=${tripId}`;

    // Send email invitation
    try {
      await sendInvitationEmail(email, inviterName, tripName, invitationLink);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Don't fail the request if email fails - invitation is still created
      // User can still access via invitation link
    }
    
    // Note: Even if email fails (e.g., domain not verified), the invitation is still created
    // and the user can access it via the invitation link

    // If user exists, also add them directly and send notification
    if (existingUserId) {
      const currentCollaborators = tripData.collaborators || [];
      if (!currentCollaborators.includes(existingUserId)) {
        await tripRef.update({
          collaborators: [...currentCollaborators, existingUserId],
          updatedAt: Timestamp.now(),
        });

        // Mark invitation as accepted
        await invitationDoc.update({ status: 'accepted', acceptedAt: Timestamp.now() });

        // Send notification email
        try {
          const tripLink = `${baseUrl}/trip/${tripId}`;
          await sendCollaboratorAddedEmail(email, inviterName, tripName, tripLink);
        } catch (error) {
          console.error('Error sending collaborator added email:', error);
        }

        return NextResponse.json({
          message: 'User added as collaborator successfully',
          collaboratorId: existingUserId,
          invitationId: invitationDoc.id,
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitationId: invitationDoc.id,
      invitationToken: token, // Include token so frontend can show invitation link
      invitationLink, // Include full link for convenience
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/invitations POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

