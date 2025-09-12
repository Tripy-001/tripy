'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const OnboardingPage = () => {
  const router = useRouter();
  const { onboardingStep, setOnboardingStep, updateOnboardingData, completeOnboarding } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      completeOnboarding();
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateOnboardingData({ [field]: value });
  };

  const renderStep = () => {
    switch (onboardingStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto theme-bg rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Welcome to Tripy</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's create your account and start planning amazing trips with AI
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
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
                    formData.travelStyle === style.id ? 'ring-2 ring-primary bg-primary/5' : ''
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

      case 2:
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
                    formData.interests?.includes(interest.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    const currentInterests = formData.interests || [];
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

      case 3:
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
                        formData.budgetPreference === budget.id ? 'ring-2 ring-primary bg-primary/5' : ''
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
                        formData.previousExperience === exp.id ? 'ring-2 ring-primary bg-primary/5' : ''
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

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={onboardingStep === 0}
                className="invisible"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex space-x-2">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      step <= onboardingStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={onboardingStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {renderStep()}
            
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleNext}
                className="theme-bg theme-bg-hover text-primary-foreground px-8"
                disabled={
                  (onboardingStep === 0 && (!formData.name || !formData.email || !formData.password)) ||
                  (onboardingStep === 1 && !formData.travelStyle) ||
                  (onboardingStep === 2 && (!formData.interests || formData.interests.length === 0)) ||
                  (onboardingStep === 3 && (!formData.budgetPreference || !formData.previousExperience))
                }
              >
                {onboardingStep === 3 ? 'Complete Setup' : 'Continue'}
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
