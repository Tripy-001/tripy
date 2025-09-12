import { ArrowLeft, Heart, Star, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 light-theme dark:dark-theme bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            About <span className="theme-text-accent">Tripy</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            We're passionate about making travel planning effortless and personalized through the power of artificial intelligence.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                To democratize travel planning by making it accessible, personalized, and enjoyable for everyone. 
                We believe that everyone deserves to experience the world, and technology should make that easier, not harder.
              </p>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform learns from your preferences, budget, and travel style to suggest 
                destinations and experiences that truly match what you're looking for.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="glass-card text-center shadow-soft dark:shadow-soft-dark">
                <CardHeader>
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Passionate</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>We love travel and technology</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass-card text-center shadow-soft dark:shadow-soft-dark">
                <CardHeader>
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Curated recommendations</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass-card text-center shadow-soft dark:shadow-soft-dark">
                <CardHeader>
                  <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Innovation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Cutting-edge AI technology</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass-card text-center shadow-soft dark:shadow-soft-dark">
                <CardHeader>
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Built by travelers, for travelers</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
