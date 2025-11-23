"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Lock, DollarSign, CheckCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

type PaidTripGateProps = {
  tripId: string;
  isPaid?: boolean;
  price?: string;
  children: React.ReactNode;
};

export default function PaidTripGate({ tripId, isPaid = false, price = '0', children }: PaidTripGateProps) {
  const router = useRouter();
  const { firebaseUser } = useAppStore();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clonedTripId, setClonedTripId] = useState<string | null>(null);

  useEffect(() => {
    const checkPurchase = async () => {
      if (!isPaid || !firebaseUser) {
        setHasPurchased(true); // Free trips or not logged in - show content
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/public_trips/purchases', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHasPurchased(data.trip_ids?.includes(tripId) ?? false);
        } else {
          setHasPurchased(false);
        }
      } catch (e) {
        console.error('Failed to check purchase status:', e);
        setHasPurchased(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPurchase();
  }, [tripId, isPaid, firebaseUser]);

  const handlePurchase = async () => {
    if (!firebaseUser) {
      alert('Please log in to purchase trips');
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
        throw new Error(errorData.error || 'Purchase failed');
      }

      const data = await res.json();
      setHasPurchased(true);
      setPaymentModalOpen(false);
      
      // If trip was cloned, show success modal with option to view cloned trip
      if (data.cloned && data.trip_id) {
        setClonedTripId(data.trip_id);
        setShowSuccessModal(true);
      } else {
        // Refresh to show unlocked content
        window.location.reload();
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err instanceof Error ? err.message : 'Failed to purchase trip');
    } finally {
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

  if (!isPaid || hasPurchased) {
    return <>{children}</>;
  }

  // For unpaid trips, show content with purchase banner
  return (
    <>
      {/* Purchase Banner */}
      <div className="sticky top-16 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5" />
              <div>
                <p className="font-semibold">Premium Trip - Purchase Required</p>
                <p className="text-sm text-amber-100">Unlock full access to all itinerary details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white text-amber-600 font-bold text-lg px-3 py-1">
                ₹{parseFloat(price || '0').toLocaleString()}
              </Badge>
              {firebaseUser ? (
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Now
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
                  size="sm"
                >
                  Log In to Purchase
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Show content with masked sections */}
      {children}

      {/* Original purchase screen (kept as fallback - hidden) */}
      <div className="hidden">
        <Card className="shadow-2xl border-0 max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Premium Trip</h2>
            <p className="text-muted-foreground mb-6">
              This is a paid trip. Purchase to unlock full access to the itinerary and details.
            </p>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 mb-6 text-lg px-4 py-2">
              <DollarSign className="w-4 h-4 mr-2" />
              ₹{parseFloat(price || '0').toLocaleString()}
            </Badge>
            <div className="space-y-3">
              {firebaseUser ? (
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full theme-bg theme-bg-hover text-primary-foreground"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Purchase Trip
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Please log in to purchase this trip</p>
                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="w-full theme-bg theme-bg-hover text-primary-foreground"
                    size="lg"
                  >
                    Log In
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Success Modal - Trip Cloned */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Trip Purchased & Cloned!
            </DialogTitle>
            <DialogDescription>
              Your trip has been purchased and cloned to your account. You are now the owner of this trip.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Payment processed successfully<br />
                ✓ Trip cloned to your account<br />
                ✓ You are now the owner
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                window.location.reload();
              }}
            >
              Continue Viewing
            </Button>
            {clonedTripId && (
              <Button
                onClick={() => {
                  router.push(`/trip/${clonedTripId}`);
                }}
                className="theme-bg theme-bg-hover text-primary-foreground"
              >
                View My Trip
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

