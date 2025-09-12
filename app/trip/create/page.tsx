'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock,
  Sparkles,
  Search,
  Plus,
  X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const TripCreationPage = () => {
  const router = useRouter();
  const { 
    tripCreationStep, 
    setTripCreationStep, 
    tripCreationData, 
    updateTripCreationData,
    completeTripCreation 
  } = useAppStore();
  
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [budget, setBudget] = useState([1000]);
  const [activityIntensity, setActivityIntensity] = useState('moderate');
  const [mustSeePlaces, setMustSeePlaces] = useState<string[]>([]);
  const [newPlace, setNewPlace] = useState('');

  const handleNext = () => {
    if (tripCreationStep < 4) {
      setTripCreationStep(tripCreationStep + 1);
    } else {
      // Create the trip
      const tripData = {
        title: `${destination} Adventure`,
        destination,
        startDate,
        endDate,
        duration: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
        travelers,
        budget: budget[0],
        status: 'planning' as const,
        dayPlans: [],
        totalCost: 0,
        shared: false,
        aiPreferences: {
          activityIntensity: activityIntensity as 'relaxed' | 'moderate' | 'packed',
          mustSeePlaces,
          budgetAdherence: 100,
        },
      };
      
      updateTripCreationData(tripData);
      completeTripCreation();
      router.push('/trip/ai-generation');
    }
  };

  const handleBack = () => {
    if (tripCreationStep > 0) {
      setTripCreationStep(tripCreationStep - 1);
    } else {
      router.push('/dashboard');
    }
  };

  const addMustSeePlace = () => {
    if (newPlace.trim() && !mustSeePlaces.includes(newPlace.trim())) {
      setMustSeePlaces([...mustSeePlaces, newPlace.trim()]);
      setNewPlace('');
    }
  };

  const removeMustSeePlace = (place: string) => {
    setMustSeePlaces(mustSeePlaces.filter(p => p !== place));
  };

  const renderStep = () => {
    switch (tripCreationStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto theme-bg rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Where would you like to go?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Tell us your dream destination and we'll create the perfect itinerary
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="destination"
                    type="text"
                    placeholder="Search for a city, country, or region"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelers">Number of Travelers</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    disabled={travelers <= 1}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">{travelers}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTravelers(travelers + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto theme-bg-accent rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">What's your budget?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Help us find the best experiences within your budget
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Total Budget: ${budget[0].toLocaleString()}</Label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  max={10000}
                  min={500}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$500</span>
                  <span>$10,000+</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Budget', range: [500, 2000], icon: '💰' },
                  { label: 'Mid-range', range: [2000, 5000], icon: '🏨' },
                  { label: 'Luxury', range: [5000, 10000], icon: '✨' },
                ].map((tier) => (
                  <Card
                    key={tier.label}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      budget[0] >= tier.range[0] && budget[0] <= tier.range[1] 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => setBudget([tier.range[0]])}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="text-2xl">{tier.icon}</div>
                      <h3 className="font-semibold">{tier.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        ${tier.range[0].toLocaleString()} - ${tier.range[1].toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">How active do you want to be?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose your preferred pace for the trip
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  id: 'relaxed', 
                  label: 'Relaxed', 
                  desc: 'Leisurely pace with plenty of downtime',
                  icon: '😌',
                  activities: ['Spa visits', 'Beach time', 'Café hopping', 'Museum tours']
                },
                { 
                  id: 'moderate', 
                  label: 'Moderate', 
                  desc: 'Balanced mix of activities and relaxation',
                  icon: '🚶‍♂️',
                  activities: ['City walking tours', 'Local markets', 'Restaurant visits', 'Light hiking']
                },
                { 
                  id: 'packed', 
                  label: 'Packed', 
                  desc: 'Full schedule with maximum experiences',
                  icon: '🏃‍♂️',
                  activities: ['Multiple attractions', 'Adventure sports', 'Nightlife', 'Long excursions']
                },
              ].map((intensity) => (
                <Card
                  key={intensity.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    activityIntensity === intensity.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setActivityIntensity(intensity.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{intensity.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{intensity.label}</h3>
                        <p className="text-muted-foreground mb-3">{intensity.desc}</p>
                        <div className="flex flex-wrap gap-2">
                          {intensity.activities.map((activity) => (
                            <Badge key={activity} variant="secondary" className="text-xs">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto theme-bg-accent rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Any must-see places?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add specific attractions or locations you don't want to miss
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a place (e.g., Eiffel Tower, Times Square)"
                  value={newPlace}
                  onChange={(e) => setNewPlace(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMustSeePlace()}
                  className="flex-1"
                />
                <Button onClick={addMustSeePlace} disabled={!newPlace.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {mustSeePlaces.length > 0 && (
                <div className="space-y-2">
                  <Label>Must-see places:</Label>
                  <div className="flex flex-wrap gap-2">
                    {mustSeePlaces.map((place) => (
                      <Badge key={place} variant="secondary" className="flex items-center gap-1">
                        {place}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeMustSeePlace(place)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't worry if you don't have specific places in mind - our AI will suggest amazing options!
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Ready to create your trip?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Review your preferences and let our AI craft the perfect itinerary
              </p>
            </div>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Destination:</span>
                    <span className="text-muted-foreground">{destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dates:</span>
                    <span className="text-muted-foreground">
                      {startDate && endDate 
                        ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                        : 'Not set'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Travelers:</span>
                    <span className="text-muted-foreground">{travelers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Budget:</span>
                    <span className="text-muted-foreground">${budget[0].toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Activity Level:</span>
                    <span className="text-muted-foreground capitalize">{activityIntensity}</span>
                  </div>
                  {mustSeePlaces.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="font-medium">Must-see places:</span>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {mustSeePlaces.map((place) => (
                          <Badge key={place} variant="secondary" className="text-xs">
                            {place}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="invisible"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      step <= tripCreationStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {renderStep()}
            
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleNext}
                className="theme-bg theme-bg-hover text-primary-foreground px-8"
                disabled={
                  (tripCreationStep === 0 && (!destination || !startDate || !endDate)) ||
                  (tripCreationStep === 1 && budget[0] < 500) ||
                  (tripCreationStep === 2 && !activityIntensity)
                }
              >
                {tripCreationStep === 4 ? 'Create Trip' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripCreationPage;
