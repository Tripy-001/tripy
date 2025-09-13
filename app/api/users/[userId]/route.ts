// /app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface RouteParams {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId] - Get user profile
export async function GET(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    // Await params if it's a Promise (Next.js 15+)
  const params = context?.params instanceof Promise ? await context.params : context.params;
    const { userId } = params;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      user: { id: userSnap.id, ...userSnap.data() } 
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/users/[userId] GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/users/[userId] - Update user profile
export async function PUT(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    // Await params if it's a Promise (Next.js 15+)
  const params = context?.params instanceof Promise ? await context.params : context.params;
    const { userId } = params;
    const updateData = await req.json();

    const userRef = doc(db, 'users', userId);
    // Check if user exists first
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add updated timestamp
    const updatedUser = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updatedUser);

    // Get updated user data
    const updatedUserSnap = await getDoc(userRef);

    return NextResponse.json({ 
      message: 'User profile updated successfully',
      user: { id: updatedUserSnap.id, ...updatedUserSnap.data() }
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/users/[userId] PUT:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}