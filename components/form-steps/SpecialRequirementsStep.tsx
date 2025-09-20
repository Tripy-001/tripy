'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Utensils, Accessibility, Gift } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { MultiSelectCards, useMultiSelectField } from '@/components/ui/multi-select-cards';
import { useCallback } from 'react';

interface SpecialRequirementsStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const DIETARY_OPTIONS = [
  { value: 'Vegetarian', label: 'Vegetarian', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Vegan', label: 'Vegan', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Gluten-free', label: 'Gluten-free', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Dairy-free', label: 'Dairy-free', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Nut allergy', label: 'Nut allergy', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Halal', label: 'Halal', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Kosher', label: 'Kosher', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Low-carb', label: 'Low-carb', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Keto', label: 'Keto', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Paleo', label: 'Paleo', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Raw food', label: 'Raw food', icon: <Utensils className="w-4 h-4" /> },
  { value: 'Pescatarian', label: 'Pescatarian', icon: <Utensils className="w-4 h-4" /> },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'Wheelchair accessible', label: 'Wheelchair accessible', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Mobility assistance needed', label: 'Mobility assistance needed', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Visual impairment support', label: 'Visual impairment support', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Hearing impairment support', label: 'Hearing impairment support', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Service animal friendly', label: 'Service animal friendly', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Elevator access required', label: 'Elevator access required', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Ground floor only', label: 'Ground floor only', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'Wide doorways needed', label: 'Wide doorways needed', icon: <Accessibility className="w-4 h-4" /> },
];

const SPECIAL_OCCASIONS = [
  { value: 'Birthday', label: 'Birthday', icon: <Gift className="w-4 h-4" /> },
  { value: 'Anniversary', label: 'Anniversary', icon: <Gift className="w-4 h-4" /> },
  { value: 'Honeymoon', label: 'Honeymoon', icon: <Gift className="w-4 h-4" /> },
  { value: 'Graduation', label: 'Graduation', icon: <Gift className="w-4 h-4" /> },
  { value: 'Retirement', label: 'Retirement', icon: <Gift className="w-4 h-4" /> },
  { value: 'Business trip', label: 'Business trip', icon: <Gift className="w-4 h-4" /> },
  { value: 'Family reunion', label: 'Family reunion', icon: <Gift className="w-4 h-4" /> },
  { value: 'Bachelor/Bachelorette party', label: 'Bachelor/Bachelorette party', icon: <Gift className="w-4 h-4" /> },
  { value: 'Holiday celebration', label: 'Holiday celebration', icon: <Gift className="w-4 h-4" /> },
  { value: 'Romantic getaway', label: 'Romantic getaway', icon: <Gift className="w-4 h-4" /> },
];

export const SpecialRequirementsStep = ({ form }: SpecialRequirementsStepProps) => {
  const { control, setValue } = form;

  return (
    <div className="space-y-8">
      {/* Dietary Restrictions */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Dietary Restrictions</Label>
        <p className="text-sm text-muted-foreground">
          Do you have any dietary restrictions or preferences?
        </p>
        
        <FormField
          control={control}
          name="dietary_restrictions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={DIETARY_OPTIONS}
                  selectedValues={field.value || []}
                  onChange={field.onChange}
                  gridCols="grid-cols-2 md:grid-cols-3"
                  allowCustom={true}
                  customPlaceholder="Add custom dietary restriction"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Accessibility Needs */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Accessibility Needs</Label>
        <p className="text-sm text-muted-foreground">
          Do you have any accessibility requirements?
        </p>
        
        <FormField
          control={control}
          name="accessibility_needs"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={ACCESSIBILITY_OPTIONS}
                  selectedValues={field.value || []}
                  onChange={field.onChange}
                  gridCols="grid-cols-1 md:grid-cols-2"
                  allowCustom={true}
                  customPlaceholder="Add custom accessibility need"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Special Occasions */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Special Occasions</Label>
        <p className="text-sm text-muted-foreground">
          Are you celebrating any special occasions during your trip?
        </p>
        
        <FormField
          control={control}
          name="special_occasions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiSelectCards
                  options={SPECIAL_OCCASIONS}
                  selectedValues={field.value || []}
                  onChange={field.onChange}
                  gridCols="grid-cols-2 md:grid-cols-3"
                  allowCustom={true}
                  customPlaceholder="Add custom special occasion"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
