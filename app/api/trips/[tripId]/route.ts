// /app/api/trips/[tripId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface RouteParams {
  params: {
    tripId: string;
  };
}

// GET /api/trips/[tripId] - Get a specific trip
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { tripId } = params;
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      trip: { id: tripSnap.id, ...tripSnap.data() } 
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/trips/[tripId] GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/trips/[tripId] - Update a specific trip
export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { tripId } = params;
    const updateData = await req.json();

    const tripRef = doc(db, 'trips', tripId);
    
    // Check if trip exists first
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Add updated timestamp
    const updatedTrip = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(tripRef, updatedTrip);

    return NextResponse.json({ 
      message: 'Trip updated successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/trips/[tripId] PUT:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/trips/[tripId] - Delete a specific trip
export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { tripId } = params;
    const tripRef = doc(db, 'trips', tripId);
    
    // Check if trip exists first
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    await deleteDoc(tripRef);

    return NextResponse.json({ 
      message: 'Trip deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/trips/[tripId] DELETE:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}