import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// PUT /api/trips/[tripId]/todos/[todoId] - Update a todo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; todoId: string }> }
) {
  try {
    const { tripId, todoId } = await params;
    const body = await request.json();
    const { activityName, description, isCompleted, order } = body;

    if (!tripId || !todoId) {
      return NextResponse.json(
        { error: 'Trip ID and Todo ID are required' },
        { status: 400 }
      );
    }

    const todoRef = adminDb
      .collection('trips')
      .doc(tripId)
      .collection('todos')
      .doc(todoId);

    const todoDoc = await todoRef.get();
    if (!todoDoc.exists) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (activityName !== undefined) updates.activityName = activityName;
    if (description !== undefined) updates.description = description;
    if (isCompleted !== undefined) updates.isCompleted = isCompleted;
    if (order !== undefined) updates.order = order;

    await todoRef.update(updates);

    const updatedDoc = await todoRef.get();
    const updatedTodo = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ todo: updatedTodo });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/todos/[todoId] - Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; todoId: string }> }
) {
  try {
    const { tripId, todoId } = await params;

    if (!tripId || !todoId) {
      return NextResponse.json(
        { error: 'Trip ID and Todo ID are required' },
        { status: 400 }
      );
    }

    const todoRef = adminDb
      .collection('trips')
      .doc(tripId)
      .collection('todos')
      .doc(todoId);

    const todoDoc = await todoRef.get();
    if (!todoDoc.exists) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    await todoRef.delete();

    return NextResponse.json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
