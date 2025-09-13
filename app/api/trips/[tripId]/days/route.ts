// /app/api/trips/[tripId]/days/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

interface RouteParams {
  params: {
    tripId: string;
  };
}

// GET /api/trips/[tripId]/days - Get all days for a trip
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { tripId } = params;
    
    const daysRef = collection(db, 'trips', tripId, 'days');
    const q = query(daysRef, orderBy('dayNumber', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const days: any[] = [];
    
    querySnapshot.forEach((doc) => {
      days.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({ days }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/trips/[tripId]/days GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips/[tripId]/days - Create a new day plan
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { tripId } = params;
    const dayData = await req.json();

    // Guardrail: Basic server-side validation
    if (!dayData.dayNumber || !dayData.date) {
      return NextResponse.json({ 
        error: 'Missing required fields: dayNumber and date are required' 
      }, { status: 400 });
    }

    const newDay = {
      ...dayData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      activities: dayData.activities || []
    };

    const docRef = await addDoc(collection(db, 'trips', tripId, 'days'), newDay);

    return NextResponse.json({ 
      message: 'Day plan created successfully',
      dayId: docRef.id 
    }, { status: 201 });

  } catch (error) {
    console.error('API Error /api/trips/[tripId]/days POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}