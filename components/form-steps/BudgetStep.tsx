'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { DollarSign, TrendingUp } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';

interface BudgetStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
];

const BUDGET_TIERS = [
  { label: 'Budget', range: [100, 1000], icon: '💰', description: 'Hostels, street food, public transport' },
  { label: 'Mid-range', range: [1000, 3000], icon: '🏨', description: 'Hotels, restaurants, some activities' },
  { label: 'Luxury', range: [3000, 10000], icon: '✨', description: 'Resorts, fine dining, premium experiences' },
];

export const BudgetStep = ({ form }: BudgetStepProps) => {
  const { control, watch, setValue } = form;
  const totalBudget = watch('total_budget');
  const budgetCurrency = watch('budget_currency');

  const selectedCurrency = CURRENCIES.find(c => c.value === budgetCurrency);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={control}
          name="total_budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Budget</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Slider
                        value={[field.value || 1000]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={10000}
                        min={100}
                        step={50}
                        className="w-full"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={field.value || 1000}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={100}
                        max={10000}
                        step={50}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{selectedCurrency?.symbol}100</span>
                    <span>{selectedCurrency?.symbol}10,000+</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="budget_currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUDGET_TIERS.map((tier) => (
          <Card
            key={tier.label}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              totalBudget >= tier.range[0] && totalBudget <= tier.range[1] 
                ? 'ring-2 ring-primary bg-primary/5' 
                : ''
            }`}
            onClick={() => setValue('total_budget', tier.range[0])}
          >
            <CardContent className="p-4 text-center space-y-2">
              <div className="text-2xl">{tier.icon}</div>
              <h3 className="font-semibold">{tier.label}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedCurrency?.symbol}{tier.range[0].toLocaleString()} - {selectedCurrency?.symbol}{tier.range[1].toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{tier.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalBudget && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-medium">Your Budget</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedCurrency?.symbol}{totalBudget.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedCurrency?.value}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
