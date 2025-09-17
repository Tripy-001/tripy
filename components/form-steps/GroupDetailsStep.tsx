'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Users, Plus, Minus, User } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface GroupDetailsStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

export const GroupDetailsStep = ({ form }: GroupDetailsStepProps) => {
  const { control, watch, setValue } = form;
  const groupSize = watch('group_size') || 1;
  const travelerAges = watch('traveler_ages') || [25];

  const updateGroupSize = (newSize: number) => {
    if (newSize >= 1 && newSize <= 20) {
      setValue('group_size', newSize);
      
      // Adjust traveler ages array to match new group size
      const newAges = [...travelerAges];
      if (newSize > travelerAges.length) {
        // Add default ages for new travelers
        for (let i = travelerAges.length; i < newSize; i++) {
          newAges.push(25);
        }
      } else if (newSize < travelerAges.length) {
        // Remove excess ages
        newAges.splice(newSize);
      }
      setValue('traveler_ages', newAges);
    }
  };

  const updateTravelerAge = (index: number, age: number) => {
    if (age >= 1 && age <= 120) {
      const newAges = [...travelerAges];
      newAges[index] = age;
      setValue('traveler_ages', newAges);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={control}
          name="group_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Travelers</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateGroupSize(groupSize - 1)}
                    disabled={groupSize <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold w-8 text-center">{groupSize}</span>
                    <span className="text-sm text-muted-foreground">
                      {groupSize === 1 ? 'traveler' : 'travelers'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateGroupSize(groupSize + 1)}
                    disabled={groupSize >= 20}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Traveler Ages</Label>
        <p className="text-sm text-muted-foreground">
          Please provide the age of each traveler (this helps us suggest age-appropriate activities)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {travelerAges.map((age, index) => (
            <Card key={index} className="p-4">
              <CardContent className="p-0">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Traveler {index + 1}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`age-${index}`} className="text-sm">
                      Age
                    </Label>
                    <Input
                      id={`age-${index}`}
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => updateTravelerAge(index, Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Group Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {groupSize} {groupSize === 1 ? 'traveler' : 'travelers'} 
              {travelerAges.length > 0 && (
                <span>
                  {' '}aged {Math.min(...travelerAges)}-{Math.max(...travelerAges)} years
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
