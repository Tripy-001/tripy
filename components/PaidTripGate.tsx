"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Lock, DollarSign } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

type PaidTripGateProps = {
  tripId: string;
  isPaid?: boolean;
  price?: string;
  tripData?: {
    title?: string;
    summary?: string;
    description?: string;
    thumbnail_url?: string;
    destination_photos?: string[];
    destination?: string;
  };
  children: React.ReactNode;
};

export default function PaidTripGate({ tripId, isPaid = false, price = '0', tripData, children }: PaidTripGateProps) {
  const router = useRouter();
  const { firebaseUser } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [clonedTripId, setClonedTripId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already purchased and find their cloned trip
    const checkPurchase = async () => {
      if (!isPaid || !firebaseUser) {
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`/api/public_trips/${tripId}/cloned-trip`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setClonedTripId(data.trip_id);
        }
      } catch (e) {
        console.error('Failed to check cloned trip:', e);
      } finally {
        setIsChecking(false);
      }
    };

    checkPurchase();
  }, [tripId, isPaid, firebaseUser]);

  const handlePurchase = async () => {
    if (!firebaseUser) {
      toast.error('Please log in to purchase trips');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/public_trips/${tripId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: tripId,
          price: price,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Purchase failed' }));
        
        // Handle already purchased case - redirect to cloned trip
        if (errorData.already_purchased) {
          // Try to find the cloned trip
          try {
            const token = await firebaseUser.getIdToken();
            const clonedRes = await fetch(`/api/public_trips/${tripId}/cloned-trip`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (clonedRes.ok) {
              const clonedData = await clonedRes.json();
              toast('You already own this trip', {
                description: 'Redirecting to your trip...',
              });
              setTimeout(() => {
                router.push(`/trip/${clonedData.trip_id}`);
              }, 1000);
              return;
            }
          } catch (e) {
            console.error('Failed to find cloned trip:', e);
          }
          toast.error('You have already purchased this trip');
          setIsProcessingPayment(false);
          return;
        }
        
        throw new Error(errorData.error || 'Purchase failed');
      }

      const data = await res.json();
      setPaymentModalOpen(false);
      
      // If trip was cloned, redirect to cloned trip page
      if (data.cloned && data.trip_id) {
        toast.success('Trip purchased successfully!', {
          description: 'Redirecting to your trip...',
        });
        // Small delay to show toast, then redirect
        setTimeout(() => {
          router.push(`/trip/${data.trip_id}`);
        }, 1000);
      } else {
        toast.error('Purchase completed but trip cloning failed');
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error('Purchase failed', {
        description: err instanceof Error ? err.message : 'Failed to purchase trip',
      });
      setIsProcessingPayment(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For free trips, show content
  if (!isPaid) {
    return <>{children}</>;
  }

  // For paid trips, show full trip structure with purchase banner and masked sections
  return (
    <>
      {/* Purchase Banner */}
      <div className="sticky top-16 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Premium Trip - Purchase Required</p>
                <p className="text-sm text-amber-100">Purchase to unlock full access and get your own copy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-white text-amber-600 font-bold text-lg px-3 py-1 shrink-0">
                ₹{parseFloat(price || '0').toLocaleString()}
              </Badge>
              {clonedTripId ? (
                <Button
                  onClick={() => router.push(`/trip/${clonedTripId}`)}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold shrink-0"
                  size="sm"
                >
                  View My Trip
                </Button>
              ) : firebaseUser ? (
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold shrink-0"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Now
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold shrink-0"
                  size="sm"
                >
                  Log In to Purchase
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Show full trip structure with masked sections */}
      {children}

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Purchase Trip
            </DialogTitle>
            <DialogDescription>
              Complete your purchase to unlock this premium trip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-xl font-bold text-foreground">
                    ₹{parseFloat(price || '0').toLocaleString()}
                  </span>
                </div>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-3">Mock Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card Number:</span>
                  <span className="font-mono">**** **** **** 4242</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry:</span>
                  <span>12/25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CVV:</span>
                  <span>***</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This is a mock payment. No actual charges will be made.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessingPayment}
              className="theme-bg theme-bg-hover text-primary-foreground"
            >
              {isProcessingPayment ? 'Processing...' : `Pay ₹${parseFloat(price || '0').toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

