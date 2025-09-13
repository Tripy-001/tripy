# Tripy - AI-Powered Trip Planner

This is a Next.js application with Firebase authentication and Firestore database integration for creating personalized travel itineraries.

## Features

- 🔐 Google Authentication via Firebase Auth
- 📱 Responsive UI with Tailwind CSS and shadcn/ui components
- 🗃️ Firestore database for user profiles, trips, and day plans
- 🎯 TypeScript for type safety
- 🛍️ Zustand for state management
- 🔄 Real-time data synchronization

## Project Structure

```
├── app/
│   ├── api/                 # API routes for Firebase operations
│   │   ├── auth/
│   │   ├── trips/
│   │   └── users/
│   ├── onboarding/         # User preference collection
│   └── layout.tsx          # Root layout with AuthProvider
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── AuthProvider.tsx    # Firebase auth state management
│   └── Navigation.tsx      # Main navigation with auth
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   ├── auth.ts            # Firebase auth hooks
│   ├── store.ts           # Zustand state management
│   └── utils.ts           # Utility functions
└── firestore.rules        # Security rules for Firestore
```

## Setup Instructions

### 1. Install Dependencies
```bash
bun install
```

### 2. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication and select Google as a provider
3. Create a Firestore database
4. Copy your Firebase config values

### 3. Environment Variables
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 4. Firestore Security Rules
Apply the rules from `firestore.rules` in your Firebase Console under Firestore Database > Rules.

### 5. Run Development Server
```bash
bun dev
```

## Architecture

### Authentication Flow
1. Users sign in with Google via Firebase Auth
2. User profile is created/fetched from Firestore via `/api/auth/signin`
3. Auth state is managed in Zustand store
4. Navigation and UI components react to auth state changes

### Data Models

**Users Collection** (`users/{userId}`)
```typescript
{
  uid: string
  email: string
  displayName: string
  photoURL: string
  preferences: {
    travelStyle: 'adventure' | 'luxury' | 'budget' | 'cultural'
    interests: string[]
    budgetRange: 'low' | 'medium' | 'high'
    previousExperience: 'beginner' | 'intermediate' | 'expert'
  }
  stats: {
    tripsCreated: number
    placesVisited: number
  }
}
```

**Trips Collection** (`trips/{tripId}`)
```typescript
{
  userId: string
  title: string
  destination: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed'
  visibility: 'private' | 'public'
  budget: number
}
```

**Days Subcollection** (`trips/{tripId}/days/{dayId}`)
```typescript
{
  dayNumber: number
  date: Timestamp
  activities: Activity[]
  theme: string
}
```

### State Management
- **Zustand Store**: Central state management for user, auth, trips, and UI state
- **Firebase Auth Observer**: Automatically syncs Firebase auth state with Zustand
- **API Integration**: RESTful endpoints for CRUD operations

## Development Guidelines

1. **TypeScript First**: All new files should use TypeScript
2. **API Routes**: Use NextResponse for consistent error handling
3. **State Updates**: Use Zustand actions for all state mutations
4. **Firebase Security**: Always validate user permissions in API routes
5. **Component Structure**: Keep components focused and reusable

## Key Files to Understand

- `lib/store.ts` - Central state management with auth actions
- `lib/auth.ts` - Firebase authentication observer hook
- `app/api/auth/signin/route.ts` - User creation/login endpoint
- `components/Navigation.tsx` - Auth-aware navigation
- `app/onboarding/page.tsx` - User preference collection flow
