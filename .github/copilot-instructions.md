# AI Agent Instructions for Tripy

## Project Overview
Tripy is a Next.js 15 TypeScript application for AI-powered trip planning with Firebase authentication and Firestore database. The app uses Zustand for state management and follows a specific architectural pattern for auth and data flow.

## Key Architecture Decisions

### State Management
- **Zustand Store** (`lib/store.ts`): Central source of truth for app state, user auth, and trip data
- **No React Context**: All state management flows through Zustand, including Firebase auth state
- **Firebase Auth Observer** (`lib/auth.ts`): Automatically syncs Firebase auth changes with Zustand store

### Authentication Flow
1. Google Sign-in triggers `signInWithGoogle()` in Zustand store
2. Firebase auth state changes are captured by `useFirebaseAuth()` hook
3. User profile is fetched/created via `/api/auth/signin` endpoint
4. Auth state and user data are stored in Zustand for app-wide access

### Data Models & API Pattern
- **TypeScript-first**: All API routes use `NextRequest`/`NextResponse` with proper typing
- **Firestore Collections**: `users/{uid}`, `trips/{tripId}`, `trips/{tripId}/days/{dayId}`
- **Security**: API routes validate Firebase auth and Firestore rules enforce permissions
- **Consistent Error Handling**: All endpoints return standardized JSON responses

## Development Patterns

### Adding New Features
1. **State First**: Add necessary state to `AppState` interface in `lib/store.ts`
2. **API Routes**: Create TypeScript endpoints with proper error handling
3. **Components**: Use Zustand store hooks, never direct Firebase calls in components
4. **Types**: Define interfaces for all data structures

### File Naming Conventions
- API routes: `route.ts` (Next.js 15 App Router)
- Components: PascalCase `.tsx` files
- Utilities: camelCase `.ts` files
- Database: Follow Firestore subcollection patterns

### Critical Integration Points
- **`components/AuthProvider.tsx`**: Initializes Firebase auth observer
- **`app/layout.tsx`**: Wraps app with AuthProvider
- **`components/Navigation.tsx`**: Auth-aware navigation using Zustand state
- **`app/onboarding/page.tsx`**: User preference collection that updates Firestore

## Essential Knowledge for AI Agents

### Authentication Workflow
```typescript
// Don't use Firebase auth directly in components
// Use Zustand store actions instead:
const { signInWithGoogle, signOut, user, isAuthenticated } = useAppStore();
```

### Data Fetching Pattern
```typescript
// API calls should go through Next.js API routes, not direct Firestore
const response = await fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
```

### State Updates
```typescript
// Always update state through Zustand actions
const { setUser, updateTrip, setCurrentStep } = useAppStore();
// Never directly mutate state or call Firebase from components
```

### Security Considerations
- API routes verify `firebaseUser.uid` matches resource ownership
- Firestore rules in `firestore.rules` provide defense in depth
- Environment variables in `.env.local` (never commit these)

## Common Pitfalls to Avoid
1. **Direct Firebase Usage**: Don't import Firebase auth/firestore in components
2. **State Mutation**: Always use Zustand actions, never direct state assignment
3. **Missing Types**: All API routes and data structures need TypeScript interfaces
4. **Auth Assumptions**: Always check `isAuthenticated` state before auth-required operations

## Testing & Development
- Run with `bun dev` (uses Bun package manager, not npm)
- Firebase emulator not configured - uses live Firebase for development
- Error handling should use `NextResponse.json()` for consistency

When working on this codebase, always consider the Firebase auth state flow and how it integrates with the Zustand store. The onboarding flow is a key example of how user preferences are collected and saved to Firestore while maintaining auth state consistency.