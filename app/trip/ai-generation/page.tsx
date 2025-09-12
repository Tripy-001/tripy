'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Globe, 
  TrendingUp, 
  MapPin, 
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useAppStore, type Trip } from '@/lib/store';

const AIGenerationPage = () => {
  const router = useRouter();
  const { tripCreationData, createTrip, setCurrentStep: setAppCurrentStep } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const generationSteps = [
    { id: 'analyzing', label: 'Analyzing Reddit discussions...', icon: Globe, duration: 2000 },
    { id: 'weather', label: 'Checking weather patterns...', icon: TrendingUp, duration: 1500 },
    { id: 'routes', label: 'Optimizing routes...', icon: MapPin, duration: 1800 },
    { id: 'personalizing', label: 'Personalizing based on your preferences...', icon: Sparkles, duration: 2200 },
    { id: 'finalizing', label: 'Finalizing your perfect itinerary...', icon: CheckCircle, duration: 1000 },
  ];

  useEffect(() => {
    let currentStepIndex = 0;
    let totalDuration = 0;

    const runGeneration = () => {
      if (currentStepIndex < generationSteps.length) {
        const step = generationSteps[currentStepIndex];
        setCurrentStep(step.label);
        
        const stepProgress = (currentStepIndex + 1) / generationSteps.length;
        setProgress(stepProgress * 100);

        setTimeout(() => {
          currentStepIndex++;
          runGeneration();
        }, step.duration);
      } else {
        setIsComplete(true);
        // Create the actual trip after generation
        setTimeout(() => {
          if (tripCreationData && tripCreationData.title && tripCreationData.destination) {
            createTrip(tripCreationData as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);
            setAppCurrentStep('dashboard');
            router.push('/dashboard');
          }
        }, 1000);
      }
    };

    runGeneration();
  }, []);

  const handleSkip = () => {
    if (tripCreationData && tripCreationData.title && tripCreationData.destination) {
      createTrip(tripCreationData as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);
      setAppCurrentStep('dashboard');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="w-20 h-20 mx-auto theme-bg rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isComplete ? 'Your Trip is Ready!' : 'Creating Your Perfect Trip'}
            </h2>
            <p className="text-muted-foreground">
              {isComplete 
                ? 'Our AI has crafted an amazing itinerary just for you'
                : 'This might take a moment while we analyze the best options'
              }
            </p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {!isComplete ? (
              <div className="space-y-8">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Current Step */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    {currentStep && (
                      (() => {
                        const step = generationSteps.find(s => s.label === currentStep);
                        const IconComponent = step?.icon || Sparkles;
                        return <IconComponent className="w-8 h-8 text-primary" />;
                      })()
                    )}
                  </div>
                  <p className="text-lg font-medium text-foreground">{currentStep}</p>
                </div>

                {/* Generation Steps */}
                <div className="space-y-3">
                  {generationSteps.map((step, index) => {
                    const isActive = step.label === currentStep;
                    const isCompleted = generationSteps.findIndex(s => s.label === currentStep) > index;
                    const IconComponent = step.icon;
                    
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'bg-primary/10 ring-2 ring-primary/20' 
                            : isCompleted 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isActive 
                            ? 'bg-primary text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>
                        <span className={`font-medium ${
                          isCompleted ? 'text-green-700' : isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Skip Button */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip and create basic trip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Generation Complete!</h3>
                  <p className="text-muted-foreground">
                    Your personalized trip to {tripCreationData?.destination} is ready to explore.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {tripCreationData?.duration || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Days planned</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        ${tripCreationData?.budget?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Budget allocated</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => {
                      if (tripCreationData && tripCreationData.title && tripCreationData.destination) {
                        createTrip(tripCreationData as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);
                        setAppCurrentStep('dashboard');
                        router.push('/dashboard');
                      }
                    }}
                    className="theme-bg theme-bg-hover text-primary-foreground px-8"
                  >
                    View Your Trip
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIGenerationPage;
