import { ArrowRight, Sparkles, Globe, Users, Shield, Star, TrendingUp, Clock, MapPin, Heart, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Your Perfect Trip,{' '}
                  <span className="theme-text-accent">
                    AI-Crafted
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Stop spending hours researching. Our AI creates personalized travel itineraries in minutes, learning from millions of real traveler experiences.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="group text-lg px-8 py-4 theme-bg theme-bg-hover text-primary-foreground border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Plan Your Adventure
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>50K+ travelers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto theme-bg rounded-full flex items-center justify-center">
                      <Globe className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">Beautiful Destination</div>
                    <div className="text-gray-600">Your perfect trip awaits</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full animate-bounce" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary rounded-full animate-bounce delay-1000" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Choose Tripy?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes travel planning effortless and personalized
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shadow-soft dark:shadow-soft-dark">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Global Coverage</CardTitle>
                <Badge variant="secondary" className="w-fit">Worldwide</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Access to millions of destinations worldwide with real-time data and local insights
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shadow-soft dark:shadow-soft-dark">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI-Powered</CardTitle>
                <Badge variant="secondary" className="w-fit">Smart</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced algorithms learn your preferences to suggest perfect destinations and activities
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shadow-soft dark:shadow-soft-dark">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Community Driven</CardTitle>
                <Badge variant="secondary" className="w-fit">Social</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with fellow travelers and get recommendations from real experiences
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shadow-soft dark:shadow-soft-dark">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Safe & Secure</CardTitle>
                <Badge variant="secondary" className="w-fit">Secure</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your data is protected with enterprise-grade security and privacy controls
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Travelers Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join millions of users who have discovered their perfect destinations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2M+</div>
              <div className="text-muted-foreground">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Countries Covered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your personalized trip recommendations in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Tell Us Your Preferences</h3>
              <p className="text-muted-foreground">
                Share your interests, budget, travel dates, and what kind of experience you're looking for.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Analyzes & Recommends</h3>
              <p className="text-muted-foreground">
                Our advanced AI analyzes millions of data points to suggest perfect destinations and activities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Plan & Book</h3>
              <p className="text-muted-foreground">
                Review your personalized itinerary and book everything directly through our platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from travelers who discovered their dream destinations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card shadow-soft dark:shadow-soft-dark">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Tripy helped me discover hidden gems in Japan I never would have found on my own. The AI recommendations were spot on!"
                </p>
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Miller</div>
                    <div className="text-sm text-muted-foreground">Tokyo, Japan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card shadow-soft dark:shadow-soft-dark">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "As a solo traveler, I was nervous about planning my first international trip. Tripy made it so easy and safe!"
                </p>
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Michael Johnson</div>
                    <div className="text-sm text-muted-foreground">Barcelona, Spain</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card shadow-soft dark:shadow-soft-dark">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The family-friendly recommendations were perfect for our trip with kids. Everyone had an amazing time!"
                </p>
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarFallback>ED</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">Emily Davis</div>
                    <div className="text-sm text-muted-foreground">Paris, France</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Why Choose Tripy?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We combine cutting-edge AI technology with real travel expertise to create personalized experiences that exceed your expectations.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Personalized Recommendations</h3>
                    <p className="text-muted-foreground">AI learns your preferences to suggest destinations and activities you'll love.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Save Time Planning</h3>
                    <p className="text-muted-foreground">Get complete itineraries in minutes instead of spending hours researching.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Best Value Guaranteed</h3>
                    <p className="text-muted-foreground">We find the best deals and ensure you get maximum value for your budget.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card shadow-soft dark:shadow-soft-dark">
                  <CardContent className="p-6 text-center">
                    <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-foreground mb-1">4.9/5</div>
                    <div className="text-sm text-muted-foreground">User Rating</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-card shadow-soft dark:shadow-soft-dark">
                  <CardContent className="p-6 text-center">
                    <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-foreground mb-1">50+</div>
                    <div className="text-sm text-muted-foreground">Awards Won</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-card shadow-soft dark:shadow-soft-dark">
                  <CardContent className="p-6 text-center">
                    <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-foreground mb-1">195</div>
                    <div className="text-sm text-muted-foreground">Countries</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-card shadow-soft dark:shadow-soft-dark">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-foreground mb-1">2M+</div>
                    <div className="text-sm text-muted-foreground">Users</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 bg-muted/50 rounded-3xl border border-border/50">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to Explore the World?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who have discovered their perfect destinations with Tripy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 theme-bg theme-bg-hover text-primary-foreground shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <MapPin className="mr-2 w-5 h-5" />
                View Destinations
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;