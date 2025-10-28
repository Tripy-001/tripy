// /app/api/public_trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

// GET /api/public_trips
// Query params:
// - limit: number of items per page (default: 12, max: 50)
// - cursor: document ID to start after (from previous response.nextCursor)
// - orderBy: one of 'updated_at' | 'created_at' (default: 'updated_at')
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const limitParam = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '12', 10) || 12, 1),
      50
    );
    const cursor = searchParams.get('cursor');
    const orderByField = (searchParams.get('orderBy') || 'updated_at').toString();

    if (!['updated_at', 'created_at'].includes(orderByField)) {
      return NextResponse.json({ error: "Invalid 'orderBy'. Use 'updated_at' or 'created_at'." }, { status: 400 });
    }

    const tripsRef = adminDb.collection('public_trips');

    let q = tripsRef.orderBy(orderByField, 'desc').limit(limitParam + 1);

    if (cursor) {
      const cursorSnap = await tripsRef.doc(cursor).get();
      if (!cursorSnap.exists) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      }
      q = tripsRef.orderBy(orderByField, 'desc').startAfter(cursorSnap).limit(limitParam + 1);
    }

    const snapshot = await q.get();
    const docs = snapshot.docs;

    const hasMore = docs.length > limitParam;
    const pageDocs = hasMore ? docs.slice(0, limitParam) : docs;

    const trips = pageDocs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const photosRaw = (data.destination_photos ?? undefined) as unknown;
      const destination_photos = Array.isArray(photosRaw)
        ? (photosRaw.filter((p): p is string => typeof p === 'string'))
        : undefined;
      return {
        source_trip_id: data.source_trip_id,
        summary: data.summary,
        thumbnail_url: data.thumbnail_url,
        destination_photos,
        title: data.title,
        updated_at: data.updated_at,
      } as {
        source_trip_id?: string;
        summary?: string;
        thumbnail_url?: string;
        destination_photos?: string[];
        title?: string;
        updated_at?: string;
      };
    });
    const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].id : null;

    return NextResponse.json({ trips, nextCursor, hasMore }, { status: 200 });
  } catch (error) {
    console.error('API Error /api/public_trips GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


