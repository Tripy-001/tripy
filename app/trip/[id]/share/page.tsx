'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Download, 
  Globe, 
  Lock,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  CheckCircle,
  MapPin,
  Calendar,
  Users,
  Star,
  Eye
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface ShareTripPageProps {
  params: {
    id: string;
  };
}

const ShareTripPage = ({ params }: ShareTripPageProps) => {
  const router = useRouter();
  const { trips, updateTrip } = useAppStore();
  const [shareSettings, setShareSettings] = useState({
    isPublic: true,
    allowComments: true,
    showPhotos: true,
    showCosts: false,
  });
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const trip = trips.find(t => t.id === params.id);

  if (!trip) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Trip not found</h2>
            <p className="text-muted-foreground mb-6">The trip you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerateShareLink = () => {
    const shareId = crypto.randomUUID().slice(0, 8);
    const url = `${window.location.origin}/shared/${shareId}`;
    setShareUrl(url);
    updateTrip(trip.id, { 
      shared: true, 
      shareId: shareId 
    });
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log('Downloading PDF for trip:', trip.id);
  };

  const handleSocialShare = (platform: string) => {
    const text = `Check out my amazing trip to ${trip.destination}! Created with Tripy AI.`;
    const url = shareUrl || window.location.href;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const completedActivities = trip.dayPlans.reduce((total, day) => 
    total + day.activities.filter(a => a.completed).length, 0
  );
  const totalActivities = trip.dayPlans.reduce((total, day) => 
    total + day.activities.length, 0
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/trip/${trip.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Share Your Trip</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Preview */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{trip.title}</CardTitle>
                <CardDescription className="flex items-center text-lg mt-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  {trip.destination}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {trip.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Duration</p>
                  <p className="text-sm text-muted-foreground">{trip.duration} days</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Travelers</p>
                  <p className="text-sm text-muted-foreground">{trip.travelers}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Activities</p>
                  <p className="text-sm text-muted-foreground">
                    {completedActivities}/{totalActivities} completed
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Rating</p>
                  <p className="text-sm text-muted-foreground">4.8/5</p>
                </div>
              </div>
            </div>

            {/* Trip Tree Visualization Placeholder */}
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 theme-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Trip Visualization</h3>
              <p className="text-muted-foreground">
                Interactive tree view showing your journey through {trip.destination}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Settings */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Share Settings</CardTitle>
            <CardDescription>
              Customize what others can see when viewing your trip
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Public Visibility</Label>
                      <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
                    </div>
                  </div>
                  <Button
                    variant={shareSettings.isPublic ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShareSettings(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  >
                    {shareSettings.isPublic ? 'Public' : 'Private'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Allow Comments</Label>
                      <p className="text-xs text-muted-foreground">Let others comment on your trip</p>
                    </div>
                  </div>
                  <Button
                    variant={shareSettings.allowComments ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShareSettings(prev => ({ ...prev, allowComments: !prev.allowComments }))}
                  >
                    {shareSettings.allowComments ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Show Photos</Label>
                      <p className="text-xs text-muted-foreground">Include your trip photos</p>
                    </div>
                  </div>
                  <Button
                    variant={shareSettings.showPhotos ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShareSettings(prev => ({ ...prev, showPhotos: !prev.showPhotos }))}
                  >
                    {shareSettings.showPhotos ? 'Show' : 'Hide'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Show Costs</Label>
                      <p className="text-xs text-muted-foreground">Include budget information</p>
                    </div>
                  </div>
                  <Button
                    variant={shareSettings.showCosts ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShareSettings(prev => ({ ...prev, showCosts: !prev.showCosts }))}
                  >
                    {shareSettings.showCosts ? 'Show' : 'Hide'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Actions */}
        <div className="space-y-6">
          {/* Generate Share Link */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Share Link</CardTitle>
              <CardDescription>
                Generate a shareable link for your trip
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!shareUrl ? (
                <Button
                  onClick={handleGenerateShareLink}
                  className="theme-bg theme-bg-hover text-primary-foreground"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Share Link
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {copied ? 'Link copied to clipboard!' : 'Click the copy button to share this link'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media Sharing */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>
                Share your trip on social platforms
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => handleSocialShare('facebook')}
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => handleSocialShare('twitter')}
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => handleSocialShare('instagram')}
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => navigator.clipboard.writeText(shareUrl || '')}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Copy Text</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Export Trip</CardTitle>
              <CardDescription>
                Download your trip in different formats
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={handleDownloadPDF}
                >
                  <Download className="w-4 h-4" />
                  <span>PDF Itinerary</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => console.log('Export to calendar')}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => console.log('Export to Google Maps')}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Google Maps</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShareTripPage;
