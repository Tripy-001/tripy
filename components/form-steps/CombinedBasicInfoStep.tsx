'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Users, Minus, Plus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import {PlaceAutocomplete} from '@/components/PlaceAutocomplete';

interface CombinedBasicInfoStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

export const CombinedBasicInfoStep = ({ form }: CombinedBasicInfoStepProps) => {
  const { control, watch, setValue } = form;
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const totalBudget = watch('total_budget');
  const groupSize = watch('group_size') || 1;
  const travelerAges = watch('traveler_ages') || [30];

  const formatBudget = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const updateGroupSize = (newSize: number) => {
    const validSize = Math.max(1, Math.min(20, newSize));
    setValue('group_size', validSize);
    
    const currentAges = travelerAges || [];
    if (validSize > currentAges.length) {
      const newAges = [...currentAges];
      for (let i = currentAges.length; i < validSize; i++) {
        newAges.push(30);
      }
      setValue('traveler_ages', newAges);
    } else if (validSize < currentAges.length) {
      setValue('traveler_ages', currentAges.slice(0, validSize));
    }
  };

  const updateTravelerAge = (index: number, age: number) => {
    const newAges = [...(travelerAges || [])];
    newAges[index] = Math.max(1, Math.min(120, age));
    setValue('traveler_ages', newAges);
  };

  return (
    <div className="space-y-8">
      {/* Origin and Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Where are you starting from?
              </FormLabel>
              <FormControl>
                <PlaceAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter your departure city"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Where do you want to go?
              </FormLabel>
              <FormControl>
                <PlaceAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter your dream destination"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Start Date
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'));
                        if (!endDate || new Date(endDate) <= date) {
                          setValue('end_date', format(addDays(date, 3), 'yyyy-MM-dd'));
                        }
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                End Date
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    disabled={(date) => {
                      const minDate = startDate ? new Date(startDate) : new Date();
                      return date <= minDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Budget Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Total Budget
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatBudget(totalBudget || 50000)}
                </span>
                <span className="text-sm text-muted-foreground">INR</span>
              </div>
            </div>

            <FormField
              control={control}
              name="total_budget"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Slider
                      min={5000}
                      max={1000000}
                      step={5000}
                      value={[field.value || 50000]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>₹5,000</span>
                    <span>₹10,00,000</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <Label className="text-sm text-muted-foreground">Or enter exact amount:</Label>
              <FormField
                control={control}
                name="total_budget"
                render={({ field }) => (
                  <FormItem className="flex-1 max-w-[200px]">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(Math.max(5000, Math.min(1000000, value)));
                        }}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Details Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Number of Travelers
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateGroupSize(groupSize - 1)}
                  disabled={groupSize <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{groupSize}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateGroupSize(groupSize + 1)}
                  disabled={groupSize >= 20}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {groupSize > 1 && (
              <div className="space-y-4">
                <Label className="text-sm text-muted-foreground">Age of each traveler</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: groupSize }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Person {index + 1}</span>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={travelerAges[index] || 30}
                        onChange={(e) => updateTravelerAge(index, parseInt(e.target.value) || 30)}
                        className="w-16 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupSize === 1 && (
              <div className="flex items-center gap-4">
                <Label className="text-sm text-muted-foreground">Your age:</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={travelerAges[0] || 30}
                  onChange={(e) => updateTravelerAge(0, parseInt(e.target.value) || 30)}
                  className="w-20 text-center"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {startDate && endDate && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Trip Duration</p>
              <p className="text-lg font-semibold">
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
