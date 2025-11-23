'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Check, Sparkles, Zap, Star, CreditCard, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreditPlan {
  id: '1-credit' | '5-credits' | '10-credits';
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  description: string;
  icon: React.ReactNode;
}

const CREDIT_PLANS: CreditPlan[] = [
  {
    id: '1-credit',
    name: 'Single Trip',
    credits: 1,
    price: 150,
    description: 'Perfect for trying out our AI trip planner',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: '5-credits',
    name: 'Explorer Pack',
    credits: 5,
    price: 650,
    originalPrice: 750,
    description: 'Great for planning multiple trips',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: '10-credits',
    name: 'Adventurer Bundle',
    credits: 10,
    price: 1000,
    originalPrice: 1500,
    popular: true,
    description: 'Best value for frequent travelers',
    icon: <Star className="w-6 h-6" />,
  },
];

interface CreditsDisplayProps {
  showPurchaseButton?: boolean;
  variant?: 'default' | 'compact';
  isDialogOpen?: boolean;
  onDialogChange?: (open: boolean) => void;
}

export default function CreditsDisplay({ 
  showPurchaseButton = true, 
  variant = 'default',
  isDialogOpen: externalDialogOpen,
  onDialogChange: externalDialogChange 
}: CreditsDisplayProps) {
  const { user, firebaseUser, fetchUserCredits } = useAppStore();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'payment' | 'processing'>('select');
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const { toast } = useToast();

  const credits = user?.credits ?? 0;
  
  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalDialogOpen !== undefined ? externalDialogOpen : internalDialogOpen;
  const setIsDialogOpen = externalDialogChange || setInternalDialogOpen;

  const resetPurchaseFlow = () => {
    setPurchaseStep('select');
    setSelectedPlan(null);
    setPaymentDetails({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    });
  };

  const handleSelectPlan = (plan: CreditPlan) => {
    setSelectedPlan(plan);
    setPurchaseStep('payment');
  };

  const handleBackToPlans = () => {
    setPurchaseStep('select');
    setSelectedPlan(null);
  };

  const handlePaymentSubmit = async () => {
    if (!firebaseUser || !selectedPlan) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to purchase credits',
        variant: 'destructive',
      });
      return;
    }

    // Validate payment details (mockup validation)
    if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv) {
      toast({
        title: 'Invalid payment details',
        description: 'Please fill in all payment fields',
        variant: 'destructive',
      });
      return;
    }

    setPurchaseStep('processing');
    setIsPurchasing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/users/credits/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase credits');
      }

      const data = await response.json();
      
      // Refresh credits in store
      await fetchUserCredits();
      
      toast({
        title: '🎉 Purchase successful!',
        description: data.message,
      });
      
      setIsDialogOpen(false);
      resetPurchaseFlow();
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'Failed to purchase credits',
        variant: 'destructive',
      });
      setPurchaseStep('payment');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetPurchaseFlow();
    }
  };

  const renderPlanSelection = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">Purchase Trip Credits</DialogTitle>
        <DialogDescription>
          Choose a plan that fits your travel needs. Credits never expire!
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {CREDIT_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground shadow-md">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-full w-fit">
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">₹{plan.originalPrice}</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {plan.credits} trip credit{plan.credits > 1 ? 's' : ''}
                </div>
                {plan.originalPrice && (
                  <Badge variant="secondary" className="mt-2">
                    Save ₹{plan.originalPrice - plan.price}
                  </Badge>
                )}
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Generate {plan.credits} AI-powered trip{plan.credits > 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Personalized itineraries</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Credits never expire</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleSelectPlan(plan)}
                disabled={isPurchasing}
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
              >
                Select Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">
        This is a demo purchase flow. No actual payment will be processed.
      </p>
    </>
  );

  const renderPaymentForm = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">Payment Details</DialogTitle>
        <DialogDescription>
          Complete your purchase securely. This is a demo - no real payment will be charged.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-6">
        {/* Selected Plan Summary */}
        {selectedPlan && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {selectedPlan.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan.credits} credit{selectedPlan.credits > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₹{selectedPlan.price}</p>
                  {selectedPlan.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">₹{selectedPlan.originalPrice}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              placeholder="John Doe"
              value={paymentDetails.cardName}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                  setPaymentDetails({ ...paymentDetails, cardNumber: value });
                }}
                maxLength={19}
              />
              <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={paymentDetails.expiryDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                  }
                  setPaymentDetails({ ...paymentDetails, expiryDate: value });
                }}
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={paymentDetails.cvv}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  maxLength={3}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300">
            Your payment information is secure and encrypted. This is a demo environment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBackToPlans}
            disabled={isPurchasing}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            disabled={isPurchasing}
            className="flex-1"
          >
            {isPurchasing ? 'Processing...' : `Pay ₹${selectedPlan?.price}`}
          </Button>
        </div>
      </div>
    </>
  );

  const renderProcessing = () => (
    <div className="py-12 text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
        <Coins className="w-8 h-8 text-primary animate-spin" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Processing Payment...</h3>
        <p className="text-muted-foreground">Please wait while we process your transaction</p>
      </div>
    </div>
  );

  // If external dialog control is used, only render the dialog content
  if (externalDialogOpen !== undefined) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {purchaseStep === 'select' && renderPlanSelection()}
          {purchaseStep === 'payment' && renderPaymentForm()}
          {purchaseStep === 'processing' && renderProcessing()}
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={credits === 0 ? 'destructive' : 'secondary'} className="flex items-center gap-1.5 px-3 py-1">
          <Coins className="w-4 h-4" />
          <span className="font-semibold">{credits}</span>
          <span className="text-xs">credit{credits !== 1 ? 's' : ''}</span>
        </Badge>
        {showPurchaseButton && credits === 0 && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="shadow-md">
                <Coins className="w-4 h-4 mr-1.5" />
                Buy Credits
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              {purchaseStep === 'select' && renderPlanSelection()}
              {purchaseStep === 'payment' && renderPaymentForm()}
              {purchaseStep === 'processing' && renderProcessing()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Your Trip Credits
        </CardTitle>
        <CardDescription>
          Use credits to generate AI-powered trip itineraries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Available Credits</p>
            <p className="text-3xl font-bold">{credits}</p>
          </div>
          <Coins className="w-12 h-12 text-primary opacity-20" />
        </div>
        
        {credits === 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              You&apos;re out of credits! Purchase more to continue creating amazing trips.
            </p>
          </div>
        )}

        {showPurchaseButton && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="w-full shadow-md">
                <Coins className="w-4 h-4 mr-2" />
                Purchase Credits
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              {purchaseStep === 'select' && renderPlanSelection()}
              {purchaseStep === 'payment' && renderPaymentForm()}
              {purchaseStep === 'processing' && renderProcessing()}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
