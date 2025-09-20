'use client';

import React, { useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { DollarSign } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface BudgetStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

// Fixed currency - INR only
const CURRENCY = {
  value: 'INR',
  label: 'INR - Indian Rupee',
  symbol: '₹'
};

const BUDGET_TIERS = [
  { label: 'Budget', range: [5000, 50000], icon: '💰', description: 'Hostels, street food, public transport' },
  { label: 'Mid-range', range: [50000, 150000], icon: '🏨', description: 'Hotels, restaurants, some activities' },
  { label: 'Luxury', range: [150000, 500000], icon: '✨', description: 'Resorts, fine dining, premium experiences' },
  { label: 'Ultra Luxury', range: [500000, 1000000], icon: '👑', description: 'Premium resorts, exclusive experiences' },
];

const BudgetStep = React.memo(({ form }: BudgetStepProps) => {
  const { control, watch, setValue } = form;
  const totalBudget = watch('total_budget'); // Don't default here

  // Set currency to INR on mount if not already set
  React.useEffect(() => {
    setValue('budget_currency', CURRENCY.value);
  }, [setValue]);

  // Memoize the selected tier to prevent unnecessary re-renders
  const selectedTier = useMemo(() => {
    const tier = BUDGET_TIERS.find(tier => 
      totalBudget !== undefined && totalBudget >= tier.range[0] && totalBudget <= tier.range[1]
    );
    
    // If no tier matches, return a custom tier for amounts outside ranges
    if (!tier && totalBudget !== undefined && totalBudget > 0) {
      return { label: 'Custom', range: [totalBudget, totalBudget], icon: '🎯', description: 'Custom budget amount' };
    }
    
    return tier;
  }, [totalBudget]);

  // Memoize tier click handlers to prevent re-renders
  const handleTierClick = useCallback((tier: typeof BUDGET_TIERS[0]) => {
    // Set to the middle of the range for better user experience
    const midRange = Math.floor((tier.range[0] + tier.range[1]) / 2);
    setValue('total_budget', midRange, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [setValue]);

  // Memoize input change handler - allow any numeric input including empty
  const handleInputChange = useCallback((value: string, onChange: (value: number | undefined) => void) => {
    // Allow empty string for clearing - set to undefined
    if (value === '') {
      onChange(undefined);
      return;
    }
    
    // Remove any non-numeric characters except digits
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (cleanValue === '') {
      onChange(undefined);
      return;
    }
    
    const numValue = parseInt(cleanValue, 10);
    
    // Allow any positive number
    if (numValue >= 0) {
      onChange(numValue);
    }
  }, []);


  // Memoize slider change handler
  const handleSliderChange = useCallback((value: number[], onChange: (value: number) => void) => {
    onChange(value[0]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={control}
          name="total_budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Budget ({CURRENCY.symbol})</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Slider
                        value={[field.value || 0]}
                        onValueChange={(value) => handleSliderChange(value, field.onChange)}
                        max={1000000}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="text"
                        value={field.value ? field.value.toString() : ''}
                        onChange={(e) => handleInputChange(e.target.value, field.onChange)}
                        placeholder="Enter amount"
                        className="text-right"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{CURRENCY.symbol}0</span>
                    <span className="font-medium text-primary">
                      Current: {totalBudget !== undefined ? `${CURRENCY.symbol}${totalBudget.toLocaleString('en-IN')}` : 'Not set'}
                    </span>
                    <span>{CURRENCY.symbol}10,00,000+</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Choose Budget Tier</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUDGET_TIERS.map((tier) => {
            const isInRange = totalBudget !== undefined && totalBudget >= tier.range[0] && totalBudget <= tier.range[1];
            
            return (
              <Card
                key={tier.label}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isInRange
                    ? 'ring-2 ring-primary border-2 border-primary bg-primary/10 shadow-lg scale-[1.01]'
                    : 'hover:border-primary/50 hover:shadow-sm hover:scale-105'
                }`}
                onClick={() => handleTierClick(tier)}
                aria-selected={isInRange}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className={`text-2xl ${isInRange ? 'scale-110' : ''} transition-transform duration-200`}>
                    {tier.icon}
                  </div>
                  <h3 className={`font-semibold ${isInRange ? 'text-primary' : ''}`}>
                    {tier.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {CURRENCY.symbol}{tier.range[0].toLocaleString('en-IN')} - {CURRENCY.symbol}{tier.range[1].toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                  {isInRange && (
                    <div className="text-xs font-medium text-primary">
                      ✓ Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {/* Custom tier card for amounts outside predefined ranges */}
          {selectedTier?.label === 'Custom' && (
            <Card className="ring-2 ring-primary bg-primary/5 border-primary shadow-md cursor-pointer transition-all duration-200">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-2xl scale-110 transition-transform duration-200">
                  {selectedTier.icon}
                </div>
                <h3 className="font-semibold text-primary">
                  {selectedTier.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {CURRENCY.symbol}{(totalBudget || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">{selectedTier.description}</p>
                <div className="text-xs font-medium text-primary">
                  ✓ Selected
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {totalBudget !== undefined && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-medium">Your Budget</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {CURRENCY.symbol}{(totalBudget || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTier?.label || 'Custom'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

BudgetStep.displayName = 'BudgetStep';

export { BudgetStep };
