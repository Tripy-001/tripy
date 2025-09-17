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
  GripVertical,
  CheckCircle,
  Utensils
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AI_RESPONSE } from '@/app/constant';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GoogleMapsPreview from '@/components/GoogleMapsPreview';

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

  const response = AI_RESPONSE;

  // Map AI response to our store types
  const mapCategory = (raw?: string | null): 'attraction' | 'restaurant' | 'activity' | 'transport' | 'accommodation' => {
    if (!raw) return 'activity';
    const lc = raw.toLowerCase();
    if (lc.includes('restaurant') || lc.includes('food') || lc.includes('cafe')) return 'restaurant';
    if (lc.includes('hotel') || lc.includes('stay') || lc.includes('accommodation')) return 'accommodation';
    if (lc.includes('transport') || lc.includes('bus') || lc.includes('train') || lc.includes('taxi')) return 'transport';
    return 'attraction';
  };

  const mapAiToDayPlans = React.useCallback((ai: any) => {
    const days: any[] = ai?.daily_itineraries || [];
    return days.map((day: any) => {
      const allBlocks = [
        { label: 'Morning', key: 'morning' },
        { label: 'Lunch', key: 'lunch' },
        { label: 'Afternoon', key: 'afternoon' },
        { label: 'Evening', key: 'evening' },
      ];
      const activities: any[] = [];
      allBlocks.forEach((block) => {
        const section = day?.[block.key];
        if (!section) return;
        // Handle lunch special shape
        if (block.key === 'lunch' && section?.restaurant) {
          const restaurant = section.restaurant;
          const durationHours = section?.duration_hours ?? restaurant?.duration_hours;
          const cost = section?.estimated_cost_per_person ?? restaurant?.estimated_cost ?? 0;
          activities.push({
            id: crypto.randomUUID(),
            name: restaurant?.name || 'Lunch',
            description: restaurant?.description || 'Lunch',
            location: restaurant?.address || restaurant?.name || ai?.destination || 'Location',
            duration: typeof durationHours === 'number' ? Math.round(durationHours * 60) : 60,
            cost: typeof cost === 'number' ? cost : parseFloat(cost || '0') || 0,
            category: 'restaurant',
            rating: typeof restaurant?.rating === 'number' ? restaurant.rating : 0,
            coordinates: {
              lat: restaurant?.coordinates?.lat ?? 0,
              lng: restaurant?.coordinates?.lng ?? 0,
            },
            weatherDependent: false,
            redditInsights: restaurant?.why_recommended || '',
            completed: false,
          });
          return;
        }
        const items = section?.activities || [];
        items.forEach((item: any) => {
          const place = item?.activity || {};
          const durationHours = place?.duration_hours ?? item?.duration_hours;
          const cost = item?.estimated_cost_per_person ?? place?.estimated_cost ?? 0;
          activities.push({
            id: crypto.randomUUID(),
            name: place?.name || item?.activity_type || 'Activity',
            description: place?.description || item?.activity_type || '',
            location: place?.address || place?.name || ai?.destination || 'Location',
            duration: typeof durationHours === 'number' ? Math.round(durationHours * 60) : 60,
            cost: typeof cost === 'number' ? cost : parseFloat(cost || '0') || 0,
            category: mapCategory(place?.category),
            rating: typeof place?.rating === 'number' ? place.rating : 0,
            coordinates: {
              lat: place?.coordinates?.lat ?? 0,
              lng: place?.coordinates?.lng ?? 0,
            },
            weatherDependent: !!item?.weather_dependent,
            redditInsights: place?.why_recommended || '',
            completed: false,
          });
        });
      });
      return {
        id: crypto.randomUUID(),
        date: day?.date || new Date().toISOString(),
        activities,
        totalCost: parseFloat(day?.daily_total_cost || '0') || 0,
        weather: {
          temperature: 0,
          condition: '',
          icon: '',
        },
        notes: Array.isArray(day?.daily_notes) ? day.daily_notes.join(' \n') : '',
      };
    });
  }, [response?.destination]);

  const aiDayPlans = React.useMemo(() => mapAiToDayPlans(response), [mapAiToDayPlans, response]);

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

  // Import helpers from AI preview
  const importAllAI = () => {
    if (!aiDayPlans?.length) return;
    const willReplace = trip.dayPlans.length > 0 ? confirm('Replace your current itinerary with the AI plan? This will overwrite your days.') : true;
    if (!willReplace) return;
    updateTrip(trip.id, { dayPlans: aiDayPlans });
  };

  // removed per-day/per-activity import actions from UI per request

  // Convert raw AI item (activity or restaurant) into our Activity and add it
  const mapRawItemToActivity = (raw: any): any => {
    const place = raw?.activity || raw?.restaurant || raw || {};
    const durationHours = raw?.duration_hours ?? place?.duration_hours;
    const cost = raw?.estimated_cost_per_person ?? place?.estimated_cost ?? 0;
    return {
      id: crypto.randomUUID(),
      name: place?.name || raw?.activity_type || 'Activity',
      description: place?.description || raw?.activity_type || '',
      location: place?.address || place?.name || response?.destination || 'Location',
      duration: typeof durationHours === 'number' ? Math.round(durationHours * 60) : 60,
      cost: typeof cost === 'number' ? cost : parseFloat(cost || '0') || 0,
      category: mapCategory(place?.category || (raw?.restaurant ? 'restaurant' : undefined)),
      rating: typeof place?.rating === 'number' ? place.rating : 0,
      coordinates: {
        lat: place?.coordinates?.lat ?? 0,
        lng: place?.coordinates?.lng ?? 0,
      },
      weatherDependent: !!raw?.weather_dependent,
      redditInsights: place?.why_recommended || '',
      completed: false,
    };
  };

  const addSingleAIActivityFromRaw = (dayDate: string, rawItem: any) => {
    const activity = mapRawItemToActivity(rawItem);
    const existingDay = trip.dayPlans.find(d => new Date(d.date).toDateString() === new Date(dayDate).toDateString());
    if (existingDay) {
      updateTrip(trip.id, {
        dayPlans: trip.dayPlans.map(d => d.id === existingDay.id ? { ...d, activities: [...d.activities, activity] } : d)
      });
    } else {
      const newDay = {
        id: crypto.randomUUID(),
        date: dayDate,
        activities: [activity],
        totalCost: activity.cost || 0,
        weather: { temperature: 0, condition: '', icon: '' },
        notes: '',
      };
      updateTrip(trip.id, { dayPlans: [...trip.dayPlans, newDay] });
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
        {/* AI Itinerary Preview */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">AI Itinerary Preview</CardTitle>
                <CardDescription>Generated plan based on your inputs. Import fully or cherry-pick days and activities.</CardDescription>
              </div>
              <div className="flex gap-2"></div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary chips */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.origin} → {response.destination}</span></div>
              <div className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.trip_duration_days} day(s)</span></div>
              <div className="flex items-center space-x-2"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.group_size} people</span></div>
              <div className="flex items-center space-x-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.total_budget} {response.currency}</span></div>
              <div className="flex items-center space-x-2"><Star className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.travel_style}</span></div>
              <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{response.activity_level}</span></div>
            </div>

            {/* Day-wise timeline accordion */}
            <div className="relative">
              {/* Main timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
              
              <Accordion type="single" collapsible defaultValue="day-1" className="w-full space-y-4">
                {response.daily_itineraries?.map((day: any, idx: number) => (
                  <AccordionItem key={idx} value={`day-${idx + 1}`} className="border-0 bg-transparent">
                    <AccordionTrigger className="relative pl-16 py-6 hover:no-underline group">
                      {/* Timeline dot */}
                      <div className="absolute left-4 top-6 w-4 h-4 rounded-full theme-bg border-4 border-white dark:border-gray-900 shadow-lg z-10 group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1">Day {day.day_number}</Badge>
                            <h3 className="text-lg font-semibold text-foreground">{day.theme}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(day.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {day.daily_notes && day.daily_notes.length > 0 ? 'Full day' : 'Activities planned'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="px-3 py-1 font-medium">
                            {day.daily_total_cost || '—'} {response.currency}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative pl-16 pb-8">
                        <div className="rounded-2xl border bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-sm p-6 shadow-lg">
                          {/* Day summary */}
                          {day.daily_notes && day.daily_notes.length > 0 && (
                            <div className="mb-6 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                {Array.isArray(day.daily_notes) ? day.daily_notes.join(' ') : day.daily_notes}
                              </p>
                            </div>
                          )}
                          
                          <div className="space-y-8">
                            {(['morning','lunch','afternoon','evening'] as const).map((sectionKey) => {
                              const section: any = day?.[sectionKey];
                              if (!section) return null;
                              
                              // Section header
                              const sectionIcons = {
                                morning: '🌅',
                                lunch: '🍽️',
                                afternoon: '☀️',
                                evening: '🌅'
                              };
                              
                              if (sectionKey === 'lunch' && section.restaurant) {
                                const restaurant = section.restaurant;
                                return (
                                  <div key={sectionKey} className="space-y-4">
                                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                      <span className="text-lg">{sectionIcons[sectionKey]}</span>
                                      <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                      <Badge variant="secondary" className="ml-auto">
                                        {typeof section.duration_hours === 'number' ? `${section.duration_hours} hrs` : 'Meal time'}
                                      </Badge>
                                    </div>
                                    
                                    <div className="p-6 rounded-xl border bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-900/20 dark:to-amber-900/20 hover:shadow-lg transition-all duration-300">
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                          <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                                              <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1">
                                              <h5 className="font-semibold text-lg text-foreground">{restaurant.name || 'Lunch'}</h5>
                                              <div className="flex items-center gap-2 mt-1">
                                                {restaurant.category && <Badge variant="outline">{restaurant.category}</Badge>}
                                                {typeof restaurant.rating === 'number' && (
                                                  <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star key={i} className={`w-4 h-4 ${i < Math.round(restaurant.rating) ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                                                    ))}
                                                    <span className="text-sm text-muted-foreground ml-1">({restaurant.rating})</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <p className="text-sm text-muted-foreground leading-relaxed">{restaurant.description || 'Lunch'}</p>
                                          
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-4 h-4 text-muted-foreground" />
                                              <span>{restaurant.duration_hours ? `${restaurant.duration_hours} hrs` : '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                                              <span>{section.estimated_cost_per_person ?? restaurant.estimated_cost ?? 0} {response.currency}</span>
                                            </div>
                                          </div>
                                          
                                          {restaurant.address && (
                                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                              <span className="leading-relaxed">{restaurant.address}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div>
                                          <GoogleMapsPreview
                                            lat={restaurant?.coordinates?.lat}
                                            lng={restaurant?.coordinates?.lng}
                                            placeId={restaurant?.place_id}
                                            name={restaurant?.name}
                                            ratio={16 / 10}
                                            className="w-full"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              if (!section.activities || section.activities.length === 0) return null;
                              
                              return (
                                <div key={sectionKey} className="space-y-4">
                                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                    <span className="text-lg">{sectionIcons[sectionKey]}</span>
                                    <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                    <Badge variant="secondary" className="ml-auto">
                                      {typeof section.total_duration_hours === 'number' ? `${section.total_duration_hours} hrs` : 'Activities'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid gap-4">
                                    {section.activities.map((act: any, aIdx: number) => {
                                      const place = act.activity || {};
                                      return (
                                        <div key={aIdx} className="p-6 rounded-xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-lg transition-all duration-300">
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                              <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-semibold text-lg text-foreground">{place.name || act.activity_type}</h5>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    {place.category && <Badge variant="outline">{place.category}</Badge>}
                                                    {typeof place.rating === 'number' && (
                                                      <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                          <Star key={i} className={`w-4 h-4 ${i < Math.round(place.rating) ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                                                        ))}
                                                        <span className="text-sm text-muted-foreground ml-1">({place.rating})</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <p className="text-sm text-muted-foreground leading-relaxed">{place.description || act.activity_type}</p>
                                              
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                                  <span>{place.duration_hours ? `${place.duration_hours} hrs` : '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                  <span>{act.estimated_cost_per_person ?? place.estimated_cost ?? 0} {response.currency}</span>
                                                </div>
                                              </div>
                                              
                                              {place.address && (
                                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                  <span className="leading-relaxed">{place.address}</span>
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div>
                                              <GoogleMapsPreview
                                                lat={place?.coordinates?.lat}
                                                lng={place?.coordinates?.lng}
                                                placeId={place?.place_id}
                                                name={place?.name}
                                                ratio={16 / 10}
                                                className="w-full"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Budget & Accommodation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Budget breakdown</CardTitle>
                  <CardDescription>How the estimated costs are distributed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" />Total: {response.budget_breakdown?.total_budget} {response.budget_breakdown?.currency || response.currency}</div>
                    <div>Food: {response.budget_breakdown?.food_cost} {response.budget_breakdown?.currency || response.currency}</div>
                    <div>Activities: {response.budget_breakdown?.activities_cost} {response.budget_breakdown?.currency || response.currency}</div>
                    <div>Transport: {response.budget_breakdown?.transport_cost} {response.budget_breakdown?.currency || response.currency}</div>
                    <div>Misc: {response.budget_breakdown?.miscellaneous_cost} {response.budget_breakdown?.currency || response.currency}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Accommodation</CardTitle>
                  <CardDescription>Top picks you can book</CardDescription>
                </CardHeader>
                <CardContent>
                  {response.accommodations?.primary_recommendation && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{response.accommodations.primary_recommendation.name}</div>
                        <Badge variant="outline">Primary</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{response.accommodations.primary_recommendation.address}</p>
                      {response.accommodations.primary_recommendation.website && (
                        <a className="text-xs underline" href={response.accommodations.primary_recommendation.website} target="_blank" rel="noreferrer">Visit website</a>
                      )}
                    </div>
                  )}
                  <div className="space-y-3">
                    {response.accommodations?.alternative_options?.map((opt: any, i: number) => (
                      <div key={i} className="p-3 rounded-md border">
                        <div className="font-medium">{opt.name}</div>
                        <p className="text-sm text-muted-foreground">{opt.address}</p>
                        {opt.website && (
                          <a className="text-xs underline" href={opt.website} target="_blank" rel="noreferrer">Visit website</a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Transportation */}
            <Card className="glass-card mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Transportation</CardTitle>
                <CardDescription>Transfers, local modes, and daily costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="font-medium mb-2">Airport transfers</div>
                    <div className="space-y-1 text-muted-foreground">
                      {response.transportation?.airport_transfers?.arrival && (
                        <div>Arrival: {response.transportation.airport_transfers.arrival.mode} · {response.transportation.airport_transfers.arrival.estimated_cost} {response.currency}</div>
                      )}
                      {response.transportation?.airport_transfers?.departure && (
                        <div>Departure: {response.transportation.airport_transfers.departure.mode} · {response.transportation.airport_transfers.departure.estimated_cost} {response.currency}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Local transport</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(response.transportation?.local_transport_guide?.modes || []).map((m: string, i: number) => (
                        <Badge key={i} variant="secondary" className="capitalize">{m.replaceAll('_',' ')}</Badge>
                      ))}
                    </div>
                    <p className="text-muted-foreground">{response.transportation?.local_transport_guide?.notes}</p>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Daily transport costs</div>
                    <div className="space-y-1 text-muted-foreground">
                      {response.transportation?.daily_transport_costs && Object.entries(response.transportation.daily_transport_costs).map(([k,v]: any, i: number) => (
                        <div key={i}>{k}: {v} {response.currency}</div>
                      ))}
                    </div>
                    {response.transportation?.recommended_apps?.length ? (
                      <div className="mt-3">
                        <div className="font-medium">Recommended apps</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {response.transportation.recommended_apps.map((app: string, i: number) => (
                            <Badge key={i} variant="outline">{app}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
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
