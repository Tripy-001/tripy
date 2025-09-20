'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Car, Bus, Footprints } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { MultiSelectCards } from '@/components/ui/multi-select-cards';

interface AccommodationTransportStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const ACCOMMODATION_TYPES = [
  {
    value: 'hotel',
    label: 'Hotel',
    description: 'Traditional hotels with full service',
    icon: '🏨',
    features: ['Room service', 'Concierge', 'Restaurant', 'Gym']
  },
  {
    value: 'hostel',
    label: 'Hostel',
    description: 'Budget-friendly shared accommodations',
    icon: '🏠',
    features: ['Shared rooms', 'Common areas', 'Kitchen access', 'Social atmosphere']
  },
  {
    value: 'airbnb',
    label: 'Airbnb',
    description: 'Private homes and apartments',
    icon: '🏡',
    features: ['Full privacy', 'Kitchen access', 'Local experience', 'Flexible check-in']
  },
  {
    value: 'resort',
    label: 'Resort',
    description: 'All-inclusive luxury accommodations',
    icon: '🏖️',
    features: ['All-inclusive', 'Activities', 'Spa services', 'Beach access']
  },
  {
    value: 'boutique',
    label: 'Boutique Hotel',
    description: 'Unique, stylish accommodations',
    icon: '✨',
    features: ['Unique design', 'Personal service', 'Local character', 'Intimate setting']
  },
];

const TRANSPORT_OPTIONS = [
  {
    value: 'walking',
    label: 'Walking',
    description: 'Explore on foot',
    icon: <Footprints className="w-4 h-4" />
  },
  {
    value: 'public_transport',
    label: 'Public Transport',
    description: 'Buses, trains, metro',
    icon: <Bus className="w-4 h-4" />
  },
  {
    value: 'taxi',
    label: 'Taxi/Rideshare',
    description: 'Uber, Lyft, local taxis',
    icon: <Car className="w-4 h-4" />
  },
  {
    value: 'rental_car',
    label: 'Rental Car',
    description: 'Self-drive exploration',
    icon: <Car className="w-4 h-4" />
  },
  {
    value: 'bike',
    label: 'Bicycle',
    description: 'Bike rentals and cycling',
    icon: '🚴‍♂️'
  },
  {
    value: 'scooter',
    label: 'Scooter',
    description: 'Motor scooter rentals',
    icon: '🛵'
  },
];

const AccommodationTransportStep = React.memo(({ form }: AccommodationTransportStepProps) => {
  const { control } = form;

  return (
    <div className="space-y-8">
      {/* Accommodation Type */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Accommodation Type</Label>
        <p className="text-sm text-muted-foreground">
          What type of accommodation do you prefer?
        </p>
        
        <FormField
          control={control}
          name="accommodation_type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {ACCOMMODATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label
                        htmlFor={type.value}
                        className="flex-1 cursor-pointer"
                      >
                        <Card className={`transition-all duration-200 hover:shadow-lg ${
                          field.value === type.value ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="text-2xl mb-2">{type.icon}</div>
                              <h3 className="font-semibold">{type.label}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {type.features.map((feature) => (
                                  <span
                                    key={feature}
                                    className="text-xs bg-muted px-2 py-1 rounded"
                                  >
                                    {feature}
                                  </span>
                                ))}
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

      {/* Transport Preferences */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Transport Preferences</Label>
        <p className="text-sm text-muted-foreground">
          How do you prefer to get around during your trip? (Select all that apply)
        </p>
        
        <FormField
          control={control}
          name="transport_preferences"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={TRANSPORT_OPTIONS}
                  selectedValues={field.value || []}
                  onChange={field.onChange}
                  gridCols="grid-cols-2 md:grid-cols-3"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

AccommodationTransportStep.displayName = 'AccommodationTransportStep';

export { AccommodationTransportStep };
