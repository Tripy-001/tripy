// /app/api/public_trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

// GET /api/public_trips
// Query params:
// - limit: number of items per page (default: 12, max: 50)
// - cursor: document ID to start after (from previous response.nextCursor)
// - orderBy: one of 'updated_at' | 'created_at' (default: 'updated_at')
// - filter: 'paid' | 'free' | 'all' (default: 'all') - filter by paid status
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const limitParam = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '12', 10) || 12, 1),
      50
    );
    const cursor = searchParams.get('cursor');
    const orderByField = (searchParams.get('orderBy') || 'updated_at').toString();
    const filterParam = (searchParams.get('filter') || 'all').toString();

    if (!['updated_at', 'created_at'].includes(orderByField)) {
      return NextResponse.json({ error: "Invalid 'orderBy'. Use 'updated_at' or 'created_at'." }, { status: 400 });
    }

    if (!['all', 'paid', 'free'].includes(filterParam)) {
      return NextResponse.json({ error: "Invalid 'filter'. Use 'all', 'paid', or 'free'." }, { status: 400 });
    }

    const tripsRef = adminDb.collection('public_trips');

    // Fetch more documents to account for filtering, but use a reasonable multiplier
    const fetchLimit = filterParam === 'all' ? limitParam + 1 : limitParam * 5 + 1;

    let q = tripsRef.orderBy(orderByField, 'desc').limit(fetchLimit);

    if (cursor) {
      const cursorSnap = await tripsRef.doc(cursor).get();
      if (!cursorSnap.exists) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      }
      q = tripsRef.orderBy(orderByField, 'desc').startAfter(cursorSnap).limit(fetchLimit);
    }

    const snapshot = await q.get();
    let docs = snapshot.docs;

    // Filter by paid status client-side
    if (filterParam === 'paid') {
      docs = docs.filter(d => {
        const data = d.data();
        const isPaid = data.is_paid === true || data.is_paid === 'true' || data.is_paid === 1;
        return isPaid;
      });
      console.log(`[public_trips] Filter 'paid': Found ${docs.length} paid trips out of ${snapshot.docs.length} total`);
    } else if (filterParam === 'free') {
      docs = docs.filter(d => {
        const data = d.data();
        const isPaid = data.is_paid === true || data.is_paid === 'true' || data.is_paid === 1;
        return !isPaid;
      });
      console.log(`[public_trips] Filter 'free': Found ${docs.length} free trips out of ${snapshot.docs.length} total`);
    } else {
      console.log(`[public_trips] Filter 'all': Showing all ${docs.length} trips`);
    }

    const hasMore = docs.length > limitParam;
    const pageDocs = hasMore ? docs.slice(0, limitParam) : docs;

    const trips = pageDocs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const photosRaw = (data.destination_photos ?? undefined) as unknown;
      const destination_photos = Array.isArray(photosRaw)
        ? (photosRaw.filter((p): p is string => typeof p === 'string'))
        : undefined;
      
      // Extract Day 1 preview from itinerary if available
      let day1Preview: { theme?: string; activities?: string[] } | undefined;
      const itinerary = data.itinerary as Record<string, unknown> | undefined;
      if (itinerary && Array.isArray(itinerary.daily_itineraries)) {
        const dailyItineraries = itinerary.daily_itineraries as unknown[];
        const day1 = dailyItineraries.find((day: unknown) => {
          const d = day as Record<string, unknown>;
          return d.day_number === 1 || d.day_number === '1';
        }) || dailyItineraries[0];
        
        if (day1) {
          const day = day1 as Record<string, unknown>;
          const activities: string[] = [];
          
          // Extract activity names from morning, afternoon, evening sections
          ['morning', 'afternoon', 'evening'].forEach((section) => {
            const sectionData = day[section] as Record<string, unknown> | undefined;
            if (sectionData && Array.isArray(sectionData.activities)) {
              sectionData.activities.forEach((act: unknown) => {
                const activity = act as Record<string, unknown>;
                if (activity.name && typeof activity.name === 'string') {
                  activities.push(activity.name);
                }
              });
            }
          });
          
          day1Preview = {
            theme: day.theme as string | undefined,
            activities: activities.slice(0, 3), // Limit to first 3 activities
          };
        }
      }
      
      // Helper to convert Firestore Timestamp or date to ISO string
      const formatDate = (dateValue: unknown): string | undefined => {
        if (!dateValue) return undefined;
        // Firestore Timestamp object
        if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
          return (dateValue as { toDate: () => Date }).toDate().toISOString();
        }
        // Already a string
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
        }
        // Number (epoch)
        if (typeof dateValue === 'number') {
          return new Date(dateValue).toISOString();
        }
        return undefined;
      };

      return {
        source_trip_id: data.source_trip_id,
        summary: data.summary,
        thumbnail_url: data.thumbnail_url,
        destination_photos,
        title: data.title,
        updated_at: formatDate(data.updated_at),
        is_paid: data.is_paid ?? false,
        price: data.price ? String(data.price) : undefined,
        day1_preview: day1Preview,
      } as {
        source_trip_id?: string;
        summary?: string;
        thumbnail_url?: string;
        destination_photos?: string[];
        title?: string;
        updated_at?: string;
        is_paid?: boolean;
        price?: string;
        day1_preview?: { theme?: string; activities?: string[] };
      };
    });
    const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].id : null;

    return NextResponse.json({ trips, nextCursor, hasMore }, { status: 200 });
  } catch (error) {
    console.error('API Error /api/public_trips GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


