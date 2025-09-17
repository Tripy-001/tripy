# Trip Creation Form

A comprehensive, step-based trip creation form that collects all data required to match the backend `TripPlanRequest` schema.

## Features

### 🎯 Complete Data Collection
- **Basic Trip Info**: Origin, destination, dates
- **Budget**: Total budget, currency, budget breakdown
- **Group Details**: Number of travelers, ages
- **Preferences**: Activity level, travel style, interest ratings
- **Accommodation & Transport**: Type preferences, transport options
- **Special Requirements**: Dietary restrictions, accessibility needs, special occasions
- **Additional Info**: Must-visit places, cuisines, places to avoid, language preferences

### 🎨 Modern UI/UX
- **Step-based wizard** with progress indicator
- **Responsive design** that works on all devices
- **Interactive elements**: sliders, multi-selects, dynamic fields
- **Real-time validation** with error messages
- **Summary step** for final review before submission

### 🔧 Technical Implementation
- **React Hook Form** for form state management
- **Zod validation** for type-safe data validation
- **shadcn/ui components** for consistent design
- **TypeScript** for type safety
- **Step-by-step validation** to ensure data integrity

## Form Steps

### 1. Basic Information
- Origin city
- Destination
- Start and end dates
- Trip duration calculation

### 2. Budget
- Total budget with slider input
- Currency selection
- Budget tier suggestions
- Visual budget display

### 3. Group Details
- Number of travelers (1-20)
- Individual traveler ages
- Dynamic age input fields

### 4. Preferences
- Activity level (Relaxed, Moderate, Highly Active)
- Primary travel style (Adventure, Budget, Luxury, Cultural)
- Interest ratings (1-5 scale) for 12 categories:
  - Food & Dining
  - History & Culture
  - Nature & Wildlife
  - Nightlife & Entertainment
  - Shopping
  - Art & Museums
  - Beaches & Water
  - Mountains & Hiking
  - Architecture
  - Local Markets
  - Photography
  - Wellness & Relaxation

### 5. Accommodation & Transport
- Accommodation type selection
- Transport preferences (multi-select)
- Visual preference cards

### 6. Special Requirements
- Dietary restrictions (with custom options)
- Accessibility needs (with custom options)
- Special occasions (with custom options)

### 7. Additional Information
- Must-visit places
- Must-try cuisines
- Places to avoid
- Language preferences
- Previous visits checkbox

### 8. Summary
- Complete trip overview
- All preferences and requirements
- Final confirmation before submission

## Data Schema

The form generates data that exactly matches the `TripPlanRequest` Pydantic schema:

```typescript
{
  "origin": "Bangalore",
  "destination": "Munnar", 
  "start_date": "2025-11-20",
  "end_date": "2025-11-23",
  "total_budget": 25000,
  "budget_currency": "INR",
  "group_size": 3,
  "traveler_ages": [24, 25, 24],
  "activity_level": "moderate",
  "primary_travel_style": "adventure",
  "preferences": {
    "food_dining": 4,
    "history_culture": 5,
    "nature_wildlife": 3,
    // ... all 12 preference categories
  },
  "accommodation_type": "hotel",
  "transport_preferences": ["walking", "public_transport"],
  "dietary_restrictions": [],
  "accessibility_needs": [],
  "special_occasions": [],
  "must_visit_places": [],
  "must_try_cuisines": [],
  "avoid_places": [],
  "previous_visits": false,
  "language_preferences": ["en"]
}
```

## Usage

```tsx
import { TripCreationForm } from '@/components/TripCreationForm';

function MyPage() {
  return <TripCreationForm />;
}
```

## API Integration

The form submits to `/api/trips/test` endpoint which validates the data against the Zod schema and returns success/error responses.

## Validation

- **Client-side**: Real-time validation using Zod schema
- **Server-side**: API endpoint validates incoming data
- **Step validation**: Each step validates required fields before proceeding
- **Cross-field validation**: End date must be after start date, traveler ages must match group size

## Customization

The form is highly customizable:
- Add new preference categories in `PreferencesStep.tsx`
- Modify accommodation types in `AccommodationTransportStep.tsx`
- Add new special requirements in `SpecialRequirementsStep.tsx`
- Update validation rules in `lib/schemas/trip-plan.ts`

## Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation
- `shadcn/ui` - UI components
- `lucide-react` - Icons
