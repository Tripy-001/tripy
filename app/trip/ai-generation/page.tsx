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
import { useAppStore } from '@/lib/store';

const AIGenerationPage = () => {
  const router = useRouter();
  const { isGenerating, currentTripId, listenToTripUpdates, resetCurrentTrip, error } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');

  const generationPhases = [
    { id: 'analyzing', label: 'Analyzing Reddit discussions...', icon: Globe },
    { id: 'weather', label: 'Checking weather patterns...', icon: TrendingUp },
    { id: 'routes', label: 'Optimizing routes...', icon: MapPin },
    { id: 'personalizing', label: 'Personalizing based on your preferences...', icon: Sparkles },
    { id: 'finalizing', label: 'Finalizing your perfect itinerary...', icon: CheckCircle },
  ];

  useEffect(() => {
    // Slowly increase progress to 90% over ~3 minutes, then hover around until completion
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        const target = 90;
        if (p < target) return Math.min(target, p + 0.5); // ~180s to reach 90%
        // Hover between 88-92%
        const delta = (Math.random() - 0.5) * 0.4;
        return Math.max(88, Math.min(92, p + delta));
      });
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Rotate status text through phases while waiting
    const phaseInterval = setInterval(() => {
      setStatusText((prev) => {
        const idx = generationPhases.findIndex((p) => p.label === prev);
        const next = generationPhases[(idx + 1 + generationPhases.length) % generationPhases.length];
        return next?.label || generationPhases[0].label;
      });
    }, 4000);
    setStatusText(generationPhases[0].label);
    return () => clearInterval(phaseInterval);
  }, []);

  useEffect(() => {
    // Subscribe to Firestore trip doc updates when we have an ID
    if (!currentTripId || !listenToTripUpdates) return;
    const unsubscribe = listenToTripUpdates(currentTripId);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentTripId, listenToTripUpdates]);

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Creating Your Perfect Trip</h2>
            <p className="text-muted-foreground">This typically takes 3–4 minutes. You can safely leave this page; generation will continue in the background.</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-center text-sm text-muted-foreground mt-2">
                  {statusText}
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Elapsed time: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                </div>
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {generationPhases.map((phase) => {
                  const IconComponent = phase.icon;
                  const isActive = phase.label === statusText;
                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                        isActive ? 'bg-primary/10 ring-2 ring-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'} w-8 h-8 rounded-full flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className={`${isActive ? 'text-primary' : 'text-muted-foreground'} font-medium`}>
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="text-center space-y-3">
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="theme-bg theme-bg-hover text-primary-foreground px-8"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <div className="text-xs text-muted-foreground">
                  You can monitor progress from your dashboard. We’ll keep generating even if you leave.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIGenerationPage;
