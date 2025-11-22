// /app/api/trips/[tripId]/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkTripAccess } from '@/lib/tripAccess';

type Params = { tripId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// GET /api/trips/[tripId]/expenses - Get all expenses for a trip
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId } = await resolveParams(context);
    
    // Check if user has access to this trip
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    const expensesRef = adminDb.collection('trips').doc(tripId).collection('expenses');
    const expensesSnap = await expensesRef.orderBy('date', 'desc').get();

    const expenses = expensesSnap.docs.map((doc) => {
      const data = doc.data();
      const date = data.date?.toDate ? data.date.toDate() : data.date;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;
      
      return {
        id: doc.id,
        ...data,
        date: date instanceof Date ? date.toISOString() : date,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      };
    });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/expenses GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trips/[tripId]/expenses - Create a new expense
export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const authUid = decoded.uid;

    const { tripId } = await resolveParams(context);
    const expenseData = await req.json();

    // Check if user has access to this trip
    const accessCheck = await checkTripAccess(tripId, authUid);
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this trip' }, { status: 403 });
    }

    // Validate required fields
    const { description, amount, currency, paidBy, splitBetween, date, category } = expenseData;
    if (!description || !amount || !paidBy || !splitBetween || !Array.isArray(splitBetween) || splitBetween.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: description, amount, paidBy, splitBetween' }, { status: 400 });
    }

    // Get trip data to validate users
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const allTripUsers = [tripData.userId, ...(tripData.collaborators || [])].filter(Boolean) as string[];

    // Validate paidBy and splitBetween are trip members
    if (!allTripUsers.includes(paidBy)) {
      return NextResponse.json({ error: 'paidBy user must be a trip member' }, { status: 400 });
    }

    const invalidUsers = splitBetween.filter((uid: string) => !allTripUsers.includes(uid));
    if (invalidUsers.length > 0) {
      return NextResponse.json({ error: `Invalid users in splitBetween: ${invalidUsers.join(', ')}` }, { status: 400 });
    }

    // Create expense document
    const expensesRef = adminDb.collection('trips').doc(tripId).collection('expenses');
    const newExpense = {
      description,
      amount: Number(amount),
      currency: currency || 'INR',
      paidBy,
      splitBetween,
      date: date ? Timestamp.fromDate(new Date(date)) : Timestamp.now(),
      category: category || 'other',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const expenseDoc = await expensesRef.add(newExpense);

    return NextResponse.json({
      message: 'Expense created successfully',
      expense: {
        id: expenseDoc.id,
        ...newExpense,
        date: newExpense.date.toDate().toISOString(),
        createdAt: newExpense.createdAt.toDate().toISOString(),
        updatedAt: newExpense.updatedAt.toDate().toISOString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/expenses POST:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

