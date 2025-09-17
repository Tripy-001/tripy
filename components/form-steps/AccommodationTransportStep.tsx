'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Car, Bus, Footprints } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

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
    icon: Footprints
  },
  {
    value: 'public_transport',
    label: 'Public Transport',
    description: 'Buses, trains, metro',
    icon: Bus
  },
  {
    value: 'taxi',
    label: 'Taxi/Rideshare',
    description: 'Uber, Lyft, local taxis',
    icon: Car
  },
  {
    value: 'rental_car',
    label: 'Rental Car',
    description: 'Self-drive exploration',
    icon: Car
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

export const AccommodationTransportStep = ({ form }: AccommodationTransportStepProps) => {
  const { control, watch } = form;
  const transportPreferences = watch('transport_preferences') || [];

  const handleTransportChange = (value: string, checked: boolean) => {
    const current = transportPreferences || [];
    if (checked) {
      form.setValue('transport_preferences', [...current, value]);
    } else {
      form.setValue('transport_preferences', current.filter((item: string) => item !== value));
    }
  };

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
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TRANSPORT_OPTIONS.map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                transportPreferences.includes(option.value) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleTransportChange(option.value, !transportPreferences.includes(option.value))}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={transportPreferences.includes(option.value)}
                    onCheckedChange={(checked) => handleTransportChange(option.value, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {typeof option.icon === 'string' ? (
                        <span className="text-lg">{option.icon}</span>
                      ) : (
                        <option.icon className="w-5 h-5 text-primary" />
                      )}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {transportPreferences.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-medium">Selected Transport Options</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {transportPreferences.map((pref) => {
                  const option = TRANSPORT_OPTIONS.find(o => o.value === pref);
                  return (
                    <span
                      key={pref}
                      className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
                    >
                      {option?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
