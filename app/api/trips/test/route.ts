import { NextRequest, NextResponse } from 'next/server';
import { TripPlanRequestSchema } from '@/lib/schemas/trip-plan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validatedData = TripPlanRequestSchema.parse(body);
    
    console.log('Validated Trip Plan Request:', validatedData);
    
    // Here you would typically save to database or call external API
    // For now, just return success with the validated data
    
    return NextResponse.json({
      success: true,
      message: 'Trip plan request validated successfully',
      data: validatedData
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Validation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
