'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const OnboardingPage = () => {
  // router already declared above
  const {
    onboardingStep,
    setOnboardingStep,
    updateOnboardingData,
    completeOnboarding,
    isAuthenticated,
    user,
    firebaseUser,
    error,
    setError,
    authLoading,
    onboardingData
  } = useAppStore();
  const router = useRouter();

  // Redirect logic: must be authenticated, must not have completed onboarding
  // Track loading state for auth/profile check
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => {
    // Only show onboarding if user is authenticated and has NOT completed onboarding (travelStyle missing)
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (!isAuthenticated || !firebaseUser) {
      router.replace('/signin');
      return;
    }
    if (user?.preferences?.travelStyle) {
      router.replace('/dashboard');
      return;
    }
    setPageLoading(false);
  }, [isAuthenticated, firebaseUser, user, authLoading, router]);

  // Set initial onboarding step only once
  useEffect(() => {
    if (isAuthenticated && firebaseUser && !user?.travelStyle) {
      console.log('Setting initial onboarding step to 0');
      setOnboardingStep(0);
    }
  }, [isAuthenticated, firebaseUser, user?.travelStyle, setOnboardingStep]);

  const handleNext = async () => {
    console.log('handleNext called, current step:', onboardingStep, 'onboardingData:', onboardingData);
    if (onboardingStep < 2) {
      console.log('About to advance step from', onboardingStep, 'to', onboardingStep + 1);
      setOnboardingStep(onboardingStep + 1);
      console.log('setOnboardingStep called');
    } else {
      // Complete onboarding and save preferences to Firebase
      if (!firebaseUser || !firebaseUser.uid) {
        setError('You must be signed in to complete onboarding.');
        return;
      }
      if (user && user.id && user.id !== firebaseUser.uid) {
        setError('You are not authorized to update this profile.');
        return;
      }
      try {
        const response = await fetch(`/api/users/${firebaseUser.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              travelStyle: onboardingData.travelStyle,
              interests: onboardingData.interests,
              budgetRange: onboardingData.budgetPreference,
              previousExperience: onboardingData.previousExperience
            }
          }),
        });
        if (response.ok) {
          // Update Zustand store with new preferences in user.preferences
          updateOnboardingData({
            travelStyle: onboardingData.travelStyle,
            interests: onboardingData.interests,
            budgetPreference: onboardingData.budgetPreference,
            previousExperience: onboardingData.previousExperience
          });
          // Also update user.preferences in Zustand
          // (user object is updated by useFirebaseAuth on next reload, but for instant UX)
          completeOnboarding();
          router.push('/dashboard');
        } else {
          setError('Error saving preferences.');
        }
      } catch (error) {
        setError('Error saving preferences.');
        console.error('Error saving preferences:', error);
      }
    }
  };

  const handleBack = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('handleInputChange called:', field, value);
    updateOnboardingData({ [field]: value });
  };

  // No sign-in logic in onboarding anymore

  const renderStep = () => {
    switch (onboardingStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">What's your travel style?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Help us understand your preferences to create better recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'adventure', label: 'Adventure', icon: '🏔️', desc: 'Outdoor activities, hiking, extreme sports' },
                { id: 'luxury', label: 'Luxury', icon: '✨', desc: 'High-end hotels, fine dining, premium experiences' },
                { id: 'budget', label: 'Budget', icon: '💰', desc: 'Affordable options, hostels, local experiences' },
                { id: 'cultural', label: 'Cultural', icon: '🏛️', desc: 'Museums, historical sites, local traditions' },
              ].map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    onboardingData.travelStyle === style.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleInputChange('travelStyle', style.id)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-2xl">{style.icon}</div>
                    <h3 className="font-semibold">{style.label}</h3>
                    <p className="text-xs text-muted-foreground">{style.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">What interests you most?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select all that apply to get personalized recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'food', label: 'Food & Dining', icon: '🍽️' },
                { id: 'history', label: 'History & Culture', icon: '🏛️' },
                { id: 'nature', label: 'Nature & Wildlife', icon: '🌿' },
                { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
                { id: 'shopping', label: 'Shopping', icon: '🛍️' },
                { id: 'art', label: 'Art & Museums', icon: '🎨' },
                { id: 'beaches', label: 'Beaches', icon: '🏖️' },
                { id: 'mountains', label: 'Mountains', icon: '⛰️' },
              ].map((interest) => (
                <Card
                  key={interest.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    onboardingData.interests?.includes(interest.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    const currentInterests = onboardingData.interests || [];
                    const newInterests = currentInterests.includes(interest.id)
                      ? currentInterests.filter(i => i !== interest.id)
                      : [...currentInterests, interest.id];
                    handleInputChange('interests', newInterests);
                  }}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-2xl">{interest.icon}</div>
                    <h3 className="font-semibold text-sm">{interest.label}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Almost there!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Just a few more details to complete your profile
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Budget Preference</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'low', label: 'Low', desc: '$0-100/day' },
                    { id: 'medium', label: 'Medium', desc: '$100-300/day' },
                    { id: 'high', label: 'High', desc: '$300+/day' },
                  ].map((budget) => (
                    <Card
                      key={budget.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        onboardingData.budgetPreference === budget.id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleInputChange('budgetPreference', budget.id)}
                    >
                      <CardContent className="p-4 text-center space-y-1">
                        <h3 className="font-semibold">{budget.label}</h3>
                        <p className="text-xs text-muted-foreground">{budget.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Travel Experience</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', label: 'Beginner', desc: 'First time traveler' },
                    { id: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                    { id: 'expert', label: 'Expert', desc: 'Frequent traveler' },
                  ].map((exp) => (
                    <Card
                      key={exp.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        onboardingData.previousExperience === exp.id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleInputChange('previousExperience', exp.id)}
                    >
                      <CardContent className="p-4 text-center space-y-1">
                        <h3 className="font-semibold">{exp.label}</h3>
                        <p className="text-xs text-muted-foreground">{exp.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex space-x-2">
                {[0, 1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      step <= onboardingStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {renderStep()}
            <div className="mt-8 flex justify-between">
              <Button
                onClick={handleBack}
                className="px-6"
                variant="outline"
                disabled={onboardingStep === 0}
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="theme-bg theme-bg-hover text-primary-foreground px-8"
                disabled={
                  (onboardingStep === 0 && !onboardingData.travelStyle) ||
                  (onboardingStep === 1 && (!onboardingData.interests || onboardingData.interests.length === 0)) ||
                  (onboardingStep === 2 && (!onboardingData.budgetPreference || !onboardingData.previousExperience))
                }
                type="button"
              >
                {onboardingStep === 2 ? 'Complete Setup' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
