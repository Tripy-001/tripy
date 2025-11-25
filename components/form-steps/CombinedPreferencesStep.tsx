'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Hotel, Home, Building, Gem, Sparkles, Activity, Wallet, Crown, Landmark } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { cn } from '@/lib/utils';

interface CombinedPreferencesStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const ACCOMMODATION_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: Hotel, description: 'Standard comfort & services' },
  { value: 'hostel', label: 'Hostel', icon: Home, description: 'Budget-friendly & social' },
  { value: 'airbnb', label: 'Airbnb', icon: Building, description: 'Home-like experience' },
  { value: 'resort', label: 'Resort', icon: Gem, description: 'All-inclusive luxury' },
  { value: 'boutique', label: 'Boutique', icon: Sparkles, description: 'Unique & stylish' },
];

const ACTIVITY_LEVELS = [
  { 
    value: 'relaxed', 
    label: 'Relaxed', 
    description: 'Leisurely pace with plenty of downtime',
    icon: '🌴'
  },
  { 
    value: 'moderate', 
    label: 'Moderate', 
    description: 'Balanced mix of activities and rest',
    icon: '🚶'
  },
  { 
    value: 'highly_active', 
    label: 'Highly Active', 
    description: 'Packed schedule with lots of activities',
    icon: '🏃'
  },
];

const TRAVEL_STYLES = [
  { 
    value: 'adventure', 
    label: 'Adventure', 
    icon: Activity, 
    description: 'Thrilling experiences & outdoor activities',
    color: 'text-orange-500'
  },
  { 
    value: 'budget', 
    label: 'Budget', 
    icon: Wallet, 
    description: 'Maximum value for money',
    color: 'text-green-500'
  },
  { 
    value: 'luxury', 
    label: 'Luxury', 
    icon: Crown, 
    description: 'Premium experiences & comfort',
    color: 'text-purple-500'
  },
  { 
    value: 'cultural', 
    label: 'Cultural', 
    icon: Landmark, 
    description: 'Heritage, history & local traditions',
    color: 'text-blue-500'
  },
];

export const CombinedPreferencesStep = ({ form }: CombinedPreferencesStepProps) => {
  const { control } = form;

  return (
    <div className="space-y-10">
      {/* Accommodation Type */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Accommodation Type</Label>
          <p className="text-sm text-muted-foreground">Where would you like to stay?</p>
        </div>

        <FormField
          control={control}
          name="accommodation_type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                >
                  {ACCOMMODATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = field.value === type.value;
                    return (
                      <Label
                        key={type.value}
                        htmlFor={type.value}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                          isSelected ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                        <Icon className={cn("w-8 h-8 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "")}>{type.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">{type.description}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Activity Level */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Activity Level</Label>
          <p className="text-sm text-muted-foreground">How active do you want your trip to be?</p>
        </div>

        <FormField
          control={control}
          name="activity_level"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {ACTIVITY_LEVELS.map((level) => {
                    const isSelected = field.value === level.value;
                    return (
                      <Label
                        key={level.value}
                        htmlFor={`activity-${level.value}`}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                          isSelected ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <RadioGroupItem value={level.value} id={`activity-${level.value}`} className="sr-only" />
                        <span className="text-4xl mb-3">{level.icon}</span>
                        <span className={cn("font-semibold text-base", isSelected ? "text-primary" : "")}>{level.label}</span>
                        <span className="text-sm text-muted-foreground text-center mt-2">{level.description}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Travel Style */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Travel Style</Label>
          <p className="text-sm text-muted-foreground">What kind of experience are you looking for?</p>
        </div>

        <FormField
          control={control}
          name="primary_travel_style"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {TRAVEL_STYLES.map((style) => {
                    const Icon = style.icon;
                    const isSelected = field.value === style.value;
                    return (
                      <Label
                        key={style.value}
                        htmlFor={`style-${style.value}`}
                        className={cn(
                          "flex flex-col items-center justify-center p-5 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                          isSelected ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                        <Icon className={cn("w-10 h-10 mb-3", isSelected ? "text-primary" : style.color)} />
                        <span className={cn("font-semibold", isSelected ? "text-primary" : "")}>{style.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-2">{style.description}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
