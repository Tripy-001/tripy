'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  ArrowRight, 
  Plane, 
  Clock,
  TrendingUp,
  Heart,
  X,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const DashboardPage = () => {
  const router = useRouter();
  const { user, trips, setCurrentStep, authLoading, firebaseUser, fetchUserTrips, isLoading, error } = useAppStore();

  const handleCreateTrip = () => {
    setCurrentStep('trip-creation');
    router.push('/trip/create');
  };

  const handleViewTrip = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'active': return <Plane className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!firebaseUser) {
        router.replace('/signin');
      } else {
        // Fetch user trips when component mounts
        fetchUserTrips();
      }
    }
  }, [authLoading, firebaseUser, router, fetchUserTrips]);
  if (authLoading || !firebaseUser) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><span className="text-lg text-muted-foreground">Loading...</span></div>;
  }
  return (
    <div className="min-h-screen bg-muted/30">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.displayName || 'Traveler'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Ready to plan your next adventure? Let AI craft the perfect trip for you.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                  <p className="text-2xl font-bold text-foreground">{trips.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Trips</p>
                  <p className="text-2xl font-bold text-foreground">
                    {trips.filter(trip => trip.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destinations</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(trips.map(trip => trip.destination.split('→')[1]?.trim()).filter(Boolean)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{trips.reduce((sum, trip) => sum + trip.totalCost, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              onClick={handleCreateTrip}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 theme-bg rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Plan New Trip</h4>
                <p className="text-sm text-muted-foreground">Create a personalized itinerary with AI</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 theme-bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Explore Destinations</h4>
                <p className="text-sm text-muted-foreground">Discover amazing places to visit</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Share Trip</h4>
                <p className="text-sm text-muted-foreground">Share your travel experiences</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Your Trips</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchUserTrips()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {trips.length > 6 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/trips')}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="glass-card border-red-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Error Loading Trips</h4>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button
                  onClick={() => fetchUserTrips()}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Plane className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Loading your trips...</h4>
                <p className="text-muted-foreground">Please wait while we fetch your travel data</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && trips.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No trips yet</h4>
                <p className="text-muted-foreground mb-6">
                  Start planning your first adventure with AI-powered recommendations
                </p>
                <Button
                  onClick={handleCreateTrip}
                  className="theme-bg theme-bg-hover text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Trips Grid */}
          {!isLoading && !error && trips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.slice(0, 6).map((trip) => (
                <Card 
                  key={trip.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  onClick={() => handleViewTrip(trip.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{trip.title}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {trip.destination}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(trip.status)}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1 capitalize">{trip.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          ₹{trip.totalCost.toLocaleString()}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {trip.duration} day{trip.duration > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">
                            {trip.status === 'completed' ? '100%' : 
                             trip.status === 'active' ? '50%' : '25%'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              trip.status === 'completed' ? 'bg-green-500' :
                              trip.status === 'active' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ 
                              width: trip.status === 'completed' ? '100%' : 
                                     trip.status === 'active' ? '50%' : '25%' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
