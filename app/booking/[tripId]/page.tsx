'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  ArrowLeft,
  Plane,
  Train,
  Bus,
  Car,
  CreditCard,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { auth } from '@/lib/firebase';

type BookingPageProps = {
  params: { tripId: string } | Promise<{ tripId: string }>;
};

const resolveParams = async (input: BookingPageProps['params']): Promise<{ tripId: string } | null> => {
  try {
    const p = input as unknown;
    if (p && typeof p.then === 'function') {
      return await p;
    }
    return p || null;
  } catch {
    return null;
  }
};

type TransportMode = 'flight' | 'train' | 'bus' | 'car';

interface TripDetails {
  id: string;
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalCost: number;
  duration: number;
}

export default function BookingPage(props: BookingPageProps) {
  const router = useRouter();
  const { firebaseUser, authLoading } = useAppStore();
  const [tripId, setTripId] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [selectedTransport, setSelectedTransport] = useState<TransportMode>('flight');
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'success'>('details');
  const [processing, setProcessing] = useState(false);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    let mounted = true;
    resolveParams(props.params).then((res) => {
      if (!mounted) return;
      setTripId(res?.tripId ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [props.params]);

  useEffect(() => {
    if (!tripId) return;
    if (authLoading) return;

    const fetchTripDetails = async () => {
      try {
        const user = firebaseUser || auth.currentUser;
        if (!user) {
          setError('You must be signed in to book a trip.');
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch(`/api/trips/${tripId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch trip details');
        }

        const data = await res.json();
        
        // Extract origin and destination from the trip data
        const originDestination = data.trip.userInput.origin && data.trip.userInput.destination 
          ? { origin: data.trip.userInput.origin, destination: data.trip.userInput.destination }
          : extractOriginDestination(data.trip.title);

        setTrip({
          id: data.trip.id,
          destination: originDestination.destination,
          origin: originDestination.origin,
          startDate: data.trip.userInput.start_date,
          endDate: data.trip.userInput.end_date,
          travelers: data.trip.userInput.group_size || 1,
          totalCost: data.trip.userInput.total_budget || 0,
          duration: data.trip.itinerary?.length || 1,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError('Failed to load trip details');
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, firebaseUser, authLoading]);

  // Helper function to extract origin and destination
  const extractOriginDestination = (title: string) => {
    const parts = title.split('→').map(part => part.trim());
    if (parts.length === 2) {
      return { origin: parts[0].replace(' Adventure', ''), destination: parts[1].replace(' Adventure', '') };
    }
    return { origin: 'Unknown', destination: title.replace(' Adventure', '') };
  };

  const transportOptions = [
    { value: 'flight', label: 'Flight', icon: Plane, duration: '2-4 hours', price: 4500 },
    { value: 'train', label: 'Train', icon: Train, duration: '8-12 hours', price: 1200 },
    { value: 'bus', label: 'Bus', icon: Bus, duration: '12-16 hours', price: 800 },
    { value: 'car', label: 'Car Rental', icon: Car, duration: '10-14 hours', price: 2500 },
  ];

  const selectedOption = transportOptions.find(opt => opt.value === selectedTransport);
  const transportCost = selectedOption?.price || 0;
  const totalBookingCost = (trip?.totalCost || 0) + transportCost;

  const handlePaymentInputChange = (field: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProceedToPayment = () => {
    setBookingStep('payment');
  };

  const handleProcessPayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessing(false);
    setBookingStep('success');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <span className="text-lg text-muted-foreground">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="glass-card max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Unable to Load Trip</h4>
            <p className="text-muted-foreground mb-4">{error || 'Trip not found'}</p>
            <Button onClick={() => router.push('/trips')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trips
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (bookingStep === 'success') {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Booking Confirmed! 🎉</h2>
              <p className="text-lg text-muted-foreground mb-2">
                Your trip to <span className="font-semibold text-foreground">{trip.destination}</span> has been successfully booked.
              </p>
              <p className="text-muted-foreground mb-8">
                A confirmation email has been sent to your registered email address.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  Booking Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking ID:</span>
                    <span className="font-mono font-medium">#{tripId?.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route:</span>
                    <span className="font-medium">{trip.origin} → {trip.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport:</span>
                    <span className="font-medium capitalize">{selectedTransport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span className="font-bold text-primary">₹{totalBookingCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push(`/trip/${tripId}`)}
                  className="theme-bg theme-bg-hover text-primary-foreground"
                >
                  View Trip Details
                </Button>
                <Button 
                  onClick={() => router.push('/trips')}
                  variant="outline"
                >
                  Back to All Trips
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/trips')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Booking</h1>
              <p className="text-muted-foreground">
                Secure your travel arrangements for {trip.destination}
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-2">
              <div className={`flex items-center ${bookingStep === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  bookingStep === 'details' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Details</span>
              </div>
              <div className="w-12 h-0.5 bg-muted"></div>
              <div className={`flex items-center ${bookingStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  bookingStep === 'payment' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {bookingStep === 'details' ? (
              <>
                {/* Trip Details Card */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-primary" />
                      Trip Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Route</p>
                          <p className="font-semibold text-foreground">{trip.origin} → {trip.destination}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Travel Dates</p>
                          <p className="font-semibold text-foreground">
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Travelers</p>
                          <p className="font-semibold text-foreground">{trip.travelers} {trip.travelers > 1 ? 'People' : 'Person'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold text-foreground">{trip.duration} Days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transportation Selection */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plane className="w-5 h-5 mr-2 text-primary" />
                      Select Transportation
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred mode of transport from {trip.origin} to {trip.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedTransport} onValueChange={(value) => setSelectedTransport(value as TransportMode)}>
                      <div className="space-y-3">
                        {transportOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = selectedTransport === option.value;
                          
                          return (
                            <div key={option.value} className={`relative rounded-lg border-2 transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}>
                              <label className="flex items-center p-4 cursor-pointer">
                                <RadioGroupItem value={option.value} id={option.value} className="mr-4" />
                                <div className="flex items-center justify-between flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    }`}>
                                      <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-foreground">{option.label}</p>
                                      <p className="text-sm text-muted-foreground flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {option.duration}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-foreground">₹{option.price.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">per person</p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Payment Form */
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    Enter your payment information to complete the booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Mock Payment System
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            This is a demonstration. No real charges will be made. Use any test card number.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentForm.cardNumber}
                        onChange={(e) => handlePaymentInputChange('cardNumber', e.target.value)}
                        maxLength={19}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={paymentForm.cardName}
                        onChange={(e) => handlePaymentInputChange('cardName', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={paymentForm.expiryDate}
                          onChange={(e) => handlePaymentInputChange('expiryDate', e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={paymentForm.cvv}
                          onChange={(e) => handlePaymentInputChange('cvv', e.target.value)}
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">
                        Your payment information is secure and encrypted
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trip Package</span>
                    <span className="font-medium">₹{trip.totalCost.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedOption?.label} ({trip.travelers} × ₹{selectedOption?.price.toLocaleString()})
                    </span>
                    <span className="font-medium">₹{(transportCost * trip.travelers).toLocaleString()}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-foreground">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">₹{(totalBookingCost + (transportCost * (trip.travelers - 1))).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  {bookingStep === 'details' ? (
                    <Button 
                      onClick={handleProceedToPayment}
                      className="w-full theme-bg theme-bg-hover text-primary-foreground"
                      size="lg"
                    >
                      Proceed to Payment
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleProcessPayment}
                        disabled={processing}
                        className="w-full theme-bg theme-bg-hover text-primary-foreground"
                        size="lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Complete Payment
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setBookingStep('details')}
                        variant="outline"
                        className="w-full"
                        disabled={processing}
                      >
                        Back to Details
                      </Button>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-2 text-green-600" />
                      <span>Free cancellation up to 24 hours</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-2 text-green-600" />
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-2 text-green-600" />
                      <span>24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

