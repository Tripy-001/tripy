# Public Trip API Documentation

## Overview
This document describes the API endpoint for making trips public, including both free and paid options.

## Endpoint
`POST /api/v1/trips/{trip_id}/make-public`

## Request Object

### Full Request Body Structure

```json
{
  "trip_id": "abc123",
  "title": "Amazing 5-Day Bali Adventure",
  "summary": "Beach hopping, temple visits, and authentic cuisine",
  "description": "A perfect blend of relaxation and cultural immersion",
  "tags": ["beach", "culture", "adventure", "budget-friendly"],
  "is_paid": false,
  "price": "0"
}
```

### Paid Trip Example

```json
{
  "trip_id": "abc123",
  "title": "Premium 7-Day European Tour",
  "summary": "Luxury hotels, fine dining, and exclusive experiences",
  "description": "Experience Europe in style with our curated premium itinerary",
  "tags": ["luxury", "europe", "premium", "culture"],
  "is_paid": true,
  "price": "2999.99"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trip_id` | string | Yes | The unique identifier of the trip to make public |
| `title` | string | Yes | Public-facing title for the trip |
| `summary` | string | Yes | Short summary/description (displayed in listings) |
| `description` | string | No | Detailed description of the trip |
| `tags` | array[string] | No | Array of tags for categorization and search |
| `is_paid` | boolean | Yes | Whether this is a paid trip (true) or free (false) |
| `price` | string | Conditional | Required if `is_paid` is true. Price as a string in the base currency (e.g., "2999.99") |

### Validation Rules

1. **Required Fields**: `trip_id`, `title`, `summary`, `is_paid` are required
2. **Price Validation**: If `is_paid` is `true`, `price` must be provided and greater than 0
3. **Tags**: Should be an array of strings. If provided as comma-separated string, it will be converted to an array

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Trip made public successfully",
  "data": {
    // Backend response data
  }
}
```

#### Error Responses

**400 Bad Request** - Missing required fields or invalid data
```json
{
  "error": "Title and summary are required"
}
```

**401 Unauthorized** - Missing or invalid authentication token
```json
{
  "error": "Unauthorized: Missing token"
}
```

**403 Forbidden** - User is not the trip owner
```json
{
  "error": "Forbidden: Only trip owners can make trips public"
}
```

**404 Not Found** - Trip not found
```json
{
  "error": "Trip not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Internal Server Error"
}
```

## Frontend Implementation

The frontend sends this request through the Next.js API route:
- **Frontend Route**: `POST /api/trips/{tripId}/make-public`
- **Backend Route**: `POST /api/v1/trips/{tripId}/make-public`

The Next.js API route acts as a proxy, forwarding the request to the backend FastAPI service.

## Purchase Flow for Paid Trips

When a user purchases a paid trip, a purchase record is created in Firestore:

```json
{
  "user_id": "user123",
  "trip_id": "abc123",
  "price": 2999.99,
  "purchased_at": "2024-01-15T10:30:00Z",
  "payment_status": "completed",
  "payment_method": "mock"
}
```

**Note**: This is a mock payment system. No actual payment processing occurs. The `payment_method: "mock"` field indicates this is a demonstration.

## Database Schema

### Public Trips Collection (`public_trips`)
- `source_trip_id`: Reference to original trip
- `title`: Public title
- `summary`: Short summary
- `description`: Full description
- `tags`: Array of tags
- `is_paid`: Boolean flag
- `price`: Price (if paid)
- `thumbnail_url`: Trip thumbnail
- `destination_photos`: Array of photo URLs
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Purchase Records Collection (`public_trip_purchases`)
- `user_id`: User who purchased
- `trip_id`: Trip that was purchased
- `price`: Purchase price (stored as string)
- `purchased_at`: Purchase timestamp
- `payment_status`: "completed" (mock)
- `payment_method`: "mock"

