// /lib/tripAccess.ts
// Helper functions for checking trip access permissions

import { adminDb } from './firebaseAdmin';

export interface TripAccessResult {
  hasAccess: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
  tripData?: {
    userId: string;
    collaborators?: string[];
    [key: string]: unknown;
  };
}

/**
 * Check if a user has access to a trip (either as owner or collaborator)
 * @param tripId - The trip document ID
 * @param userId - The user ID to check access for
 * @returns TripAccessResult with access information
 */
export async function checkTripAccess(
  tripId: string,
  userId: string
): Promise<TripAccessResult> {
  try {
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return {
        hasAccess: false,
        isOwner: false,
        isCollaborator: false,
      };
    }

    const tripData = tripSnap.data() as {
      userId?: string;
      collaborators?: string[];
      [key: string]: unknown;
    };

    const isOwner = tripData.userId === userId;
    const collaborators = tripData.collaborators || [];
    const isCollaborator = collaborators.includes(userId);
    const hasAccess = isOwner || isCollaborator;

    return {
      hasAccess,
      isOwner,
      isCollaborator,
      tripData,
    };
  } catch (error) {
    console.error('Error checking trip access:', error);
    return {
      hasAccess: false,
      isOwner: false,
      isCollaborator: false,
    };
  }
}

