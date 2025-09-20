import { z } from 'zod';

// Enums
export const ActivityLevel = z.enum(['relaxed', 'moderate', 'highly_active']);
export const TravelStyle = z.enum(['adventure', 'budget', 'luxury', 'cultural']);
export const AccommodationType = z.enum(['hotel', 'hostel', 'airbnb', 'resort', 'boutique']);

// Preference ratings (1-5)
const preferenceRating = z.number().min(1).max(5);

// Preferences schema
export const PreferencesSchema = z.object({
  food_dining: preferenceRating,
  history_culture: preferenceRating,
  nature_wildlife: preferenceRating,
  nightlife_entertainment: preferenceRating,
  shopping: preferenceRating,
  art_museums: preferenceRating,
  beaches_water: preferenceRating,
  mountains_hiking: preferenceRating,
  architecture: preferenceRating,
  local_markets: preferenceRating,
  photography: preferenceRating,
  wellness_relaxation: preferenceRating,
});

// Budget breakdown schema
export const BudgetBreakdownSchema = z.object({
  accommodation_percentage: z.number().min(20).max(60).default(40),
  food_percentage: z.number().min(20).max(50).default(30),
  activities_percentage: z.number().min(10).max(40).default(20),
  transport_percentage: z.number().min(5).max(20).default(10),
});

// Main trip plan request schema
export const TripPlanRequestSchema = z.object({
  // Basic Trip Info
  origin: z.string().min(2).max(100),
  destination: z.string().min(2).max(100),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  
  // Budget
  total_budget: z.number().nonnegative().optional(),
  budget_currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code').optional().default('INR'),
  budget_breakdown: BudgetBreakdownSchema.optional(),
  
  // Group Details
  group_size: z.number().min(1).max(20),
  traveler_ages: z.array(z.number().min(1).max(120)).min(1),
  
  // Travel Preferences
  activity_level: ActivityLevel,
  primary_travel_style: TravelStyle,
  secondary_travel_style: TravelStyle.optional(),
  
  // Detailed Preferences
  preferences: PreferencesSchema,
  
  // Accommodation & Transport
  accommodation_type: AccommodationType,
  transport_preferences: z.array(z.string()).default([]),
  
  // Special Requirements
  dietary_restrictions: z.array(z.string()).default([]),
  accessibility_needs: z.array(z.string()).default([]),
  special_occasions: z.array(z.string()).default([]),
  
  // Specific Requests
  must_visit_places: z.array(z.string()).default([]),
  must_try_cuisines: z.array(z.string()).default([]),
  avoid_places: z.array(z.string()).default([]),
  
  // Additional Info
  previous_visits: z.boolean().default(false),
  language_preferences: z.array(z.string()).default(['en']),
}).refine((data) => {
  // Validate that end date is after start date
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  // Validate that traveler ages count matches group size
  return data.traveler_ages.length === data.group_size;
}, {
  message: 'Number of traveler ages must match group size',
  path: ['traveler_ages'],
});

export type TripPlanRequest = z.infer<typeof TripPlanRequestSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>;

// Default values for form initialization
export const defaultTripPlanValues: Partial<TripPlanRequest> = {
  origin: '',
  destination: '',
  start_date: '',
  end_date: '',
  budget_currency: 'INR',
  group_size: 1,
  traveler_ages: [25],
  activity_level: 'moderate',
  primary_travel_style: 'cultural',
  accommodation_type: 'hotel',
  transport_preferences: [],
  dietary_restrictions: [],
  accessibility_needs: [],
  special_occasions: [],
  must_visit_places: [],
  must_try_cuisines: [],
  avoid_places: [],
  previous_visits: false,
  language_preferences: ['en'],
  preferences: {
    food_dining: 3,
    history_culture: 3,
    nature_wildlife: 3,
    nightlife_entertainment: 3,
    shopping: 3,
    art_museums: 3,
    beaches_water: 3,
    mountains_hiking: 3,
    architecture: 3,
    local_markets: 3,
    photography: 3,
    wellness_relaxation: 3,
  },
  budget_breakdown: {
    accommodation_percentage: 40,
    food_percentage: 30,
    activities_percentage: 20,
    transport_percentage: 10,
  },
};
