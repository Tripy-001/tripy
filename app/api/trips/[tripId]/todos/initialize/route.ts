import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { TodoItem } from '@/lib/schemas/todo';

// POST /api/trips/[tripId]/todos/initialize - Auto-populate todos from itinerary
export async function POST(
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

    // Fetch the trip to get itinerary data
    const tripDoc = await adminDb.collection('trips').doc(tripId).get();
    
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const tripData = tripDoc.data();
    const dailyItineraries = tripData?.itinerary?.daily_itineraries;

    if (!Array.isArray(dailyItineraries) || dailyItineraries.length === 0) {
      return NextResponse.json(
        { error: 'No daily itineraries found in trip' },
        { status: 400 }
      );
    }

    // Check if todos already exist
    const existingTodos = await adminDb
      .collection('trips')
      .doc(tripId)
      .collection('todos')
      .limit(1)
      .get();

    if (!existingTodos.empty) {
      return NextResponse.json(
        { message: 'Todos already initialized', count: 0 },
        { status: 200 }
      );
    }

    // Create todos from daily itineraries
    const batch = adminDb.batch();
    let todoCount = 0;
    const now = new Date().toISOString();

    dailyItineraries.forEach((day: Record<string, unknown>, dayIndex: number) => {
      const dayNumber = (day.day_number as number) || dayIndex + 1;
      let orderCounter = 0;
      
      // Process each time section (morning, lunch, afternoon, evening)
      const sections = ['morning', 'lunch', 'afternoon', 'evening'];
      
      sections.forEach((sectionKey) => {
        const section = day[sectionKey] as Record<string, unknown> | undefined;
        if (!section) return;

        // Handle lunch section (restaurant)
        if (sectionKey === 'lunch' && section.restaurant) {
          const restaurant = section.restaurant as Record<string, unknown>;
          const todoRef = adminDb
            .collection('trips')
            .doc(tripId)
            .collection('todos')
            .doc();

          const todo: TodoItem = {
            id: todoRef.id,
            tripId,
            dayNumber,
            activityName: `🍽️ ${(restaurant.name as string) || 'Lunch'}`,
            description: (restaurant.address as string) || '',
            isCompleted: false,
            isCustom: false,
            activityId: `day${dayNumber}-lunch`,
            order: orderCounter++,
            createdAt: now,
            updatedAt: now,
          };

          batch.set(todoRef, todo);
          todoCount++;
        }

        // Handle activities in morning/afternoon/evening sections
        const activities = section.activities as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(activities)) {
          activities.forEach((act: Record<string, unknown>) => {
            const activity = (act.activity as Record<string, unknown>) || act;
            const todoRef = adminDb
              .collection('trips')
              .doc(tripId)
              .collection('todos')
              .doc();

            const activityName = 
              (activity.name as string) || 
              (activity.title as string) || 
              (act.activity_type as string) || 
              'Activity';

            const description = 
              (activity.description as string) || 
              (activity.address as string) || 
              '';

            const emoji = sectionKey === 'morning' ? '🌅' : sectionKey === 'afternoon' ? '☀️' : '🌆';

            const todo: TodoItem = {
              id: todoRef.id,
              tripId,
              dayNumber,
              activityName: `${emoji} ${activityName}`,
              description,
              isCompleted: false,
              isCustom: false,
              activityId: (activity.id as string) || `day${dayNumber}-${sectionKey}-${orderCounter}`,
              order: orderCounter++,
              createdAt: now,
              updatedAt: now,
            };

            batch.set(todoRef, todo);
            todoCount++;
          });
        }
      });
    });

    // Commit all todos in a batch
    await batch.commit();

    return NextResponse.json({ 
      message: 'Todos initialized successfully', 
      count: todoCount 
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing todos:', error);
    return NextResponse.json(
      { error: 'Failed to initialize todos' },
      { status: 500 }
    );
  }
}
