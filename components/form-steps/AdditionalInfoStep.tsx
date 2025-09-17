'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, X, MapPin, Utensils, XCircle, Globe, CheckCircle } from 'lucide-react';
import { TripPlanRequest } from '@/lib/schemas/trip-plan';
import { useState } from 'react';

interface AdditionalInfoStepProps {
  form: UseFormReturn<TripPlanRequest>;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

export const AdditionalInfoStep = ({ form }: AdditionalInfoStepProps) => {
  const { control, watch, setValue } = form;
  const [mustVisitPlace, setMustVisitPlace] = useState('');
  const [mustTryCuisine, setMustTryCuisine] = useState('');
  const [avoidPlace, setAvoidPlace] = useState('');

  const mustVisitPlaces = watch('must_visit_places') || [];
  const mustTryCuisines = watch('must_try_cuisines') || [];
  const avoidPlaces = watch('avoid_places') || [];
  const languagePreferences = watch('language_preferences') || ['en'];

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

  const handleLanguageChange = (value: string) => {
    if (!languagePreferences.includes(value)) {
      setValue('language_preferences', [...languagePreferences, value]);
    }
  };

  const removeLanguage = (value: string) => {
    if (languagePreferences.length > 1) { // Keep at least one language
      setValue('language_preferences', languagePreferences.filter(lang => lang !== value));
    }
  };

  return (
    <div className="space-y-8">
      {/* Must Visit Places */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Must-Visit Places</Label>
        <p className="text-sm text-muted-foreground">
          Are there specific places, attractions, or landmarks you absolutely want to visit?
        </p>
        
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., Eiffel Tower, Times Square, Machu Picchu"
            value={mustVisitPlace}
            onChange={(e) => setMustVisitPlace(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('must_visit_places', mustVisitPlace, setMustVisitPlace)}
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
        <Label className="text-base font-medium">Must-Try Cuisines</Label>
        <p className="text-sm text-muted-foreground">
          Are there specific foods, dishes, or cuisines you want to try?
        </p>
        
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., Sushi, Pizza, Tacos, Curry"
            value={mustTryCuisine}
            onChange={(e) => setMustTryCuisine(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('must_try_cuisines', mustTryCuisine, setMustTryCuisine)}
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

      {/* Places to Avoid */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Places to Avoid</Label>
        <p className="text-sm text-muted-foreground">
          Are there any places, areas, or types of attractions you'd prefer to avoid?
        </p>
        
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., Crowded tourist spots, Nightclubs, High altitudes"
            value={avoidPlace}
            onChange={(e) => setAvoidPlace(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('avoid_places', avoidPlace, setAvoidPlace)}
          />
          <Button
            type="button"
            onClick={() => addItem('avoid_places', avoidPlace, setAvoidPlace)}
            disabled={!avoidPlace.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {avoidPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {avoidPlaces.map((place) => (
              <span
                key={place}
                className="inline-flex items-center gap-1 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full"
              >
                <XCircle className="w-3 h-3" />
                {place}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => removeItem('avoid_places', place)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Language Preferences */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Language Preferences</Label>
        <p className="text-sm text-muted-foreground">
          What languages would you prefer for your trip planning and communication?
        </p>
        
        <div className="space-y-3">
          <Select onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Add a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.filter(lang => !languagePreferences.includes(lang.value)).map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {languagePreferences.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {languagePreferences.map((lang) => {
                const language = LANGUAGE_OPTIONS.find(l => l.value === lang);
                return (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    <Globe className="w-3 h-3" />
                    {language?.label || lang}
                    {languagePreferences.length > 1 && (
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => removeLanguage(lang)}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Previous Visits */}
      <div className="space-y-4">
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
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <Label htmlFor="previous_visits" className="text-base font-medium">
                    Have you visited this destination before?
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                This helps us understand your familiarity with the destination and suggest new experiences.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="font-medium mb-2">Additional Information Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-600">{mustVisitPlaces.length}</span>
                <span className="text-muted-foreground"> must-visit places</span>
              </div>
              <div>
                <span className="font-medium text-orange-600">{mustTryCuisines.length}</span>
                <span className="text-muted-foreground"> must-try cuisines</span>
              </div>
              <div>
                <span className="font-medium text-red-600">{avoidPlaces.length}</span>
                <span className="text-muted-foreground"> places to avoid</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
