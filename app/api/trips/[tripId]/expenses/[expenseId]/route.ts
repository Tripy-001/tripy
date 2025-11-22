// /app/api/trips/[tripId]/expenses/[expenseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';

type Params = { tripId: string; expenseId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// PUT /api/trips/[tripId]/expenses/[expenseId] - Update an expense
export async function PUT(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId, expenseId } = await resolveParams(context);
    const updateData = await req.json();

    // Check if user has access to this trip
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    const expenseRef = adminDb.collection('trips').doc(tripId).collection('expenses').doc(expenseId);
    const expenseSnap = await expenseRef.get();

    if (!expenseSnap.exists) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Get trip data to validate users if splitBetween is being updated
    if (updateData.splitBetween || updateData.paidBy) {
      const tripRef = adminDb.collection('trips').doc(tripId);
      const tripSnap = await tripRef.get();
      if (!tripSnap.exists) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
      const allTripUsers = [tripData.userId, ...(tripData.collaborators || [])].filter(Boolean) as string[];

      if (updateData.paidBy && !allTripUsers.includes(updateData.paidBy)) {
        return NextResponse.json({ error: 'paidBy user must be a trip member' }, { status: 400 });
      }

      if (updateData.splitBetween) {
        if (!Array.isArray(updateData.splitBetween) || updateData.splitBetween.length === 0) {
          return NextResponse.json({ error: 'splitBetween must be a non-empty array' }, { status: 400 });
        }
        const invalidUsers = updateData.splitBetween.filter((uid: string) => !allTripUsers.includes(uid));
        if (invalidUsers.length > 0) {
          return NextResponse.json({ error: `Invalid users in splitBetween: ${invalidUsers.join(', ')}` }, { status: 400 });
        }
      }
    }

    // Prepare update data
    const safeUpdate: Record<string, unknown> = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    // Convert date string to Timestamp if provided
    if (safeUpdate.date && typeof safeUpdate.date === 'string') {
      safeUpdate.date = Timestamp.fromDate(new Date(safeUpdate.date));
    }

    // Convert amount to number if provided
    if (safeUpdate.amount !== undefined) {
      safeUpdate.amount = Number(safeUpdate.amount);
    }

    // Prevent modification of creation timestamp
    delete safeUpdate.createdAt;

    await expenseRef.update(safeUpdate);

    // Fetch updated expense
    const updatedSnap = await expenseRef.get();
    const updatedData = updatedSnap.data();
    const date = updatedData?.date?.toDate ? updatedData.date.toDate() : updatedData?.date;
    const createdAt = updatedData?.createdAt?.toDate ? updatedData.createdAt.toDate() : updatedData?.createdAt;
    const updatedAt = updatedData?.updatedAt?.toDate ? updatedData.updatedAt.toDate() : updatedData?.updatedAt;

    return NextResponse.json({
      message: 'Expense updated successfully',
      expense: {
        id: updatedSnap.id,
        ...updatedData,
        date: date instanceof Date ? date.toISOString() : date,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/expenses/[expenseId] PUT:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/trips/[tripId]/expenses/[expenseId] - Delete an expense
export async function DELETE(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId, expenseId } = await resolveParams(context);

    // Check if user has access to this trip
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    const expenseRef = adminDb.collection('trips').doc(tripId).collection('expenses').doc(expenseId);
    const expenseSnap = await expenseRef.get();

    if (!expenseSnap.exists) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await expenseRef.delete();

    return NextResponse.json({
      message: 'Expense deleted successfully',
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/expenses/[expenseId] DELETE:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

