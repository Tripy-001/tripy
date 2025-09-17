'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Heart, Star, Mountain, Camera, ShoppingBag, Utensils } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface PreferencesStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const ACTIVITY_LEVELS = [
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: 'Leisurely pace with plenty of downtime',
    icon: '😌',
    activities: ['Spa visits', 'Beach time', 'Café hopping', 'Museum tours']
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced mix of activities and relaxation',
    icon: '🚶‍♂️',
    activities: ['City walking tours', 'Local markets', 'Restaurant visits', 'Light hiking']
  },
  {
    value: 'highly_active',
    label: 'Highly Active',
    description: 'Full schedule with maximum experiences',
    icon: '🏃‍♂️',
    activities: ['Multiple attractions', 'Adventure sports', 'Nightlife', 'Long excursions']
  },
];

const TRAVEL_STYLES = [
  {
    value: 'adventure',
    label: 'Adventure',
    description: 'Outdoor activities, hiking, extreme sports',
    icon: '🏔️'
  },
  {
    value: 'budget',
    label: 'Budget',
    description: 'Cost-effective options, hostels, street food',
    icon: '💰'
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Premium experiences, fine dining, luxury hotels',
    icon: '✨'
  },
  {
    value: 'cultural',
    label: 'Cultural',
    description: 'Museums, historical sites, local traditions',
    icon: '🏛️'
  },
];

const PREFERENCE_CATEGORIES = [
  {
    key: 'food_dining',
    label: 'Food & Dining',
    icon: Utensils,
    description: 'Restaurants, local cuisine, food tours'
  },
  {
    key: 'history_culture',
    label: 'History & Culture',
    icon: Heart,
    description: 'Museums, historical sites, cultural experiences'
  },
  {
    key: 'nature_wildlife',
    label: 'Nature & Wildlife',
    icon: Mountain,
    description: 'National parks, wildlife, outdoor activities'
  },
  {
    key: 'nightlife_entertainment',
    label: 'Nightlife & Entertainment',
    icon: Star,
    description: 'Bars, clubs, shows, entertainment venues'
  },
  {
    key: 'shopping',
    label: 'Shopping',
    icon: ShoppingBag,
    description: 'Markets, malls, local crafts, souvenirs'
  },
  {
    key: 'art_museums',
    label: 'Art & Museums',
    icon: Camera,
    description: 'Art galleries, exhibitions, cultural centers'
  },
  {
    key: 'beaches_water',
    label: 'Beaches & Water',
    icon: '🏖️',
    description: 'Beaches, water sports, coastal activities'
  },
  {
    key: 'mountains_hiking',
    label: 'Mountains & Hiking',
    icon: Mountain,
    description: 'Hiking trails, mountain views, outdoor adventures'
  },
  {
    key: 'architecture',
    label: 'Architecture',
    icon: '🏛️',
    description: 'Historic buildings, modern architecture, landmarks'
  },
  {
    key: 'local_markets',
    label: 'Local Markets',
    icon: ShoppingBag,
    description: 'Street markets, local vendors, authentic experiences'
  },
  {
    key: 'photography',
    label: 'Photography',
    icon: Camera,
    description: 'Scenic spots, photo opportunities, Instagram-worthy locations'
  },
  {
    key: 'wellness_relaxation',
    label: 'Wellness & Relaxation',
    icon: '🧘‍♀️',
    description: 'Spas, yoga, meditation, wellness retreats'
  },
];

export const PreferencesStep = ({ form }: PreferencesStepProps) => {
  const { control, watch } = form;

  return (
    <div className="space-y-8">
      {/* Activity Level */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Activity Level</Label>
        <p className="text-sm text-muted-foreground">
          How active do you want to be during your trip?
        </p>
        
        <FormField
          control={control}
          name="activity_level"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 gap-4"
                >
                  {ACTIVITY_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={level.value} id={level.value} />
                      <Label
                        htmlFor={level.value}
                        className="flex-1 cursor-pointer"
                      >
                        <Card className={`transition-all duration-200 hover:shadow-lg ${
                          field.value === level.value ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="text-2xl">{level.icon}</div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{level.label}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {level.activities.map((activity) => (
                                    <span
                                      key={activity}
                                      className="text-xs bg-muted px-2 py-1 rounded"
                                    >
                                      {activity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Travel Style */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Primary Travel Style</Label>
        <p className="text-sm text-muted-foreground">
          What type of experiences are you most interested in?
        </p>
        
        <FormField
          control={control}
          name="primary_travel_style"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {TRAVEL_STYLES.map((style) => (
                    <div key={style.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={style.value} id={style.value} />
                      <Label
                        htmlFor={style.value}
                        className="flex-1 cursor-pointer"
                      >
                        <Card className={`transition-all duration-200 hover:shadow-lg ${
                          field.value === style.value ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{style.icon}</div>
                            <h3 className="font-semibold text-sm">{style.label}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Interest Preferences */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Interest Preferences</Label>
        <p className="text-sm text-muted-foreground">
          Rate your interest level for each category (1 = Not interested, 5 = Very interested)
        </p>
        
        <div className="space-y-6">
          {PREFERENCE_CATEGORIES.map((category) => (
            <FormField
              key={category.key}
              control={control}
              name={`preferences.${category.key}` as any}
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {typeof category.icon === 'string' ? (
                        <span className="text-lg">{category.icon}</span>
                      ) : (
                        <category.icon className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <Label className="font-medium">{category.label}</Label>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground w-8">1</span>
                      <Slider
                        value={[field.value || 3]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">5</span>
                      <div className="w-8 text-center">
                        <span className="text-sm font-medium">{field.value || 3}</span>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
