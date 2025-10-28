// /app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

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
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
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

    const userRef = adminDb.collection('users').doc(userId);
    // Check if user exists first
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add updated timestamp
    const updatedUser = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    await userRef.update(updatedUser);

    // Get updated user data
    const updatedUserSnap = await userRef.get();

    return NextResponse.json({ 
      message: 'User profile updated successfully',
      user: { id: updatedUserSnap.id, ...updatedUserSnap.data() }
    }, { status: 200 });

  } catch (error) {
    console.error('API Error /api/users/[userId] PUT:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}