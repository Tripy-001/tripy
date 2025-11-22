'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Globe, Users, Shield, Star, TrendingUp, Clock, MapPin, CheckCircle, CalendarDays, CloudSun, Sliders, Sparkles, Play, Zap, Target, Compass, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PublicTrips from '@/components/PublicTrips';

const HomePage = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const tripsRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Track scroll position for parallax with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in-view');
        }
      });
    }, observerOptions);

    const sections = [
      heroRef.current,
      featuresRef.current,
      howItWorksRef.current,
      tripsRef.current,
      benefitsRef.current,
      ctaRef.current,
    ].filter(Boolean) as Element[];

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        id="home" 
        className="relative min-h-screen flex items-center overflow-hidden bg-background section-animate"
      >
        {/* Animated Background Elements with Parallax */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow parallax-slow"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow parallax-medium"
            style={{ 
              animationDelay: '2s',
              transform: `translateY(${scrollY * -0.2}px)`
            }} 
          />
          <div 
            className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-float-slow parallax-fast"
            style={{ 
              animationDelay: '1s',
              transform: `translateX(${scrollY * 0.4}px)`
            }} 
          />
          {/* Additional floating elements with continuous loops */}
          <div 
            className="absolute top-1/4 right-1/3 w-32 h-32 bg-accent/5 rounded-full blur-xl animate-float-slow"
            style={{ transform: `translateY(${scrollY * 0.25}px)` }}
          />
          <div 
            className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-primary/5 rounded-full blur-xl animate-float-reverse"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          />
          {/* Rotating decorative elements */}
          <div 
            className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/5 rounded-full blur-lg animate-rotate-slow"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div 
            className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-primary/5 rounded-full blur-lg animate-rotate-slow"
            style={{ 
              animationDirection: 'reverse',
              transform: `translateY(${scrollY * -0.1}px)`
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen py-20 lg:py-32">
            {/* Left Content */}
            <div className="space-y-8 lg:space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm text-sm font-semibold text-primary shadow-sm animate-fade-in">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI-Powered Travel Planning
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-[1.05] tracking-tight">
                  Your Perfect Trip,{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    AI-Crafted
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl font-light">
                  Stop spending hours researching. Our AI creates personalized travel itineraries in minutes, learning from millions of real traveler experiences.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="group text-base sm:text-lg px-8 sm:px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold relative z-10"
                >
                  Plan Your Adventure
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group text-base sm:text-lg px-8 sm:px-10 py-6 bg-background/50 backdrop-blur-sm border-2 border-border hover:bg-accent/10 hover:border-accent rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold relative z-10"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-wrap items-center gap-6 lg:gap-8 pt-6">
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">50K+</div>
                    <div className="text-sm text-muted-foreground font-medium">Active Travelers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center border-2 border-accent/30 shadow-lg group-hover:scale-110 transition-transform">
                    <Star className="w-7 h-7 text-accent fill-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">4.9/5</div>
                    <div className="text-sm text-muted-foreground font-medium">User Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Visual */}
            <div className="relative lg:pl-8">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-border/50 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 backdrop-blur-sm">
                <div className="aspect-[4/3] flex items-center justify-center p-8 lg:p-12">
                  <div className="text-center space-y-8 w-full">
                    <div className="relative inline-block">
                      <div className="w-36 h-36 lg:w-40 lg:h-40 mx-auto bg-gradient-to-br from-primary via-primary/80 to-accent rounded-full flex items-center justify-center shadow-2xl animate-float">
                        <Globe className="w-20 h-20 lg:w-24 lg:h-24 text-primary-foreground" />
                      </div>
                      <div className="absolute -top-4 -right-4 w-10 h-10 bg-accent rounded-full shadow-lg animate-bounce" />
                      <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-primary rounded-full shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute top-1/2 -right-8 w-6 h-6 bg-accent/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                    <div className="space-y-3">
                      <div className="text-2xl lg:text-3xl font-bold text-foreground">AI-Powered Planning</div>
                      <div className="text-base lg:text-lg text-muted-foreground">Your perfect trip awaits</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        id="features" 
        className="py-32 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden section-animate"
      >
        <div 
          className="absolute inset-0 bg-grid-pattern opacity-5 parallax-slow"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
              Powerful Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Plan Perfectly
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our AI-powered platform makes travel planning effortless and personalized
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="group border-2 border-border/50 hover:border-primary/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2 font-bold">Daily Itineraries</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs font-semibold">Fully Customized</Badge>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  End-to-end trips with day-by-day activities tailored to your goals and pace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-2 border-border/50 hover:border-accent/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent/30 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <CloudSun className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl mb-2 font-bold">Weather-Aware</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs font-semibold">Real-time</Badge>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  Live weather signals auto-adjust your plan and suggest better time slots.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-2 border-border/50 hover:border-primary/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <Sliders className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2 font-bold">Preference-First</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs font-semibold">Personalized</Badge>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  Trips evolve from your interests, budget, pace, and travel style.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-2 border-border/50 hover:border-accent/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-400">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent/30 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl mb-2 font-bold">Safe & Secure</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs font-semibold">Secure</Badge>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  Your data is protected with enterprise-grade security and privacy controls.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={howItWorksRef}
        className="py-32 bg-background relative overflow-hidden section-animate"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background parallax-slow"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm font-semibold bg-accent/10 text-accent border-accent/20">
              Simple Process
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              How It{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get your personalized trip recommendations in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent step-line-animate" />
            
            <div className="text-center group relative step-animate animate-delay-100">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-4xl font-bold text-primary-foreground">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Tell Us Your Preferences</h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Share your interests, budget, travel dates, and what kind of experience you&apos;re looking for.
              </p>
            </div>
            
            <div className="text-center group relative step-animate animate-delay-200">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-4xl font-bold text-accent-foreground">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">AI Analyzes & Recommends</h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Our advanced AI analyzes millions of data points to suggest perfect destinations and activities.
              </p>
            </div>
            
            <div className="text-center group relative step-animate animate-delay-300">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-4xl font-bold text-primary-foreground">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Plan & Book</h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Review your personalized itinerary and book everything directly through our platform.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Public Trips Section */}
      <section 
        ref={tripsRef}
        className="py-32 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden section-animate"
      >
        <div 
          className="absolute inset-0 bg-grid-pattern opacity-5 parallax-slow"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
              Community Trips
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Explore{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Public Trips
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              See community-created itineraries and get inspired. Load more to browse.
            </p>
          </div>
          <PublicTrips initialLimit={9} />
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        ref={benefitsRef}
        className="py-32 bg-background relative overflow-hidden section-animate"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 parallax-medium"
          style={{ transform: `translateY(${scrollY * 0.12}px)` }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-sm font-semibold bg-accent/10 text-accent border-accent/20">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tripy?
              </span>
              </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We combine cutting-edge AI technology with real travel expertise to create personalized experiences that exceed your expectations.
              </p>
                </div>
                
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Personalized Recommendations</h3>
                <p className="text-base text-muted-foreground leading-relaxed">AI learns your preferences to suggest destinations and activities you&apos;ll love.</p>
                  </CardContent>
                </Card>
                
            <Card className="group border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  <Zap className="w-10 h-10 text-accent" />
                    </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Save Time Planning</h3>
                <p className="text-base text-muted-foreground leading-relaxed">Get complete itineraries in minutes instead of spending hours researching.</p>
                  </CardContent>
                </Card>
                
            <Card className="group border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden relative card-animate animate-delay-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  <Compass className="w-10 h-10 text-primary" />
                    </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Best Value Guaranteed</h3>
                <p className="text-base text-muted-foreground leading-relaxed">We find the best deals and ensure you get maximum value for your budget.</p>
                  </CardContent>
                </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="py-32 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden section-animate"
      >
        <div 
          className="absolute inset-0 bg-grid-pattern opacity-5 parallax-slow"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="relative p-12 lg:p-20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-3xl border-2 border-primary/20 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-sm font-semibold text-primary mb-6">
                <Plane className="w-4 h-4" />
                Start Your Journey
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Ready to Explore the{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  World?
                </span>
            </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of travelers who have discovered their perfect destinations with Tripy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="group text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold">
                Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
                <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2 border-border hover:border-accent hover:bg-accent/10 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <MapPin className="mr-2 w-5 h-5" />
                View Destinations
              </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;