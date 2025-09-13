import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';

// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  travelStyle: 'adventure' | 'luxury' | 'budget' | 'cultural' | null;
  interests: string[];
  budgetPreference: 'low' | 'medium' | 'high' | null;
  previousExperience: 'beginner' | 'intermediate' | 'expert' | null;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
  createdAt: Date;
  updatedAt: Date;
  // Firestore shape for compatibility
  preferences?: {
    travelStyle?: string | null;
    interests?: string[];
    budgetRange?: string | null;
    previousExperience?: string | null;
  };
}

// Trip Types
export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  duration: number; // in minutes
  cost: number;
  category: 'attraction' | 'restaurant' | 'activity' | 'transport' | 'accommodation';
  rating: number;
  imageUrl?: string;
  coordinates: { lat: number; lng: number };
  weatherDependent: boolean;
  redditInsights?: string;
  completed: boolean;
  userRating?: number;
  userNotes?: string;
  photos?: string[];
}

export interface DayPlan {
  id: string;
  date: string;
  activities: Activity[];
  totalCost: number;
  weather: {
    temperature: number;
    condition: string;
    icon: string;
  };
  notes: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  travelers: number;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  dayPlans: DayPlan[];
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  shared: boolean;
  shareId?: string;
  aiPreferences: {
    activityIntensity: 'relaxed' | 'moderate' | 'packed';
    mustSeePlaces: string[];
    budgetAdherence: number; // percentage
  };
}

// App State Types
export interface AppState {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  
  // Trip state
  trips: Trip[];
  currentTrip: Trip | null;
  activeTrip: Trip | null;
  
  // UI state
  currentStep: 'onboarding' | 'dashboard' | 'trip-creation' | 'trip-active' | 'trip-review';
  isLoading: boolean;
  error: string | null;
  
  // Onboarding state
  onboardingStep: number;
  onboardingData: Partial<UserProfile>;
  
