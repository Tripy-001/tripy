'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Heart, 
  Star,
  CheckCircle,
  Globe
} from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface SummaryStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

export const SummaryStep = ({ form }: SummaryStepProps) => {
  const { watch } = form;
  const data = watch();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDuration = () => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const getActivityLevelLabel = (level: string) => {
    const labels = {
      relaxed: 'Relaxed',
      moderate: 'Moderate',
      highly_active: 'Highly Active'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getTravelStyleLabel = (style: string) => {
    const labels = {
      adventure: 'Adventure',
      budget: 'Budget',
      luxury: 'Luxury',
      cultural: 'Cultural'
    };
    return labels[style as keyof typeof labels] || style;
  };

  const getAccommodationLabel = (type: string) => {
    const labels = {
      hotel: 'Hotel',
      hostel: 'Hostel',
      airbnb: 'Airbnb',
      resort: 'Resort',
      boutique: 'Boutique Hotel'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
    };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Trip Summary</h2>
        <p className="text-muted-foreground">
          Review your trip details before we create your personalized itinerary
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">{data.origin}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-medium">{data.destination}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{data.start_date ? formatDate(data.start_date) : 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{data.end_date ? formatDate(data.end_date) : 'Not set'}</p>
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold text-primary">{getDuration()} days</p>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Budget & Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-3xl font-bold text-primary">
                {getCurrencySymbol(data.budget_currency || 'USD')}{data.total_budget?.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{data.budget_currency}</p>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Group Size</p>
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold">{data.group_size} {data.group_size === 1 ? 'traveler' : 'travelers'}</p>
              </div>
              {data.traveler_ages && data.traveler_ages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Ages {Math.min(...data.traveler_ages)}-{Math.max(...data.traveler_ages)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Travel Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Activity Level</p>
                <Badge variant="secondary">{getActivityLevelLabel(data.activity_level || 'moderate')}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Travel Style</p>
                <Badge variant="secondary">{getTravelStyleLabel(data.primary_travel_style || 'cultural')}</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Accommodation</p>
              <Badge variant="outline">{getAccommodationLabel(data.accommodation_type || 'hotel')}</Badge>
            </div>
            {data.transport_preferences && data.transport_preferences.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Transport</p>
                  <div className="flex flex-wrap gap-1">
                    {data.transport_preferences.map((transport) => (
                      <Badge key={transport} variant="outline" className="text-xs">
                        {transport.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Special Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Special Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.dietary_restrictions && data.dietary_restrictions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dietary Restrictions</p>
                <div className="flex flex-wrap gap-1">
                  {data.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} variant="secondary" className="text-xs">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.accessibility_needs && data.accessibility_needs.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Accessibility Needs</p>
                <div className="flex flex-wrap gap-1">
                  {data.accessibility_needs.map((need) => (
                    <Badge key={need} variant="secondary" className="text-xs">
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.special_occasions && data.special_occasions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Special Occasions</p>
                <div className="flex flex-wrap gap-1">
                  {data.special_occasions.map((occasion) => (
                    <Badge key={occasion} variant="outline" className="text-xs">
                      {occasion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(!data.dietary_restrictions?.length && !data.accessibility_needs?.length && !data.special_occasions?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No special requirements specified
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(data.must_visit_places?.length > 0 || data.must_try_cuisines?.length > 0 || data.avoid_places?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.must_visit_places && data.must_visit_places.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Must-Visit Places</p>
                <div className="flex flex-wrap gap-1">
                  {data.must_visit_places.map((place) => (
                    <Badge key={place} variant="default" className="text-xs">
                      {place}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.must_try_cuisines && data.must_try_cuisines.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Must-Try Cuisines</p>
                <div className="flex flex-wrap gap-1">
                  {data.must_try_cuisines.map((cuisine) => (
                    <Badge key={cuisine} variant="default" className="text-xs">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.avoid_places && data.avoid_places.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Places to Avoid</p>
                <div className="flex flex-wrap gap-1">
                  {data.avoid_places.map((place) => (
                    <Badge key={place} variant="destructive" className="text-xs">
                      {place}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Message */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Ready to Create Your Trip!
          </h3>
          <p className="text-green-700">
            Our AI will use all this information to create a personalized itinerary 
            that perfectly matches your preferences and requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
