'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock,
  X,
  RefreshCw,
  Search,
  ArrowLeft,
  Filter,
  Star,
  Plane
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TripsPage = () => {
  const router = useRouter();
  const { trips, authLoading, firebaseUser, fetchUserTrips, isLoading, error } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

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
        fetchUserTrips();
      }
    }
  }, [authLoading, firebaseUser, router, fetchUserTrips]);

  if (authLoading || !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Filter and sort trips
  let filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort trips
  filteredTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'date-asc':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'cost-desc':
        return b.totalCost - a.totalCost;
      case 'cost-asc':
        return a.totalCost - b.totalCost;
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mb-6 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">All Trips</h1>
              <p className="text-muted-foreground">
                Manage and view all your travel plans
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-1 lg:max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px] h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="cost-desc">Cost (Highest First)</SelectItem>
                  <SelectItem value="cost-asc">Cost (Lowest First)</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => fetchUserTrips()}
                variant="outline"
                disabled={isLoading}
                className="h-10 sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && !error && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredTrips.length}</span> of <span className="text-foreground font-semibold">{trips.length}</span> trip{trips.length !== 1 ? 's' : ''}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

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
        {!isLoading && !error && filteredTrips.length === 0 && trips.length === 0 && (
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
                onClick={() => router.push('/trip/create')}
                className="theme-bg theme-bg-hover text-primary-foreground"
              >
                Plan Your First Trip
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredTrips.length === 0 && trips.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No trips found</h4>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trips Grid */}
        {!isLoading && !error && filteredTrips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
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
                        <DollarSign className="w-4 h-4 mr-1" />
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
  );
};

export default TripsPage;
