'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users,
  Star,
  Edit3,
  Share2,
  Download,
  Plus,
  GripVertical
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface TripDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}


const TripDetailPage = ({ params }: TripDetailPageProps) => {
  const router = useRouter();
  const localParams = React.use(params)
  const { trips, updateTrip, setCurrentTrip } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState('');

  const trip = trips.find(t => t.id === localParams.id);

  if (!trip) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Trip not found</h2>
            <p className="text-muted-foreground mb-6">The trip you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartTrip = () => {
    updateTrip(trip.id, { status: 'active' });
    setCurrentTrip(trip);
    router.push(`/trip/${trip.id}/active`);
  };

  const handleCompleteTrip = () => {
    updateTrip(trip.id, { status: 'completed' });
  };

  const handleShareTrip = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing trip:', trip.id);
  };

  const handleExportTrip = () => {
    // TODO: Implement export functionality
    console.log('Exporting trip:', trip.id);
  };

  const addActivity = (dayId: string) => {
    if (newActivity.trim()) {
      const day = trip.dayPlans.find(d => d.id === dayId);
      if (day) {
        const newActivityObj = {
          id: crypto.randomUUID(),
          name: newActivity,
          description: 'Custom activity',
          location: trip.destination,
          duration: 120,
          cost: 0,
          category: 'activity' as const,
          rating: 0,
          coordinates: { lat: 0, lng: 0 },
          weatherDependent: false,
          completed: false,
        };
        
        updateTrip(trip.id, {
          dayPlans: trip.dayPlans.map(d => 
            d.id === dayId 
              ? { ...d, activities: [...d.activities, newActivityObj] }
              : d
          )
        });
        setNewActivity('');
        setEditingDay(null);
      }
    }
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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{trip.title}</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(trip.status)}>
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Overview */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{trip.title}</CardTitle>
                <CardDescription className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  {trip.destination}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleShareTrip}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTrip}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Dates</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Duration</p>
                  <p className="text-sm text-muted-foreground">{trip.duration} days</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Travelers</p>
                  <p className="text-sm text-muted-foreground">{trip.travelers}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Budget</p>
                  <p className="text-sm text-muted-foreground">${trip.budget.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          {trip.status === 'planning' && (
            <Button
              onClick={handleStartTrip}
              className="theme-bg theme-bg-hover text-primary-foreground px-8"
            >
              Start Trip
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
          
          {trip.status === 'active' && (
            <Button
              onClick={handleCompleteTrip}
              variant="outline"
              className="px-8"
            >
              Complete Trip
            </Button>
          )}
        </div>

        {/* Day Plans */}
        <div className="space-y-6">
          {trip.dayPlans.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No itinerary yet</h3>
                <p className="text-muted-foreground mb-6">
                  Your AI-generated itinerary will appear here once it's ready.
                </p>
                <Button
                  onClick={() => router.push('/trip/ai-generation')}
                  className="theme-bg theme-bg-hover text-primary-foreground"
                >
                  Generate Itinerary
                </Button>
              </CardContent>
            </Card>
          ) : (
            trip.dayPlans.map((day, dayIndex) => (
              <Card key={day.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Day {dayIndex + 1}</CardTitle>
                      <CardDescription>
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {day.weather.temperature}°C {day.weather.condition}
                      </Badge>
                      <Badge variant="outline">
                        ${day.totalCost}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {day.activities.map((activity, activityIndex) => (
                      <div
                        key={activity.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                          activity.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-card border-border hover:shadow-md'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${activity.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {activity.name}
                            </h4>
                            {activity.completed && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {activity.duration} min
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${activity.cost}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {activity.location}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {activity.rating > 0 && (
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < activity.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement activity editing
                                console.log('Edit activity:', activity.id);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Input
                          placeholder="Add new activity"
                          value={newActivity}
                          onChange={(e) => setNewActivity(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addActivity(day.id)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => addActivity(day.id)}
                          disabled={!newActivity.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetailPage;
