'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelectCards } from '@/components/ui/multi-select-cards';
import { 
  Car, 
  Train, 
  Bus, 
  Plane, 
  PersonStanding, 
  Bike,
  Heart,
  Cake,
  Gift,
  Users,
  Briefcase,
  PartyPopper,
  Plus,
  X,
  MapPin,
  Utensils,
  CheckCircle
} from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { useState } from 'react';

interface CombinedAdditionalStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const TRANSPORT_OPTIONS = [
  { value: 'rental_car', label: 'Rental Car', icon: Car },
  { value: 'public_transport', label: 'Public Transport', icon: Train },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'flights', label: 'Flights', icon: Plane },
  { value: 'walking', label: 'Walking', icon: PersonStanding },
  { value: 'bicycle', label: 'Bicycle', icon: Bike },
];

const SPECIAL_OCCASIONS = [
  { value: 'honeymoon', label: 'Honeymoon', icon: Heart },
  { value: 'anniversary', label: 'Anniversary', icon: Cake },
  { value: 'birthday', label: 'Birthday', icon: Gift },
  { value: 'family_reunion', label: 'Family Reunion', icon: Users },
  { value: 'business_trip', label: 'Business Trip', icon: Briefcase },
  { value: 'celebration', label: 'Celebration', icon: PartyPopper },
];

export const CombinedAdditionalStep = ({ form }: CombinedAdditionalStepProps) => {
  const { control, watch, setValue } = form;
  const [mustVisitPlace, setMustVisitPlace] = useState('');
  const [mustTryCuisine, setMustTryCuisine] = useState('');

  const mustVisitPlaces = watch('must_visit_places') || [];
  const mustTryCuisines = watch('must_try_cuisines') || [];

  const handleArrayUpdate = (field: keyof TripPlanRequest, value: string, add: boolean) => {
    const current = watch(field) as string[] || [];
    if (add) {
      if (!current.includes(value.trim())) {
        setValue(field, [...current, value.trim()]);
      }
    } else {
      setValue(field, current.filter((item: string) => item !== value));
    }
  };

  const addItem = (field: keyof TripPlanRequest, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      handleArrayUpdate(field, value, true);
      setter('');
    }
  };

  const removeItem = (field: keyof TripPlanRequest, value: string) => {
    handleArrayUpdate(field, value, false);
  };

  return (
    <div className="space-y-10">
      {/* Transport Preferences */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Transport Preferences</Label>
          <p className="text-sm text-muted-foreground">Select all modes of transport you&apos;re comfortable with</p>
        </div>

        <FormField
          control={control}
          name="transport_preferences"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={TRANSPORT_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    icon: <opt.icon className="w-6 h-6" />,
                  }))}
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

      {/* Special Occasions */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Special Occasions</Label>
          <p className="text-sm text-muted-foreground">Are you celebrating anything special? (Optional)</p>
        </div>

        <FormField
          control={control}
          name="special_occasions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={SPECIAL_OCCASIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    icon: <opt.icon className="w-6 h-6" />,
                  }))}
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

      {/* Must Visit Places */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Must-Visit Places</Label>
          <p className="text-sm text-muted-foreground">
            Any specific places or attractions you absolutely want to visit? (Optional)
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., Eiffel Tower, Times Square, Machu Picchu"
            value={mustVisitPlace}
            onChange={(e) => setMustVisitPlace(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('must_visit_places', mustVisitPlace, setMustVisitPlace))}
          />
          <Button
            type="button"
            onClick={() => addItem('must_visit_places', mustVisitPlace, setMustVisitPlace)}
            disabled={!mustVisitPlace.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {mustVisitPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mustVisitPlaces.map((place) => (
              <span
                key={place}
                className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full"
              >
                <MapPin className="w-3 h-3" />
                {place}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => removeItem('must_visit_places', place)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Must Try Cuisines */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Must-Try Cuisines</Label>
          <p className="text-sm text-muted-foreground">
            Any specific foods or dishes you want to try? (Optional)
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., Sushi, Pizza, Tacos, Curry"
            value={mustTryCuisine}
            onChange={(e) => setMustTryCuisine(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('must_try_cuisines', mustTryCuisine, setMustTryCuisine))}
          />
          <Button
            type="button"
            onClick={() => addItem('must_try_cuisines', mustTryCuisine, setMustTryCuisine)}
            disabled={!mustTryCuisine.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {mustTryCuisines.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mustTryCuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="inline-flex items-center gap-1 text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full"
              >
                <Utensils className="w-3 h-3" />
                {cuisine}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => removeItem('must_try_cuisines', cuisine)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Previous Visits */}
      <Card>
        <CardContent className="pt-6">
          <FormField
            control={control}
            name="previous_visits"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="previous_visits"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <Label htmlFor="previous_visits" className="text-base font-medium cursor-pointer">
                      Have you visited this destination before?
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-7 mt-1">
                  This helps us suggest new experiences you haven&apos;t tried yet
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