  // Trip creation state
  tripCreationStep: number;
  tripCreationData: Partial<Trip>;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setCurrentStep: (step: AppState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Firebase Auth Actions
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Trip actions
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setActiveTrip: (trip: Trip | null) => void;
  
  // Onboarding actions
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  
  // Trip creation actions
  setTripCreationStep: (step: number) => void;
  updateTripCreationData: (data: Partial<Trip>) => void;
  completeTripCreation: () => void;
  
  // Activity actions
  updateActivity: (tripId: string, dayId: string, activityId: string, updates: Partial<Activity>) => void;
  completeActivity: (tripId: string, dayId: string, activityId: string) => void;
  rateActivity: (tripId: string, dayId: string, activityId: string, rating: number) => void;
  addActivityNote: (tripId: string, dayId: string, activityId: string, note: string) => void;
  addActivityPhoto: (tripId: string, dayId: string, activityId: string, photoUrl: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      firebaseUser: null,
      authLoading: true,
      trips: [],
      currentTrip: null,
      activeTrip: null,
      currentStep: 'onboarding',
      isLoading: false,
      error: null,
      onboardingStep: 0,
      onboardingData: {},
      tripCreationStep: 0,
      tripCreationData: {},
      
      // User actions
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Firebase Auth Actions

      signInWithGoogle: async () => {
        try {
          const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const firebaseUser = result.user;
          // Call API to create/get user profile
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }),
          });
          if (response.ok) {
            const userData = await response.json();
            // Always set email and name in Zustand user
            set({
              firebaseUser,
              isAuthenticated: true,
              user: {
                ...userData.user,
                email: userData.user.email || firebaseUser.email || '',
                name: userData.user.displayName || firebaseUser.displayName || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: any) {
          if (error.code === 'auth/account-exists-with-different-credential') {
            set({ error: 'Account exists with different sign-in method. Please use the correct provider.' });
          } else {
            set({ error: 'Failed to sign in with Google' });
          }
          console.error('Authentication error:', error);
        }
      },

      signUpWithEmail: async (email, password, name) => {
        try {
          const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          const result = await createUserWithEmailAndPassword(auth, email, password);
          if (name) {
            await updateProfile(result.user, { displayName: name });
          }
          // Sync with Firestore
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName: name,
              photoURL: result.user.photoURL,
            }),
          });
          if (response.ok) {
            const userData = await response.json();
            set({
              firebaseUser: result.user,
              isAuthenticated: true,
              user: {
                ...userData.user,
                email: userData.user.email || result.user.email || '',
                name: userData.user.displayName || name || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            set({ error: 'Email already in use. Please sign in instead.' });
          } else {
            set({ error: 'Failed to sign up with email' });
          }
          console.error('Email sign-up error:', error);
        }
      },

      signInWithEmail: async (email, password) => {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          const result = await signInWithEmailAndPassword(auth, email, password);
          // Sync with Firestore
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
            }),
          });
          if (response.ok) {
            const userData = await response.json();
            set({
              firebaseUser: result.user,
              isAuthenticated: true,
              user: {
                ...userData.user,
                email: userData.user.email || result.user.email || '',
                name: userData.user.displayName || result.user.displayName || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            set({ error: 'Incorrect password.' });
          } else if (error.code === 'auth/user-not-found') {
            set({ error: 'No user found with this email.' });
          } else {
            set({ error: 'Failed to sign in with email' });
          }
          console.error('Email sign-in error:', error);
        }
      },

      signOut: async () => {
        try {
          const { signOut } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          await signOut(auth);
          set({
            user: null,
            isAuthenticated: false,
            firebaseUser: null,
            currentStep: 'onboarding',
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ error: 'Failed to sign out' });
        }
      },
      
      // Trip actions
      createTrip: (tripData) => {
        const newTrip: Trip = {
          ...tripData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          trips: [...state.trips, newTrip],
          currentTrip: newTrip,
        }));
      },
      
      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, ...updates, updatedAt: new Date() }
              : trip
          ),
          currentTrip: state.currentTrip?.id === id
            ? { ...state.currentTrip, ...updates, updatedAt: new Date() }
            : state.currentTrip,
        }));
      },
      
      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
          currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
          activeTrip: state.activeTrip?.id === id ? null : state.activeTrip,
        }));
      },
      
      setCurrentTrip: (currentTrip) => set({ currentTrip }),
      setActiveTrip: (activeTrip) => set({ activeTrip }),
      
      // Onboarding actions
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      updateOnboardingData: (data) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        }));
      },
      
      completeOnboarding: () => {
        const { onboardingData, firebaseUser } = get();
        const user: UserProfile = {
          id: firebaseUser?.uid || crypto.randomUUID(),
          name: firebaseUser?.displayName || onboardingData.name || '',
          email: firebaseUser?.email || onboardingData.email || '',
          travelStyle: onboardingData.travelStyle || null,
          interests: onboardingData.interests || [],
          budgetPreference: onboardingData.budgetPreference || null,
          previousExperience: onboardingData.previousExperience || null,
          dietaryRestrictions: onboardingData.dietaryRestrictions || [],
          accessibilityNeeds: onboardingData.accessibilityNeeds || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set({
          user,
          isAuthenticated: true,
          currentStep: 'dashboard',
          onboardingStep: 0,
          onboardingData: {},
        });
      },
      
      // Trip creation actions
      setTripCreationStep: (tripCreationStep) => set({ tripCreationStep }),
      updateTripCreationData: (data) => {
        set((state) => ({
          tripCreationData: { ...state.tripCreationData, ...data },
        }));
      },
      
      completeTripCreation: () => {
        const { tripCreationData } = get();
        if (tripCreationData) {
          get().createTrip(tripCreationData as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);
          set({
            tripCreationStep: 0,
            tripCreationData: {},
            currentStep: 'dashboard',
          });
        }
      },
      
      // Activity actions
      updateActivity: (tripId, dayId, activityId, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  dayPlans: trip.dayPlans.map((day) =>
                    day.id === dayId
                      ? {
                          ...day,
                          activities: day.activities.map((activity) =>
                            activity.id === activityId
                              ? { ...activity, ...updates }
                              : activity
                          ),
                        }
                      : day
                  ),
                  updatedAt: new Date(),
                }
              : trip
          ),
        }));
      },
      
      completeActivity: (tripId, dayId, activityId) => {
        get().updateActivity(tripId, dayId, activityId, { completed: true });
      },
      
      rateActivity: (tripId, dayId, activityId, rating) => {
        get().updateActivity(tripId, dayId, activityId, { userRating: rating });
      },
      
      addActivityNote: (tripId, dayId, activityId, note) => {
        get().updateActivity(tripId, dayId, activityId, { userNotes: note });
      },
      
      addActivityPhoto: (tripId, dayId, activityId, photoUrl) => {
        const trip = get().trips.find((t) => t.id === tripId);
        const day = trip?.dayPlans.find((d) => d.id === dayId);
        const activity = day?.activities.find((a) => a.id === activityId);
        const photos = [...(activity?.photos || []), photoUrl];
        get().updateActivity(tripId, dayId, activityId, { photos });
      },
    }),
    {
      name: 'tripy-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        trips: state.trips,
        currentTrip: state.currentTrip,
        activeTrip: state.activeTrip,
      }),
    }
  )
);
