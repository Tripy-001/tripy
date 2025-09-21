// /app/api/public_trips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/public_trips/[id] - Get full public trip document
export async function GET(req: NextRequest, context: RouteParams): Promise<NextResponse> {
  try {
    const params = context?.params instanceof Promise ? await context.params : context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing public trip id' }, { status: 400 });
    }

    const tripRef = doc(db, 'public_trips', id);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json({ error: 'Public trip not found' }, { status: 404 });
    }

    const raw = tripSnap.data() as Record<string, unknown>;
    const photosRaw = (raw?.destination_photos ?? undefined) as unknown;
    const destination_photos = Array.isArray(photosRaw)
      ? photosRaw.filter((p): p is string => typeof p === 'string')
      : undefined;

    return NextResponse.json(
      {
        trip: {
          id: tripSnap.id,
          ...raw,
          destination_photos,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error /api/public_trips/[id] GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


