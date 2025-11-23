import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth as clientAuth, db } from '@/lib/firebase';
import { persist } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';
import type { TripPlanRequest } from '@/lib/schemas/trip-plan';

// User Profile Types
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  travelStyle: 'adventure' | 'luxury' | 'budget' | 'cultural' | null;
  interests: string[];
  budgetPreference: 'low' | 'medium' | 'high' | null;
  previousExperience: 'beginner' | 'intermediate' | 'expert' | null;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
  credits: number; // User's available credits for trip generation
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
  isOwner?: boolean; // Whether the current user owns this trip (true) or is a collaborator (false)
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

  // Generation state
  isGenerating?: boolean;
  currentTripId?: string | null;
  currentItinerary?: unknown | null;
  
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
  resetCurrentTrip?: () => void;
  
  // Credit actions
  updateUserCredits: (credits: number) => void;
  deductCredit: () => Promise<boolean>;
  fetchUserCredits: () => Promise<void>;
  
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
  fetchUserTrips: () => Promise<void>;
  setTrips: (trips: Trip[]) => void;
  
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

  // AI itinerary actions
  startItineraryGeneration?: (userInput: TripPlanRequest) => Promise<void>;
  listenToTripUpdates?: (tripId: string) => () => void;

  // Chat state
  chatMessages: Array<{ id: string; sender: 'user' | 'ai'; text: string; timestamp: Date }>;
  isChatConnected: boolean;
  webSocket: WebSocket | null;
  chatError: string | null;
  isTyping: boolean;

  // Chat actions
  connectChat: (tripId: string) => Promise<void>;
  disconnectChat: () => void;
  sendChatMessage: (messageText: string) => void;
  addAiChatMessage: (messageText: string) => void;
  clearChatMessages: () => void;
  setChatError: (error: string | null) => void;
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
  isGenerating: false,
  currentTripId: null,
  currentItinerary: null,
      onboardingStep: 0,
      onboardingData: {},
      tripCreationStep: 0,
      tripCreationData: {},
      
      // Chat initial state
      chatMessages: [],
      isChatConnected: false,
      webSocket: null,
      chatError: null,
      isTyping: false,
      
      // User actions
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
  resetCurrentTrip: () => set({ currentTripId: null, currentItinerary: null, isGenerating: false, error: null }),
      
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
            // Always set email and displayName in Zustand user
            set({
              firebaseUser,
              isAuthenticated: true,
              user: {
                ...userData.user,
                email: userData.user.email || firebaseUser.email || '',
                displayName: userData.user.displayName || firebaseUser.displayName || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: unknown) {
          const err = error as { code?: string } | undefined;
          if (err?.code === 'auth/account-exists-with-different-credential') {
            set({ error: 'Account exists with different sign-in method. Please use the correct provider.' });
          } else {
            set({ error: 'Failed to sign in with Google' });
          }
          console.error('Authentication error:', error);
        }
      },

  signUpWithEmail: async (email, password, displayName) => {
        try {
          const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          const result = await createUserWithEmailAndPassword(auth, email, password);
          if (displayName) {
            await updateProfile(result.user, { displayName });
          }
          // Sync with Firestore
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName,
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
                displayName: userData.user.displayName || displayName || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: unknown) {
          const err = error as { code?: string } | undefined;
          if (err?.code === 'auth/email-already-in-use') {
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
                displayName: userData.user.displayName || result.user.displayName || '',
              },
              currentStep: userData.user.preferences?.travelStyle ? 'dashboard' : 'onboarding',
            });
          }
        } catch (error: unknown) {
          const err = error as { code?: string } | undefined;
          if (err?.code === 'auth/wrong-password') {
            set({ error: 'Incorrect password.' });
          } else if (err?.code === 'auth/user-not-found') {
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
      
      setTrips: (trips) => set({ trips }),
      
      fetchUserTrips: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { firebaseUser } = get();
          if (!firebaseUser) {
            throw new Error('User not authenticated');
          }

          const token = await firebaseUser.getIdToken();
          const response = await fetch(`/api/trips?userId=${firebaseUser.uid}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch trips');
          }

          const data = await response.json();
          
          // Transform API response to match our Trip interface
          const transformedTrips: Trip[] = data.trips.map((trip: unknown) => {
            const tripData = trip as { 
              id: string; 
              userInput: { 
                start_date: string; 
                end_date: string; 
                destination: string; 
                origin: string; 
                group_size: number; 
                total_budget: number; 
                activity_level: string; 
                must_visit_places: string[] 
              }; 
              status: string; 
              itinerary: unknown; 
              createdAt: string; 
              updatedAt: string; 
              isOwner?: boolean;
            };
            
            // Calculate duration from start and end dates
            const startDate = new Date(tripData.userInput.start_date);
            const endDate = new Date(tripData.userInput.end_date);
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              id: tripData.id,
              title: `${tripData.userInput.destination} Adventure` || 'Untitled Trip',
              destination: `${tripData.userInput.origin} → ${tripData.userInput.destination}`,
              startDate: tripData.userInput.start_date,
              endDate: tripData.userInput.end_date,
              duration: duration,
              travelers: tripData.userInput.group_size || 1,
              budget: tripData.userInput.total_budget || 0,
              status: tripData.status === 'processing' ? 'planning' : tripData.status || 'planning',
              dayPlans: tripData.itinerary || [],
              totalCost: tripData.userInput.total_budget || 0,
              createdAt: new Date(tripData.createdAt),
              updatedAt: new Date(tripData.updatedAt),
              shared: false, // Default to private
              shareId: undefined,
              isOwner: tripData.isOwner !== undefined ? tripData.isOwner : true, // Default to true for backward compatibility
              aiPreferences: {
                activityIntensity: tripData.userInput.activity_level || 'moderate',
                mustSeePlaces: tripData.userInput.must_visit_places || [],
                budgetAdherence: 80, // Default value
              },
            };
          });

          // Set trips without persisting to localStorage
          // The trips data is managed in memory and fetched from API as needed
          set({ trips: transformedTrips, isLoading: false });
        } catch (error) {
          console.error('Error fetching trips:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trips';
          set({ error: errorMessage, isLoading: false, trips: [] });
        }
      },
      
      // Onboarding actions
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      updateOnboardingData: (data) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        }));
      },
      
      completeOnboarding: () => {
        const { onboardingData, firebaseUser, user: existingUser } = get();
        const user: UserProfile = {
          id: firebaseUser?.uid || crypto.randomUUID(),
          displayName: firebaseUser?.displayName || onboardingData.displayName || '',
          email: firebaseUser?.email || onboardingData.email || '',
          travelStyle: onboardingData.travelStyle || null,
          interests: onboardingData.interests || [],
          budgetPreference: onboardingData.budgetPreference || null,
          previousExperience: onboardingData.previousExperience || null,
          dietaryRestrictions: onboardingData.dietaryRestrictions || [],
          accessibilityNeeds: onboardingData.accessibilityNeeds || [],
          credits: existingUser?.credits ?? 2, // Preserve existing credits or default to 2
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

      // Credit actions
      updateUserCredits: (credits) => {
        set((state) => ({
          user: state.user ? { ...state.user, credits } : null,
        }));
      },

      deductCredit: async () => {
        try {
          const { firebaseUser, user } = get();
          if (!firebaseUser || !user) {
            set({ error: 'User not authenticated' });
            return false;
          }

          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/users/credits/deduct', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            set({ error: errorData.error || 'Failed to deduct credit' });
            return false;
          }

          const data = await response.json();
          get().updateUserCredits(data.credits);
          return true;
        } catch (error) {
          console.error('Error deducting credit:', error);
          set({ error: 'Failed to deduct credit' });
          return false;
        }
      },

      fetchUserCredits: async () => {
        try {
          const { firebaseUser } = get();
          if (!firebaseUser) return;

          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/users/credits', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            get().updateUserCredits(data.credits);
          }
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      },

      // AI itinerary actions
      startItineraryGeneration: async (userInput) => {
        // Initialize generation state
        set({ isGenerating: true, error: null, currentItinerary: null, currentTripId: null });

        const user = clientAuth.currentUser;
        if (!user) {
          set({ error: 'User not authenticated.', isGenerating: false });
          return;
        }
        const token = await user.getIdToken();

        try {
          const response = await fetch('/api/trips/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userInput),
          });

          const data = await response.json();
          if (!response.ok || !data?.success) {
            throw new Error(data?.error || 'Failed to start generation.');
          }

          // Update credits if returned from API
          if (typeof data.credits === 'number') {
            get().updateUserCredits(data.credits);
          }

          set({ currentTripId: data.tripId });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to start generation.';
          set({ error: message, isGenerating: false });
        }
      },

      listenToTripUpdates: (tripId: string) => {
        const tripRef = doc(db, 'trips', tripId);

        const unsubscribe = onSnapshot(tripRef, (docSnap) => {
          if (docSnap.exists()) {
            const tripData = docSnap.data() as { status?: string; itinerary?: unknown; error?: string };
            
            if (tripData.status === 'completed' && tripData.itinerary) {
              // Trip generation completed successfully
              set({ 
                currentItinerary: tripData.itinerary, 
                isGenerating: false, 
                error: null 
              });
              
              // Fetch the complete trip data and add to trips list
              const fetchCompleteTrip = async () => {
                try {
                  const response = await fetch(`/api/trips/${tripId}`);
                  if (response.ok) {
                    const tripDataFull = await response.json();
                    const { trips } = get();
                    
                    // Update or add the trip to the trips list
                    const existingIndex = trips.findIndex(t => t.id === tripId);
                    if (existingIndex >= 0) {
                      trips[existingIndex] = tripDataFull;
                      set({ trips: [...trips] });
                    } else {
                      set({ trips: [...trips, tripDataFull] });
                    }
                  }
                } catch (error) {
                  console.error('Error fetching completed trip:', error);
                }
              };
              
              fetchCompleteTrip();
            } else if (tripData.status === 'failed') {
              // Trip generation failed
              set({ error: tripData.error || 'Itinerary generation failed.', isGenerating: false });
            }
          }
        });

        return unsubscribe;
      },

      // Chat actions
      connectChat: async (tripId: string) => {
        try {
          // Get current Firebase user
          const firebaseUser = clientAuth.currentUser;
          if (!firebaseUser) {
            set({ chatError: 'User not authenticated' });
            return;
          }

          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Close existing connection if any
          const { webSocket } = get();
          if (webSocket && webSocket.readyState !== WebSocket.CLOSED) {
            webSocket.close();
          }

          // Validate WebSocket URL configuration
          const wsBaseUrl = process.env.NEXT_PUBLIC_FASTAPI_WS_URL;
          if (!wsBaseUrl) {
            console.error('[Chat] WebSocket URL not configured');
            set({ chatError: 'Chat service URL not configured', isChatConnected: false });
            return;
          }

          // Construct WebSocket URL
          const wsUrl = `${wsBaseUrl}/ws/${tripId}?token=${idToken}`;
          console.log('[Chat] Connecting to:', wsUrl.replace(/token=.*/, 'token=***'));

          // Create new WebSocket connection
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log('[Chat] WebSocket connected successfully');
            set({ isChatConnected: true, chatError: null, webSocket: ws });
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              // Handle typing indicator
              if (data.type === 'typing') {
                set({ isTyping: data.isTyping });
                return;
              }

              // Handle AI message
              if (data.type === 'message' && data.message) {
                // Decode the message if it contains escaped sequences
                let decodedMessage = data.message;
                
                // Check if the message contains escaped sequences like \n or \u
                if (typeof decodedMessage === 'string' && (decodedMessage.includes('\\n') || decodedMessage.includes('\\u'))) {
                  try {
                    // Try to parse it as a JSON string to decode escape sequences
                    decodedMessage = JSON.parse(`"${decodedMessage.replace(/"/g, '\\"')}"`);
                  } catch {
                    // If parsing fails, try replacing common escape sequences manually
                    decodedMessage = decodedMessage
                      .replace(/\\n/g, '\n')
                      .replace(/\\t/g, '\t')
                      .replace(/\\r/g, '\r');
                  }
                }
                
                const aiMessage = {
                  id: crypto.randomUUID(),
                  sender: 'ai' as const,
                  text: decodedMessage,
                  timestamp: new Date(),
                };
                set((state) => ({
                  chatMessages: [...state.chatMessages, aiMessage],
                  isTyping: false,
                }));
              }
            } catch (error) {
              console.error('[Chat] Error parsing message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('[Chat] WebSocket error:', error);
            const errorMessage = 'Failed to connect to chat service. Please check your connection.';
            set({ chatError: errorMessage, isChatConnected: false });
          };

          ws.onclose = (event) => {
            console.log('[Chat] WebSocket closed. Code:', event.code, 'Reason:', event.reason || 'No reason provided');
            set({ isChatConnected: false, webSocket: null });
            
            // Attempt reconnection after 3 seconds if not a normal closure
            if (event.code !== 1000 && event.code !== 1001) {
              console.log('[Chat] Connection closed unexpectedly, will attempt to reconnect in 3 seconds...');
              setTimeout(() => {
                const currentState = get();
                if (!currentState.isChatConnected && !currentState.webSocket) {
                  console.log('[Chat] Attempting to reconnect...');
                  get().connectChat(tripId);
                }
              }, 3000);
            }
          };

          set({ webSocket: ws });
        } catch (error) {
          console.error('[Chat] Failed to connect:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect to chat server';
          set({ chatError: errorMessage, isChatConnected: false });
        }
      },

      disconnectChat: () => {
        const { webSocket } = get();
        if (webSocket) {
          webSocket.close(1000, 'User disconnected');
          set({ webSocket: null, isChatConnected: false, isTyping: false });
        }
      },

      sendChatMessage: (messageText: string) => {
        const { webSocket, isChatConnected } = get();

        if (!messageText.trim()) return;

        // Add user message to chat
        const userMessage = {
          id: crypto.randomUUID(),
          sender: 'user' as const,
          text: messageText.trim(),
          timestamp: new Date(),
        };

        set((state) => ({
          chatMessages: [...state.chatMessages, userMessage],
        }));

        // Send message over WebSocket if connected
        if (webSocket && isChatConnected && webSocket.readyState === WebSocket.OPEN) {
          try {
            webSocket.send(JSON.stringify({
              type: 'message',
              message: messageText.trim(),
            }));
          } catch (error) {
            console.error('[Chat] Failed to send message:', error);
            set({ chatError: 'Failed to send message' });
          }
        } else {
          set({ chatError: 'Not connected to chat server' });
        }
      },

      addAiChatMessage: (messageText: string) => {
        const aiMessage = {
          id: crypto.randomUUID(),
          sender: 'ai' as const,
          text: messageText,
          timestamp: new Date(),
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, aiMessage],
        }));
      },

      clearChatMessages: () => {
        set({ chatMessages: [] });
      },

      setChatError: (error: string | null) => {
        set({ chatError: error });
      },
    }),
    {
      name: 'tripy-store',
      // Only persist minimal essential data to avoid localStorage quota issues
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist trips array - it can be very large with itineraries
        // Trips will be fetched from API on demand
      }),
      // Add custom storage with error handling for quota issues and SSR safety
      storage: {
        getItem: (name) => {
          try {
            if (typeof window === 'undefined') {
              return null; // SSR: return null
            }
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            if (typeof window === 'undefined') {
              return; // SSR: do nothing
            }
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error writing to localStorage:', error);
            // If quota exceeded, clear old data and try again
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.warn('localStorage quota exceeded, clearing stored data...');
              try {
                localStorage.removeItem(name);
                // Try storing minimal data (just auth state)
                const minimalValue = {
                  state: {
                    isAuthenticated: value.state?.isAuthenticated,
                    user: value.state?.user ? {
                      id: value.state.user.id,
                      email: value.state.user.email,
                      displayName: value.state.user.displayName,
                    } : null,
                  },
                  version: value.version,
                };
                localStorage.setItem(name, JSON.stringify(minimalValue));
              } catch (retryError) {
                console.error('Failed to store even minimal data:', retryError);
              }
            }
          }
        },
        removeItem: (name) => {
          try {
            if (typeof window === 'undefined') {
              return; // SSR: do nothing
            }
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);
