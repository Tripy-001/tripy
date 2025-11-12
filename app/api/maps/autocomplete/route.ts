import { NextRequest, NextResponse } from 'next/server';

interface AutocompleteRequestBody {
  input?: string;
  sessionToken?: string;
  includedPrimaryTypes?: string[];
  includedRegionCodes?: string[];
  locationBias?: Record<string, unknown>;
  locationRestriction?: Record<string, unknown>;
  languageCode?: string;
  origin?: { latitude: number; longitude: number };
}

interface PlacesAutocompleteSuggestion {
  placePrediction?: {
    placeId?: string;
    place?: string;
    text?: {
      text?: string;
    };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    types?: string[];
    distanceMeters?: number;
  };
}

const FIELD_MASK = [
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.place',
  'suggestions.placePrediction.text.text',
  'suggestions.placePrediction.structuredFormat.mainText.text',
  'suggestions.placePrediction.structuredFormat.secondaryText.text',
  'suggestions.placePrediction.types',
  'suggestions.placePrediction.distanceMeters',
].join(',');

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  let body: AutocompleteRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { input, sessionToken, includedPrimaryTypes, includedRegionCodes, locationBias, locationRestriction, languageCode, origin } = body;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const payload: Record<string, unknown> = {
    input,
  };

  if (sessionToken) {
    payload.sessionToken = sessionToken;
  }

  if (Array.isArray(includedPrimaryTypes) && includedPrimaryTypes.length > 0) {
    payload.includedPrimaryTypes = includedPrimaryTypes;
  }

  if (Array.isArray(includedRegionCodes) && includedRegionCodes.length > 0) {
    payload.includedRegionCodes = includedRegionCodes;
  }

  if (locationBias) {
    payload.locationBias = locationBias;
  }

  if (locationRestriction) {
    payload.locationRestriction = locationRestriction;
  }

  if (languageCode) {
    payload.languageCode = languageCode;
  }

  if (origin) {
    payload.origin = origin;
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(payload),
      // Timeout after 6 seconds to avoid hanging requests
      signal: AbortSignal.timeout?.(6000),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: 'Failed to fetch place suggestions',
          details: errorPayload,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { suggestions?: PlacesAutocompleteSuggestion[] };

    const suggestions = (data.suggestions ?? [])
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction))
      .map((prediction) => ({
        placeId: prediction.placeId ?? prediction.place ?? '',
        fullText: prediction.text?.text ?? '',
        mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
        types: prediction.types ?? [],
        distanceMeters: prediction.distanceMeters,
      }))
      .filter((prediction) => prediction.placeId && prediction.fullText);

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unexpected error fetching place suggestions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
