// /app/api/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// POST /api/invitations/accept - Accept invitation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { token, tripId, userId } = await req.json();

    if (!token || !tripId) {
      return NextResponse.json({ error: 'Token and tripId are required' }, { status: 400 });
    }

    // Find invitation - query by token first, then check status
    // This avoids needing a composite index
    const invitationsRef = adminDb.collection('trips').doc(tripId).collection('invitations');
    const invitationSnap = await invitationsRef
      .where('token', '==', token)
      .limit(1)
      .get();

    if (invitationSnap.empty) {
      console.error('Invitation not found (POST):', { token, tripId });
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    const invitationDoc = invitationSnap.docs[0];
    const invitationData = invitationDoc.data();

    // Check status
    if (invitationData.status !== 'pending') {
      console.error('Invitation not pending (POST):', { 
        token, 
        tripId, 
        status: invitationData.status,
        email: invitationData.email 
      });
      return NextResponse.json({ 
        error: invitationData.status === 'expired' 
          ? 'Invitation has expired' 
          : invitationData.status === 'accepted'
          ? 'Invitation has already been accepted'
          : 'Invalid invitation status'
      }, { status: 400 });
    }

    // Check expiration
    const expiresAt = invitationData.expiresAt?.toDate ? invitationData.expiresAt.toDate() : null;
    if (expiresAt && expiresAt < new Date()) {
      await invitationDoc.ref.update({ status: 'expired' });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify user email matches invitation email (if userId provided)
    if (userId) {
      try {
        const userRecord = await adminAuth.getUser(userId);
        if (userRecord.email?.toLowerCase() !== invitationData.email.toLowerCase()) {
          return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
      }
    }

    // Get trip
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const currentCollaborators = tripData.collaborators || [];
    const ownerId = tripData.userId;

    // If userId provided, add as collaborator
    if (userId) {
      // Prevent adding owner as collaborator
      if (userId === ownerId) {
        return NextResponse.json({ error: 'Cannot add trip owner as collaborator' }, { status: 400 });
      }

      // Prevent duplicate collaborators
      if (currentCollaborators.includes(userId)) {
        await invitationDoc.ref.update({ status: 'accepted', acceptedAt: Timestamp.now() });
        return NextResponse.json({
          message: 'User is already a collaborator',
          tripId,
        }, { status: 200 });
      }

      // Add collaborator
      await tripRef.update({
        collaborators: [...currentCollaborators, userId],
        updatedAt: Timestamp.now(),
      });

      // Mark invitation as accepted
      await invitationDoc.ref.update({
        status: 'accepted',
        acceptedAt: Timestamp.now(),
        acceptedBy: userId,
      });

      return NextResponse.json({
        message: 'Invitation accepted successfully',
        tripId,
      }, { status: 200 });
    }

    // If no userId, return invitation details for frontend to handle signup/login
    return NextResponse.json({
      message: 'Invitation found',
      invitation: {
        email: invitationData.email,
        tripId,
        token,
        existingUserId: invitationData.existingUserId,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/invitations/accept POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// GET /api/invitations/accept - Get invitation details (for frontend)
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const tripId = searchParams.get('tripId');

    if (!token || !tripId) {
      return NextResponse.json({ error: 'Token and tripId are required' }, { status: 400 });
    }

    // Find invitation - query by token first, then check status
    // This avoids needing a composite index
    const invitationsRef = adminDb.collection('trips').doc(tripId).collection('invitations');
    const invitationSnap = await invitationsRef
      .where('token', '==', token)
      .limit(1)
      .get();

    if (invitationSnap.empty) {
      console.error('Invitation not found (GET):', { token, tripId });
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    const invitationDoc = invitationSnap.docs[0];
    const invitationData = invitationDoc.data();

    // Check status
    if (invitationData.status !== 'pending') {
      console.error('Invitation not pending (GET):', { 
        token, 
        tripId, 
        status: invitationData.status,
        email: invitationData.email 
      });
      return NextResponse.json({ 
        error: invitationData.status === 'expired' 
          ? 'Invitation has expired' 
          : invitationData.status === 'accepted'
          ? 'Invitation has already been accepted'
          : 'Invalid invitation status'
      }, { status: 400 });
    }

    // Check expiration
    const expiresAt = invitationData.expiresAt?.toDate ? invitationData.expiresAt.toDate() : null;
    if (expiresAt && expiresAt < new Date()) {
      await invitationDoc.ref.update({ status: 'expired' });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Get trip details
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data();
    const tripName = tripData?.userInput?.destination || 'a trip';

    return NextResponse.json({
      invitation: {
        email: invitationData.email,
        tripId,
        tripName,
        token,
        existingUserId: invitationData.existingUserId,
        expiresAt: expiresAt?.toISOString(),
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/invitations/accept GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

