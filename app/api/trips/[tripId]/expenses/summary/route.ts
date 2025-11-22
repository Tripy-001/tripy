// /app/api/trips/[tripId]/expenses/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { checkTripAccess } from '@/lib/tripAccess';

type Params = { tripId: string };
type Context = { params: Params } | { params: Promise<Params> };

const resolveParams = async (context: Context): Promise<Params> => {
  const p = (context as { params: Params | Promise<Params> }).params;
  return p instanceof Promise ? await p : p;
};

// GET /api/trips/[tripId]/expenses/summary - Get expense summary and splits
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

    // Get trip data to get all members
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripSnap.data() as { userId?: string; collaborators?: string[] };
    const allTripUsers = [tripData.userId, ...(tripData.collaborators || [])].filter(Boolean) as string[];

    // Get all expenses
    const expensesRef = adminDb.collection('trips').doc(tripId).collection('expenses');
    const expensesSnap = await expensesRef.get();

    // Calculate totals and splits
    const userTotals: Record<string, { paid: number; owes: number; currency: string }> = {};
    const currencyTotals: Record<string, number> = {};

    // Initialize user totals
    allTripUsers.forEach((uid) => {
      userTotals[uid] = { paid: 0, owes: 0, currency: 'INR' };
    });

    expensesSnap.docs.forEach((doc) => {
      const expense = doc.data() as {
        amount: number;
        currency: string;
        paidBy: string;
        splitBetween: string[];
      };

      const currency = expense.currency || 'INR';
      currencyTotals[currency] = (currencyTotals[currency] || 0) + expense.amount;

      // Track what each user paid
      if (userTotals[expense.paidBy]) {
        userTotals[expense.paidBy].paid += expense.amount;
        userTotals[expense.paidBy].currency = currency;
      }

      // Calculate split amount per person
      const splitAmount = expense.amount / expense.splitBetween.length;

      // Track what each user owes
      expense.splitBetween.forEach((uid) => {
        if (userTotals[uid]) {
          userTotals[uid].owes += splitAmount;
          userTotals[uid].currency = currency;
        }
      });
    });

    // Calculate net amounts (paid - owes)
    const netAmounts: Record<string, number> = {};
    Object.keys(userTotals).forEach((uid) => {
      netAmounts[uid] = userTotals[uid].paid - userTotals[uid].owes;
    });

    // Calculate who owes whom (simplified settlement)
    const settlements: Array<{ from: string; to: string; amount: number; currency: string }> = [];
    const creditors: Array<{ userId: string; amount: number; currency: string }> = [];
    const debtors: Array<{ userId: string; amount: number; currency: string }> = [];

    Object.keys(netAmounts).forEach((uid) => {
      const net = netAmounts[uid];
      const currency = userTotals[uid].currency;
      if (net > 0) {
        creditors.push({ userId: uid, amount: net, currency });
      } else if (net < 0) {
        debtors.push({ userId: uid, amount: Math.abs(net), currency });
      }
    });

    // Simple settlement algorithm (greedy)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      // Only settle if same currency
      if (creditor.currency === debtor.currency) {
        const settleAmount = Math.min(creditor.amount, debtor.amount);
        if (settleAmount > 0.01) { // Only add if amount is significant
          settlements.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: settleAmount,
            currency: creditor.currency,
          });
        }

        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;

        if (creditor.amount < 0.01) creditorIndex++;
        if (debtor.amount < 0.01) debtorIndex++;
      } else {
        // Skip if currencies don't match (could enhance to handle currency conversion)
        creditorIndex++;
        debtorIndex++;
      }
    }

    return NextResponse.json({
      summary: {
        totalExpenses: currencyTotals,
        userTotals: Object.keys(userTotals).map((uid) => ({
          userId: uid,
          paid: userTotals[uid].paid,
          owes: userTotals[uid].owes,
          net: netAmounts[uid],
          currency: userTotals[uid].currency,
        })),
        settlements,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Error /api/trips/[tripId]/expenses/summary GET:', error);
    const err = error as { code?: string } | undefined;
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

