"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type PublicTrip = {
  source_trip_id?: string;
  summary?: string;
  thumbnail_url?: string;
  title?: string;
  updated_at?: string;
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
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

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
  }, [buildUrl, nextCursor]); // Removed isLoading from dependencies

  useEffect(() => {
    // Only fetch on initial load, prevent duplicate calls from React StrictMode
    if (!hasInitialized && !isLoading) {
      setHasInitialized(true);
      fetchPage();
    }
  }, [fetchPage, hasInitialized, isLoading]);

  const gridCols = useMemo(() => "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", []);

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className={gridCols}>
        {trips.map((trip, idx) => (
          <Link href={`/explore/trip/${trip.source_trip_id}`} key={`${trip.source_trip_id}-${idx}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            {trip.thumbnail_url ? (
              <div className="w-full aspect-[4/3] bg-muted/40 overflow-hidden">
                {/* Using img to avoid external domain config for Next/Image */}
                <img
                  src={trip.thumbnail_url}
                  alt={trip.title || "Trip thumbnail"}
                  className="w-full h-full object-cover"
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
          </Card>
          </Link>
        ))}

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
    </div>
  );
}


