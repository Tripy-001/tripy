'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users,
  Star,
  CheckCircle,
  Camera,
  MessageSquare,
  Navigation,
  AlertCircle,
  Sun,
  Cloud,
  CloudRain,
  Wind
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface ActiveTripPageProps {
  params: {
    id: string;
  };
}

const ActiveTripPage = ({ params }: ActiveTripPageProps) => {
  const router = useRouter();
  const { trips, updateTrip, updateActivity, completeActivity, rateActivity, addActivityNote } = useAppStore();
  const [currentDay, setCurrentDay] = useState(0);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState<string | null>(null);

  const trip = trips.find(t => t.id === params.id);

  if (!trip || trip.status !== 'active') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Trip not active</h2>
            <p className="text-muted-foreground mb-6">This trip is not currently active.</p>
            <Button onClick={() => router.push(`/trip/${params.id}`)}>
              View Trip Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = trip.dayPlans[currentDay];
  const completedActivities = today?.activities.filter(a => a.completed).length || 0;
  const totalActivities = today?.activities.length || 0;
  const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  const handleCompleteActivity = (activityId: string) => {
    completeActivity(trip.id, today.id, activityId);
  };

  const handleRateActivity = (activityId: string) => {
    if (rating > 0) {
      rateActivity(trip.id, today.id, activityId, rating);
      setShowRating(null);
      setRating(0);
    }
  };

  const handleAddNote = (activityId: string) => {
    if (note.trim()) {
      addActivityNote(trip.id, today.id, activityId, note);
      setShowNote(null);
      setNote('');
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="w-5 h-5 text-gray-500" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      default:
        return <Wind className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNextActivity = () => {
    return today?.activities.find(a => !a.completed);
  };

  const nextActivity = getNextActivity();

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
                onClick={() => router.push(`/trip/${trip.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{trip.title}</h1>
                <p className="text-sm text-muted-foreground">Day {currentDay + 1} of {trip.duration}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">
                Active Trip
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Day Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {today ? new Date(today.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'No activities planned'}
            </h2>
            <div className="flex space-x-2">
              {trip.dayPlans.map((_, index) => (
                <Button
                  key={index}
                  variant={index === currentDay ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentDay(index)}
                  className={index === currentDay ? 'bg-primary text-primary-foreground' : ''}
                >
                  Day {index + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Weather and Progress */}
          {today && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {getWeatherIcon(today.weather.condition)}
                    <div>
                      <p className="text-sm font-medium text-foreground">Weather</p>
                      <p className="text-sm text-muted-foreground">
                        {today.weather.temperature}°C, {today.weather.condition}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Progress</p>
                      <p className="text-sm text-muted-foreground">
                        {completedActivities}/{totalActivities} activities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Today's Budget</p>
                      <p className="text-sm text-muted-foreground">${today.totalCost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Next Activity Alert */}
        {nextActivity && (
          <Card className="glass-card mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Next up: {nextActivity.name}</p>
                  <p className="text-sm text-blue-700">
                    {nextActivity.description} • {nextActivity.duration} minutes • ${nextActivity.cost}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        {today ? (
          <div className="space-y-4">
            {today.activities.map((activity, index) => (
              <Card 
                key={activity.id} 
                className={`glass-card transition-all duration-200 ${
                  activity.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'hover:shadow-lg'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-primary text-white'
                      }`}>
                        {activity.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            activity.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {activity.name}
                          </h3>
                          <p className="text-muted-foreground mb-2">{activity.description}</p>
                        </div>
                        
                        {!activity.completed && (
                          <Button
                            onClick={() => handleCompleteActivity(activity.id)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {activity.duration} min
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${activity.cost}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {activity.location}
                        </span>
                      </div>

                      {/* Activity Actions */}
                      <div className="flex items-center space-x-2">
                        {activity.completed && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRating(activity.id)}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Rate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNote(activity.id)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Add Note
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Add Photo
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Rating Modal */}
                      {showRating === activity.id && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <Label className="text-sm font-medium mb-2 block">Rate this activity</Label>
                          <div className="flex items-center space-x-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-6 h-6 cursor-pointer ${
                                  star <= rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                                }`}
                                onClick={() => setRating(star)}
                              />
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleRateActivity(activity.id)}
                              disabled={rating === 0}
                            >
                              Submit Rating
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowRating(null);
                                setRating(0);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Note Modal */}
                      {showNote === activity.id && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <Label className="text-sm font-medium mb-2 block">Add a note about this activity</Label>
                          <Input
                            placeholder="Share your experience..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mb-3"
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddNote(activity.id)}
                              disabled={!note.trim()}
                            >
                              Add Note
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowNote(null);
                                setNote('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Activity Notes */}
                      {activity.userNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Your note:</strong> {activity.userNotes}
                          </p>
                        </div>
                      )}

                      {/* Activity Rating */}
                      {activity.userRating && activity.userRating > 0 && (
                        <div className="mt-3 flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">Your rating:</span>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < activity.userRating! ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No activities for this day</h3>
              <p className="text-muted-foreground">
                Check back later or add some activities to make the most of your trip.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActiveTripPage;
