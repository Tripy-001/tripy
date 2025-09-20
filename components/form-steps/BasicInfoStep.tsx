'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Search, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface BasicInfoStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

export const BasicInfoStep = ({ form }: BasicInfoStepProps) => {
  const { control, watch, setValue, setError, clearErrors } = form;
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // Helper function to format date without timezone issues
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get today's date in local timezone
  const today = new Date();
  const todayString = formatDateForInput(today);

  // Validate date relationships
  const validateDates = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        setError('end_date', {
          type: 'manual',
          message: 'End date must be after start date'
        });
      } else {
        clearErrors('end_date');
      }
    }
  };

  // Validate dates whenever they change
  React.useEffect(() => {
    validateDates();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origin City</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Where are you traveling from?"
                    className="pl-10"
                    {...field}
                  />
                </div>
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
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Where do you want to go?"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !field.value && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value + 'T00:00:00'), 'PPP') : 'Pick start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(formatDateForInput(date));
                        } else {
                          field.onChange('');
                        }
                      }}
                      disabled={(date) => {
                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        return date < todayDate;
                      }}
                      initialFocus
                    />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !field.value && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value + 'T00:00:00'), 'PPP') : 'Pick end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(formatDateForInput(date));
                        } else {
                          field.onChange('');
                        }
                      }}
                      disabled={(date) => {
                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        
                        if (startDate) {
                          const minDate = new Date(startDate + 'T00:00:00');
                          return date <= minDate;
                        }
                        
                        return date < todayDate;
                      }}
                      initialFocus
                    />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Quick date selection buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Select</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'This Weekend', days: 2 },
              { label: 'Next Week', days: 7 },
              { label: '2 Weeks', days: 14 },
              { label: '1 Month', days: 30 },
            ].map((option) => (
              <Button
                key={option.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  const start = new Date();
                  const end = new Date();
                  end.setDate(start.getDate() + option.days);
                  
                  setValue('start_date', formatDateForInput(start));
                  setValue('end_date', formatDateForInput(end));
                }}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {startDate && endDate && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Trip Duration: <span className="font-semibold text-foreground">
                  {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
