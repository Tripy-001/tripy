import { NextResponse } from 'next/server';

/**
 * API route to provide Google Maps API configuration to the client
 * This keeps the API key secure by only exposing it server-side
 */
export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey });
}
