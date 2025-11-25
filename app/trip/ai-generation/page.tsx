'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import AutoCarousel from '@/components/AutoCarousel';
import { 
  Sparkles, 
  Globe, 
  TrendingUp, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

type PublicTrip = {
  source_trip_id?: string;
  summary?: string;
  thumbnail_url?: string;
  destination_photos?: string[];
  title?: string;
  updated_at?: string;
  is_paid?: boolean;
  price?: string;
};

const AIGenerationPage = () => {
  const router = useRouter();
  const { isGenerating, currentTripId, currentItinerary, listenToTripUpdates, error } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [publicTrips, setPublicTrips] = useState<PublicTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const generationPhases = useMemo(() => [
    { id: 'analyzing', label: 'Analyzing Reddit discussions...', icon: Globe },
    { id: 'weather', label: 'Checking weather patterns...', icon: TrendingUp },
    { id: 'routes', label: 'Optimizing routes...', icon: MapPin },
    { id: 'personalizing', label: 'Personalizing based on your preferences...', icon: Sparkles },
    { id: 'finalizing', label: 'Finalizing your perfect itinerary...', icon: CheckCircle },
  ], []);

  // Listen for trip completion and redirect
  useEffect(() => {
    if (!isGenerating && currentItinerary && currentTripId && !isRedirecting) {
      // Trip generation completed!
      setIsRedirecting(true);
      setProgress(100);
      setStatusText('Trip completed! Redirecting...');
      
      // Short delay to show completion, then redirect
      setTimeout(() => {
        router.push(`/trip/${currentTripId}`);
      }, 1500);
    }
  }, [isGenerating, currentItinerary, currentTripId, router, isRedirecting]);

  // Subscribe to Firestore trip updates
  useEffect(() => {
    if (!currentTripId || !listenToTripUpdates) return;
    
    console.log('[AI Generation] Listening to trip updates for:', currentTripId);
    const unsubscribe = listenToTripUpdates(currentTripId);
    
    return () => {
      if (unsubscribe) {
        console.log('[AI Generation] Unsubscribing from trip updates');
        unsubscribe();
      }
    };
  }, [currentTripId, listenToTripUpdates]);

  // Progress animation
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

  // Status text rotation
  useEffect(() => {
    // Rotate status text through phases while waiting (unless redirecting)
    if (isRedirecting) return;
    
    const phaseInterval = setInterval(() => {
      setStatusText((prev) => {
        const idx = generationPhases.findIndex((p) => p.label === prev);
        const next = generationPhases[(idx + 1 + generationPhases.length) % generationPhases.length];
        return next?.label || generationPhases[0].label;
      });
    }, 4000);
    setStatusText(generationPhases[0].label);
    return () => clearInterval(phaseInterval);
  }, [isRedirecting, generationPhases]);

  // Fetch public trips for display
  useEffect(() => {
    const fetchPublicTrips = async () => {
      try {
        const res = await fetch('/api/public_trips?limit=12&orderBy=updated_at');
        if (res.ok) {
          const data = await res.json();
          setPublicTrips(data.trips || []);
        }
      } catch (e) {
        console.error('Failed to fetch public trips:', e);
      } finally {
        setIsLoadingTrips(false);
      }
    };
    fetchPublicTrips();
  }, []);

  const scrollTrips = useCallback((direction: 'left' | 'right') => {
    const container = document.getElementById('public-trips-scroll');
    if (container) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  }, [scrollPosition]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollLeft);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Generation Status Section */}
      <div className="flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto theme-bg rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Creating Your Perfect Trip</h2>
              <p className="text-sm text-muted-foreground">This typically takes 3–4 minutes. You can safely leave this page.</p>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
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
                    Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                  </div>
                </div>

                {/* Compact Phases */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {generationPhases.map((phase) => {
                    const IconComponent = phase.icon;
                    const isActive = phase.label === statusText;
                    return (
                      <div
                        key={phase.id}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                          isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {phase.id.charAt(0).toUpperCase() + phase.id.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="text-center space-y-2">
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="theme-bg theme-bg-hover text-primary-foreground px-6"
                    size="sm"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Public Trips Section */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Explore Popular Trips While You Wait
            </h3>
            <p className="text-sm text-muted-foreground">
              Get inspired by trips created by other travelers
            </p>
          </div>

          {/* Scrollable Trips Container */}
          <div className="relative">
            {/* Left Scroll Button */}
            {scrollPosition > 0 && (
              <button
                onClick={() => scrollTrips('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border shadow-lg rounded-full p-2 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Trips Carousel */}
            <div
              id="public-trips-scroll"
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2 snap-x snap-mandatory"
              onScroll={handleScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {isLoadingTrips ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-72 snap-start">
                    <Card className="h-full overflow-hidden animate-pulse">
                      <div className="h-40 bg-muted" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : publicTrips.length > 0 ? (
                publicTrips.map((trip) => (
                  <Link
                    key={trip.source_trip_id}
                    href={`/explore/trip/${trip.source_trip_id}`}
                    className="flex-shrink-0 w-72 snap-start group"
                  >
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                      <div className="relative h-40 overflow-hidden">
                        {trip.destination_photos && trip.destination_photos.length > 0 ? (
                          <AutoCarousel
                            images={trip.destination_photos.slice(0, 5)}
                            className="h-full"
                            imgAlt={trip.title || 'Trip destination'}
                          />
                        ) : trip.thumbnail_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={trip.thumbnail_url}
                            alt={trip.title || 'Trip'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-primary/50" />
                          </div>
                        )}
                        {trip.is_paid && (
                          <Badge className="absolute top-2 right-2 bg-amber-500 text-white">
                            {trip.price || 'Premium'}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {trip.title || 'Untitled Trip'}
                        </CardTitle>
                        {trip.summary && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {trip.summary}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="w-full text-center py-8 text-muted-foreground">
                  No public trips available at the moment
                </div>
              )}
            </div>

            {/* Right Scroll Button */}
            {publicTrips.length > 4 && (
              <button
                onClick={() => scrollTrips('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border shadow-lg rounded-full p-2 hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIGenerationPage;
