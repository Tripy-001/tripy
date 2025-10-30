"use client";

import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type AutoCarouselProps = {
  images: string[];
  className?: string; // size the container via height/aspect classes
  showControls?: boolean;
  rounded?: string; // e.g., "rounded-xl"
  imgAlt?: string;
  imgLoading?: 'eager' | 'lazy';
};

export default function AutoCarousel({
  images,
  className,
  showControls = false,
  rounded = "",
  imgAlt = "Carousel image",
  imgLoading = 'lazy',
}: AutoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const initialTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pausedRef = React.useRef(false);
  
  // Random interval between 5-7 seconds for slower, more natural scrolling
  const randomInterval = React.useRef<number>(
    5000 + Math.floor(Math.random() * 2000) // 5000-7000ms
  );
  
  // Add random initial offset to prevent all carousels from syncing
  const randomOffsetRef = React.useRef<number>(
    Math.floor(Math.random() * randomInterval.current)
  );

  const start = React.useCallback(() => {
    if (timerRef.current || !api) return;
    
    // Apply random initial delay to desync carousels
    initialTimerRef.current = setTimeout(() => {
      // Then start the regular interval with the random timing
      timerRef.current = setInterval(() => {
        if (!api || pausedRef.current) return;
        if (api.canScrollNext()) api.scrollNext();
        else api.scrollTo(0);
      }, randomInterval.current);
    }, randomOffsetRef.current);
  }, [api]);

  const stop = React.useCallback(() => {
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  if (!images || images.length === 0) {
    return <div className={cn("w-full bg-muted/40", rounded, className)} />;
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden", rounded, className)}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={() => { pausedRef.current = false; }}
    >
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="h-full">
        <CarouselContent className="h-full">
          {images.map((src, i) => (
            <CarouselItem key={`${src}-${i}`} className="h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={imgAlt} className="block w-full h-full object-cover" loading={imgLoading} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {showControls && (
          <>
            <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm border-none hover:bg-white" />
            <CarouselNext className="right-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm border-none hover:bg-white" />
          </>
        )}
      </Carousel>
    </div>
  );
}
