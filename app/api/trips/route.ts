// /app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// GET /api/trips - Fetch all trips for authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const tripsRef = collection(db, 'trips');
    const q = query(
      tripsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const trips: any[] = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({ trips }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/trips GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips - Create a new trip
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const tripData = await req.json();

    // Guardrail: Basic server-side validation
    if (!tripData.userId || !tripData.title || !tripData.destination) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, title, and destination are required' 
      }, { status: 400 });
    }

    const newTrip = {
      ...tripData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: tripData.status || 'planning',
      visibility: tripData.visibility || 'private'
    };

    const docRef = await addDoc(collection(db, 'trips'), newTrip);

    return NextResponse.json({ 
      message: 'Trip created successfully',
      tripId: docRef.id 
    }, { status: 201 });

  } catch (error) {
    console.error('API Error /api/trips POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}