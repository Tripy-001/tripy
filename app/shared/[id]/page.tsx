'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  Star,
  Heart,
  ArrowRight,
  Globe,
  CheckCircle,
  DollarSign,
  Camera,
  MessageCircle,
  Sun,
  Cloud,
  CloudRain,
  Wind
} from 'lucide-react';

interface SharedTripPageProps {
  params: {
    id: string;
  };
}

const SharedTripPage = ({ params }: SharedTripPageProps) => {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(42);

  // Mock trip data - in real app, this would be fetched based on shareId
  const trip = {
    id: params.id,
    title: "Amazing Tokyo Adventure",
    destination: "Tokyo, Japan",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    duration: 7,
    travelers: 2,
    budget: 2500,
    status: "completed",
    shared: true,
    shareId: params.id,
    dayPlans: [
      {
        id: "day1",
        date: "2024-03-15",
        activities: [
          {
            id: "act1",
            name: "Arrive at Narita Airport",
            description: "Land in Tokyo and take the train to the city",
            location: "Narita Airport",
            duration: 120,
            cost: 50,
            category: "transport",
            rating: 4,
            completed: true,
            photos: ["https://example.com/photo1.jpg"]
          },
          {
            id: "act2",
            name: "Check into Hotel in Shibuya",
            description: "Settle into your accommodation",
            location: "Shibuya, Tokyo",
            duration: 60,
            cost: 150,
            category: "accommodation",
            rating: 5,
            completed: true,
            photos: []
          },
          {
            id: "act3",
            name: "Explore Shibuya Crossing",
            description: "Experience the famous scramble crossing",
            location: "Shibuya Crossing",
            duration: 90,
            cost: 0,
            category: "attraction",
            rating: 5,
            completed: true,
            photos: ["https://example.com/photo2.jpg"]
          }
        ],
        totalCost: 200,
        weather: {
          temperature: 18,
          condition: "sunny",
          icon: "sun"
        }
      },
      {
        id: "day2",
        date: "2024-03-16",
        activities: [
          {
            id: "act4",
            name: "Visit Senso-ji Temple",
            description: "Tokyo's oldest temple in Asakusa",
            location: "Asakusa, Tokyo",
            duration: 120,
            cost: 0,
            category: "attraction",
            rating: 5,
            completed: true,
            photos: ["https://example.com/photo3.jpg"]
          },
          {
            id: "act5",
            name: "Lunch at Tsukiji Fish Market",
            description: "Fresh sushi and local delicacies",
            location: "Tsukiji Market",
            duration: 90,
            cost: 80,
            category: "restaurant",
            rating: 5,
            completed: true,
            photos: []
          }
        ],
        totalCost: 80,
        weather: {
          temperature: 20,
          condition: "partly cloudy",
          icon: "cloud"
        }
      }
    ],
    totalCost: 2500,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-22"),
    aiPreferences: {
      activityIntensity: "moderate",
      mustSeePlaces: ["Shibuya Crossing", "Senso-ji Temple"],
      budgetAdherence: 95
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handlePlanSimilar = () => {
    router.push('/onboarding');
  };

  const completedActivities = trip.dayPlans.reduce((total, day) => 
    total + day.activities.filter(a => a.completed).length, 0
  );
  const totalActivities = trip.dayPlans.reduce((total, day) => 
    total + day.activities.length, 0
  );

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">tripy</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
              >
                Home
              </Button>
              <Button
                onClick={handlePlanSimilar}
                className="theme-bg theme-bg-hover text-primary-foreground"
              >
                Plan Similar Trip
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Hero */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-3xl">{trip.title}</CardTitle>
                  <CardDescription className="flex items-center text-xl mt-2">
                    <MapPin className="w-6 h-6 mr-2" />
                    {trip.destination}
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-6">
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed Trip
                  </Badge>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`flex items-center space-x-2 ${
                        liked ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                      <span>{likes}</span>
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
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
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Activities</p>
                  <p className="text-sm text-muted-foreground">
                    {completedActivities}/{totalActivities} completed
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Total Cost</p>
                  <p className="text-sm text-muted-foreground">${trip.totalCost.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Trip Tree Visualization */}
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <div className="w-20 h-20 theme-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Interactive Trip Map</h3>
              <p className="text-muted-foreground mb-4">
                Explore the journey through {trip.destination} with our interactive visualization
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  View Photos
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Read Comments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Plans */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Itinerary</h2>
          
          {trip.dayPlans.map((day, dayIndex) => (
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
                    <div className="flex items-center space-x-1">
                      {getWeatherIcon(day.weather.condition)}
                      <span className="text-sm">{day.weather.temperature}°C</span>
                    </div>
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
                      className="flex items-start space-x-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">{activity.name}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          
                          {activity.rating > 0 && (
                            <div className="flex items-center space-x-1">
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
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
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

                        {activity.photos && activity.photos.length > 0 && (
                          <div className="mt-3 flex space-x-2">
                            {activity.photos.map((photo, photoIndex) => (
                              <div
                                key={photoIndex}
                                className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center"
                              >
                                <Camera className="w-6 h-6 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="glass-card mt-8 bg-muted/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 theme-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Inspired by this trip?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your own personalized adventure with AI-powered recommendations based on millions of real traveler experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePlanSimilar}
                className="theme-bg theme-bg-hover text-primary-foreground px-8"
              >
                Plan Similar Trip
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
              >
                Explore More Trips
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedTripPage;
