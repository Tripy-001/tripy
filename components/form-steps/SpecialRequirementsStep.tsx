'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, X, Utensils, Accessibility, Gift } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { useState } from 'react';

interface SpecialRequirementsStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut allergy',
  'Halal',
  'Kosher',
  'Low-carb',
  'Keto',
  'Paleo',
  'Raw food',
  'Pescatarian',
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair accessible',
  'Mobility assistance needed',
  'Visual impairment support',
  'Hearing impairment support',
  'Service animal friendly',
  'Elevator access required',
  'Ground floor only',
  'Wide doorways needed',
];

const SPECIAL_OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Honeymoon',
  'Graduation',
  'Retirement',
  'Business trip',
  'Family reunion',
  'Bachelor/Bachelorette party',
  'Holiday celebration',
  'Romantic getaway',
];

export const SpecialRequirementsStep = ({ form }: SpecialRequirementsStepProps) => {
  const { control, watch, setValue } = form;
  const [customDietary, setCustomDietary] = useState('');
  const [customAccessibility, setCustomAccessibility] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');

  const dietaryRestrictions = watch('dietary_restrictions') || [];
  const accessibilityNeeds = watch('accessibility_needs') || [];
  const specialOccasions = watch('special_occasions') || [];

  const handleArrayUpdate = (field: keyof TripPlanRequest, value: string, checked: boolean) => {
    const current = watch(field) as string[] || [];
    if (checked) {
      setValue(field, [...current, value]);
    } else {
      setValue(field, current.filter((item: string) => item !== value));
    }
  };

  const addCustomItem = (field: keyof TripPlanRequest, value: string, setter: (value: string) => void) => {
    if (value.trim() && !(watch(field) as string[]).includes(value.trim())) {
      const current = watch(field) as string[] || [];
      setValue(field, [...current, value.trim()]);
      setter('');
    }
  };

  const removeItem = (field: keyof TripPlanRequest, value: string) => {
    const current = watch(field) as string[] || [];
    setValue(field, current.filter((item: string) => item !== value));
  };

  return (
    <div className="space-y-8">
      {/* Dietary Restrictions */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Dietary Restrictions</Label>
        <p className="text-sm text-muted-foreground">
          Do you have any dietary restrictions or preferences?
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DIETARY_OPTIONS.map((option) => (
            <Card
              key={option}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                dietaryRestrictions.includes(option) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleArrayUpdate('dietary_restrictions', option, !dietaryRestrictions.includes(option))}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={dietaryRestrictions.includes(option)}
                    onChange={(e) => handleArrayUpdate('dietary_restrictions', option, e.target.checked)}
                  />
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            placeholder="Add custom dietary restriction"
            value={customDietary}
            onChange={(e) => setCustomDietary(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem('dietary_restrictions', customDietary, setCustomDietary)}
          />
          <Button
            type="button"
            onClick={() => addCustomItem('dietary_restrictions', customDietary, setCustomDietary)}
            disabled={!customDietary.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {dietaryRestrictions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dietaryRestrictions.map((restriction) => (
              <span
                key={restriction}
                className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
              >
                {restriction}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem('dietary_restrictions', restriction)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Accessibility Needs */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Accessibility Needs</Label>
        <p className="text-sm text-muted-foreground">
          Do you have any accessibility requirements?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACCESSIBILITY_OPTIONS.map((option) => (
            <Card
              key={option}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                accessibilityNeeds.includes(option) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleArrayUpdate('accessibility_needs', option, !accessibilityNeeds.includes(option))}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={accessibilityNeeds.includes(option)}
                    onChange={(e) => handleArrayUpdate('accessibility_needs', option, e.target.checked)}
                  />
                  <div className="flex items-center space-x-2">
                    <Accessibility className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            placeholder="Add custom accessibility need"
            value={customAccessibility}
            onChange={(e) => setCustomAccessibility(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem('accessibility_needs', customAccessibility, setCustomAccessibility)}
          />
          <Button
            type="button"
            onClick={() => addCustomItem('accessibility_needs', customAccessibility, setCustomAccessibility)}
            disabled={!customAccessibility.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {accessibilityNeeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accessibilityNeeds.map((need) => (
              <span
                key={need}
                className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
              >
                {need}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem('accessibility_needs', need)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Special Occasions */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Special Occasions</Label>
        <p className="text-sm text-muted-foreground">
          Are you celebrating any special occasions during your trip?
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIAL_OCCASIONS.map((occasion) => (
            <Card
              key={occasion}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                specialOccasions.includes(occasion) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleArrayUpdate('special_occasions', occasion, !specialOccasions.includes(occasion))}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={specialOccasions.includes(occasion)}
                    onChange={(e) => handleArrayUpdate('special_occasions', occasion, e.target.checked)}
                  />
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{occasion}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            placeholder="Add custom special occasion"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem('special_occasions', customOccasion, setCustomOccasion)}
          />
          <Button
            type="button"
            onClick={() => addCustomItem('special_occasions', customOccasion, setCustomOccasion)}
            disabled={!customOccasion.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {specialOccasions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specialOccasions.map((occasion) => (
              <span
                key={occasion}
                className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
              >
                {occasion}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem('special_occasions', occasion)}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
