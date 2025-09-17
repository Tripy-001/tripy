'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Form } from '@/components/ui/form';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Heart,
  Home,
  Star,
  CheckCircle
} from 'lucide-react';
import { TripPlanRequestSchema, defaultTripPlanValues, type TripPlanRequest } from '@/lib/schemas/trip-plan';
import { BasicInfoStep } from '@/components/form-steps/BasicInfoStep';
import { BudgetStep } from '@/components/form-steps/BudgetStep';
import { GroupDetailsStep } from '@/components/form-steps/GroupDetailsStep';
import { PreferencesStep } from '@/components/form-steps/PreferencesStep';
import { AccommodationTransportStep } from '@/components/form-steps/AccommodationTransportStep';
import { SpecialRequirementsStep } from '@/components/form-steps/SpecialRequirementsStep';
import { AdditionalInfoStep } from '@/components/form-steps/AdditionalInfoStep';
import { SummaryStep } from '@/components/form-steps/SummaryStep';

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: MapPin },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'group', title: 'Group Details', icon: Users },
  { id: 'preferences', title: 'Preferences', icon: Heart },
  { id: 'accommodation', title: 'Accommodation & Transport', icon: Home },
  { id: 'special', title: 'Special Requirements', icon: Star },
  { id: 'additional', title: 'Additional Info', icon: Calendar },
  { id: 'summary', title: 'Summary', icon: CheckCircle },
];

export const TripCreationForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<TripPlanRequest>({
    resolver: zodResolver(TripPlanRequestSchema) as any,
    defaultValues: defaultTripPlanValues,
    mode: 'onChange',
  });

  const { handleSubmit, trigger, formState: { errors, isValid } } = form;
  const isStepValid = () => {
    const values = form.getValues();
    switch (currentStep) {
      case 0:
        return !!(values.origin && values.destination && values.start_date && values.end_date);
      case 1:
        return !!(values.total_budget && values.total_budget > 0);
      case 2:
        return !!(values.group_size && values.traveler_ages && values.traveler_ages.length === values.group_size);
      case 3:
        return !!(values.activity_level && values.primary_travel_style);
      case 4:
        return !!(values.accommodation_type);
      case 5:
        return true; // Special requirements are optional
      case 6:
        return true; // Additional info is optional
      case 7:
        return true; // Summary step
      default:
        return false;
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValidResult = await trigger(fieldsToValidate);
    
    if (isStepValidResult && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/dashboard');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Convert dates to proper format
      const payload = {
        ...data,
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        end_date: new Date(data.end_date).toISOString().split('T')[0],
      };

      console.log('Trip Plan Request:', payload);
      
      // Test the API endpoint
      const response = await fetch('/api/trips/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Trip plan validated successfully:', result.data);
        // Redirect to AI generation
        router.push('/trip/ai-generation');
      } else {
        console.error('Validation failed:', result.error);
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const getFieldsForStep = (step: number): (keyof TripPlanRequest)[] => {
    switch (step) {
      case 0: return ['origin', 'destination', 'start_date', 'end_date'];
      case 1: return ['total_budget', 'budget_currency'];
      case 2: return ['group_size', 'traveler_ages'];
      case 3: return ['activity_level', 'primary_travel_style', 'preferences'];
      case 4: return ['accommodation_type', 'transport_preferences'];
      case 5: return ['dietary_restrictions', 'accessibility_needs', 'special_occasions'];
      case 6: return ['must_visit_places', 'must_try_cuisines', 'avoid_places', 'previous_visits', 'language_preferences'];
      default: return [];
    }
  }; 

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep form={form} />;
      case 1:
        return <BudgetStep form={form} />;
      case 2:
        return <GroupDetailsStep form={form} />;
      case 3:
        return <PreferencesStep form={form} />;
      case 4:
        return <AccommodationTransportStep form={form} />;
      case 5:
        return <SpecialRequirementsStep form={form} />;
      case 6:
        return <AdditionalInfoStep form={form} />;
      case 7:
        return <SummaryStep form={form} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div className="flex-1 mx-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="w-20" /> {/* Spacer for alignment */}
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
                {(() => {
                  const Icon = STEPS[currentStep].icon;
                  return <Icon className="w-8 h-8 text-white" />;
                })()}
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {STEPS[currentStep].title}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {getStepDescription(currentStep)}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {renderStep()}
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button
                    type={currentStep === STEPS.length - 1 ? 'submit' : 'button'}
                    onClick={currentStep === STEPS.length - 1 ? undefined : nextStep}
                    className="flex items-center gap-2"
                    disabled={!isStepValid()}
                  >
                    {currentStep === STEPS.length - 1 ? 'Create Trip' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const getStepDescription = (step: number): string => {
  const descriptions = [
    'Tell us where you want to go and when',
    'Set your budget and spending preferences',
    'Tell us about your travel group',
    'Share your interests and preferences',
    'Choose your accommodation and transport preferences',
    'Any special requirements or dietary needs?',
    'Additional information to personalize your trip',
    'Review your trip details before we create your itinerary',
  ];
  return descriptions[step] || '';
};
