"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import AutoCarousel from "@/components/AutoCarousel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Lock, DollarSign, CheckCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

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

type ApiResponse = {
  trips: PublicTrip[];
  nextCursor: string | null;
  hasMore: boolean;
};

type PublicTripsProps = {
  initialLimit?: number;
  orderBy?: "updated_at" | "created_at";
};

export default function PublicTrips({ initialLimit = 9, orderBy = "updated_at" }: PublicTripsProps) {
  const router = useRouter();
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const { firebaseUser } = useAppStore();
  const [purchasedTrips, setPurchasedTrips] = useState<Set<string>>(new Set());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<PublicTrip | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clonedTripId, setClonedTripId] = useState<string | null>(null);

  const buildUrl = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      params.set("limit", String(initialLimit));
      params.set("orderBy", orderBy);
      if (cursor) params.set("cursor", cursor);
      return `/api/public_trips?${params.toString()}`;
    },
    [initialLimit, orderBy]
  );

  const fetchPage = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(nextCursor ?? undefined));
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setTrips(prev => [...prev, ...(data.trips || [])]);
      setNextCursor(data.nextCursor);
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trips");
    } finally {
      setIsLoading(false);
      setIsFirstLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildUrl, nextCursor]); // Removed isLoading from dependencies

  useEffect(() => {
    // Only fetch on initial load, prevent duplicate calls from React StrictMode
    if (!hasInitialized && !isLoading) {
      setHasInitialized(true);
      fetchPage();
    }
  }, [fetchPage, hasInitialized, isLoading]);

  // Fetch purchased trips for logged-in users
  useEffect(() => {
    const fetchPurchasedTrips = async () => {
      if (!firebaseUser) {
        setPurchasedTrips(new Set());
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/public_trips/purchases', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPurchasedTrips(new Set(data.trip_ids || []));
        }
      } catch (e) {
        console.error('Failed to fetch purchased trips:', e);
      }
    };

    fetchPurchasedTrips();
  }, [firebaseUser]);

  const handlePurchaseClick = (e: React.MouseEvent, trip: PublicTrip) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firebaseUser) {
      alert('Please log in to purchase trips');
      return;
    }
    setSelectedTrip(trip);
    setPaymentModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedTrip || !firebaseUser || !selectedTrip.source_trip_id) return;

    setIsProcessingPayment(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/public_trips/${selectedTrip.source_trip_id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: selectedTrip.source_trip_id,
          price: selectedTrip.price,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Purchase failed' }));
        throw new Error(errorData.error || 'Purchase failed');
      }

      const data = await res.json();
      
      // Add to purchased trips
      setPurchasedTrips(prev => new Set([...prev, selectedTrip.source_trip_id!]));
      setPaymentModalOpen(false);
      
      // If trip was cloned, show success modal
      if (data.cloned && data.trip_id) {
        setClonedTripId(data.trip_id);
        setShowSuccessModal(true);
        setSelectedTrip(null);
      } else {
        setSelectedTrip(null);
        // Refresh to show unlocked trips
        window.location.reload();
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err instanceof Error ? err.message : 'Failed to purchase trip');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isTripPurchased = (trip: PublicTrip) => {
    if (!trip.is_paid || !trip.source_trip_id) return true; // Free trips are always "purchased"
    return purchasedTrips.has(trip.source_trip_id);
  };

  const gridCols = useMemo(() => "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", []);

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className={gridCols}>
        {trips.map((trip, idx) => {
          const isPaid = trip.is_paid ?? false;
          const isPurchased = isTripPurchased(trip);
          const canView = !isPaid || isPurchased;

          return (
            <div key={`${trip.source_trip_id}-${idx}`} className="relative">
              {canView ? (
                <Link href={`/explore/trip/${trip.source_trip_id}`}>
                  <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    isPaid 
                      ? 'border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10' 
                      : ''
                  }`}>
                    {isPaid && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                    {Array.isArray(trip.destination_photos) && trip.destination_photos.length > 0 ? (
                      <AutoCarousel images={trip.destination_photos} className="w-full aspect-[4/3]" />
                    ) : trip.thumbnail_url ? (
                      <div className="w-full aspect-[4/3] bg-muted/40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trip.thumbnail_url}
                          alt={trip.title || "Trip thumbnail"}
                          className="block w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] bg-muted/40" />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-tight">
                          {trip.title || "Untitled Trip"}
                        </CardTitle>
                        <div className="flex flex-col items-end gap-1">
                          {isPaid && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold">
                              ₹{trip.price ? parseFloat(trip.price).toLocaleString() : '0'}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {trip.updated_at ? new Date(trip.updated_at).toLocaleDateString() : "New"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {trip.summary || "No summary available."}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className="overflow-hidden relative border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/30 to-yellow-50/20 dark:from-amber-950/10 dark:to-yellow-950/5">
                  {/* Blurred/Masked Content */}
                  <div className="blur-sm pointer-events-none opacity-50">
                    {Array.isArray(trip.destination_photos) && trip.destination_photos.length > 0 ? (
                      <AutoCarousel images={trip.destination_photos} className="w-full aspect-[4/3]" />
                    ) : trip.thumbnail_url ? (
                      <div className="w-full aspect-[4/3] bg-muted/40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trip.thumbnail_url}
                          alt={trip.title || "Trip thumbnail"}
                          className="block w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] bg-muted/40" />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-tight">
                          {trip.title || "Untitled Trip"}
                        </CardTitle>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {trip.updated_at ? new Date(trip.updated_at).toLocaleDateString() : "New"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {trip.summary || "No summary available."}
                      </p>
                    </CardContent>
                  </div>
                  
                  {/* Premium Overlay with Lock Icon and Purchase Button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-md p-6 border-2 border-amber-200/50 dark:border-amber-800/50 rounded-lg">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full"></div>
                      <Lock className="w-16 h-16 text-amber-600 dark:text-amber-400 relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 text-center">{trip.title || "Premium Trip"}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                      Unlock this premium itinerary with full access to all details and planning resources.
                    </p>
                    <div className="mb-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-lg px-4 py-2 font-bold shadow-lg">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ₹{trip.price ? parseFloat(trip.price).toLocaleString() : '0'}
                      </Badge>
                    </div>
                    <Button
                      onClick={(e) => handlePurchaseClick(e, trip)}
                      className="theme-bg theme-bg-hover text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Purchase & Unlock
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          );
        })}

        {isLoading && (
          Array.from({ length: Math.max(3 - (trips.length % 3), 1) }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse">
              <div className="w-full aspect-[4/3] bg-muted/40" />
              <CardHeader>
                <div className="h-5 w-2/3 bg-muted/60 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted/60 rounded" />
                  <div className="h-3 w-5/6 bg-muted/60 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-center mt-8">
        {hasMore ? (
          <Button onClick={fetchPage} disabled={isLoading} variant="outline">
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        ) : !isFirstLoad && trips.length > 0 ? (
          <div className="text-sm text-muted-foreground">No more trips</div>
        ) : null}
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

          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-foreground mb-2">{selectedTrip.title || "Untitled Trip"}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-xl font-bold text-foreground">
                    ₹{selectedTrip.price ? parseFloat(selectedTrip.price).toLocaleString() : '0'}
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
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentModalOpen(false);
                setSelectedTrip(null);
              }}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessingPayment}
              className="theme-bg theme-bg-hover text-primary-foreground"
            >
              {isProcessingPayment ? 'Processing...' : `Pay ₹${selectedTrip?.price ? parseFloat(selectedTrip.price).toLocaleString() : '0'}`}
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
              Continue Browsing
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
    </div>
  );
}


