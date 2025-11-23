import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { TodoItem } from '@/lib/schemas/todo';
import { checkTripAccess } from '@/lib/tripAccess';
import { adminAuth } from '@/lib/firebaseAdmin';

// Helper to get user ID from request
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// GET /api/trips/[tripId]/todos - Fetch all todos for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    // Check trip access
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessCheck = await checkTripAccess(tripId, userId);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this trip' },
        { status: 403 }
      );
    }

    // Fetch all todos for this trip
    const todosSnapshot = await adminDb
      .collection('trips')
      .doc(tripId)
      .collection('todos')
      .orderBy('dayNumber')
      .orderBy('order')
      .get();

    const todos: TodoItem[] = todosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TodoItem));

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/todos - Create a new todo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { dayNumber, activityName, description, isCustom, activityId, order } = body;

    if (!tripId || !dayNumber || !activityName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check trip access
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessCheck = await checkTripAccess(tripId, userId);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this trip' },
        { status: 403 }
      );
    }

    const todoRef = adminDb
      .collection('trips')
      .doc(tripId)
      .collection('todos')
      .doc();

    const now = new Date().toISOString();
    const newTodo: TodoItem = {
      id: todoRef.id,
      tripId,
      dayNumber: Number(dayNumber),
      activityName,
      description: description || '',
      isCompleted: false,
      isCustom: isCustom ?? true,
      activityId: activityId || null,
      order: order ?? 999,
      createdAt: now,
      updatedAt: now,
    };

    await todoRef.set(newTodo);

    return NextResponse.json({ todo: newTodo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
