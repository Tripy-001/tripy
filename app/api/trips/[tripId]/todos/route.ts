import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { TodoItem } from '@/lib/schemas/todo';

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
