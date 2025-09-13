// /app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface SignInRequestBody {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, email, displayName, photoURL }: SignInRequestBody = await req.json();

    // Guardrail: Basic server-side validation
    if (!uid || !email) {
      return NextResponse.json({ message: 'Missing required fields: uid and email.' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', uid);

    // Check if user already exists
    const existingUser = await getDoc(userDocRef);
    
    if (existingUser.exists()) {
      // Return existing user profile
      return NextResponse.json({ 
        message: 'User profile found.',
        user: existingUser.data()
      }, { status: 200 });
    }

    const newUserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
      // Default preferences and stats for a new user
      preferences: {
        travelStyle: null, 
        interests: [], 
        budgetRange: "medium", 
        preferredWeather: ["any"]
      },
      stats: {
        tripsCreated: 0, 
        placesVisited: 0
      }
    };

    // Use `setDoc` with `merge: true` to create or update.
    // This is an "upsert" operation. It won't overwrite existing data
    // on subsequent logins, which is exactly what we want.
    await setDoc(userDocRef, newUserProfile, { merge: true });

    // Get the created user to return
    const createdUser = await getDoc(userDocRef);

    return NextResponse.json({ 
      message: 'User profile synchronized successfully.',
      user: createdUser.data()
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/auth/signin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}