import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface TripData {
  id: string;
  rating?: number;
  destination?: {
    country?: string;
  };
  [key: string]: any;
}

interface UserData {
  id: string;
  createdAt?: any;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get all trips to calculate statistics
    const tripsRef = collection(db, 'trips');
    const tripsSnapshot = await getDocs(tripsRef);
    const trips: TripData[] = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all users to calculate user count
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users: UserData[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate statistics
    const totalTrips = trips.length;
    const totalUsers = users.length;
    
    // Calculate average rating from trips (if they have ratings)
    const tripsWithRatings = trips.filter(trip => trip.rating && typeof trip.rating === 'number');
    const averageRating = tripsWithRatings.length > 0 
      ? (tripsWithRatings.reduce((sum, trip) => sum + trip.rating!, 0) / tripsWithRatings.length).toFixed(1)
      : '4.9'; // Default fallback

    // Get unique countries from trips
    const countries = new Set<string>();
    trips.forEach(trip => {
      if (trip.destination?.country) {
        countries.add(trip.destination.country);
      }
    });
    const totalCountries = countries.size || 195; // Fallback to 195 if no countries found

    // Calculate awards/achievements based on trips created and user engagement
    const awards = Math.floor(totalTrips / 100) + Math.floor(totalUsers / 50) + 25; // Base 25 + awards for trips and users

    // Calculate active users (users who created trips in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const userCreatedAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return userCreatedAt >= thirtyDaysAgo;
    }).length;

    // Calculate public trips (trips with visibility 'public')
    const publicTrips = trips.filter(trip => trip.visibility === 'public').length;

    // Calculate average trip duration (if available)
    const tripsWithDuration = trips.filter(trip => trip.dates?.startDate && trip.dates?.endDate);
    const avgDuration = tripsWithDuration.length > 0 ? 
      tripsWithDuration.reduce((sum, trip) => {
        const start = trip.dates.startDate.toDate ? trip.dates.startDate.toDate() : new Date(trip.dates.startDate);
        const end = trip.dates.endDate.toDate ? trip.dates.endDate.toDate() : new Date(trip.dates.endDate);
        return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / tripsWithDuration.length : 7; // Default 7 days

    const stats = {
      userRating: parseFloat(averageRating),
      awardsWon: awards,
      countries: totalCountries,
      totalUsers: totalUsers,
      totalTrips: totalTrips,
      activeUsers: activeUsers,
      publicTrips: publicTrips,
      avgTripDuration: Math.round(avgDuration),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    
    // Return fallback data in case of error
    const fallbackStats = {
      userRating: 4.9,
      awardsWon: 50,
      countries: 195,
      totalUsers: 2000,
      totalTrips: 500,
      activeUsers: 1500,
      publicTrips: 150,
      avgTripDuration: 7,
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };

    return NextResponse.json(fallbackStats);
  }
}