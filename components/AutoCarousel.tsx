"use client";

import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type AutoCarouselProps = {
  images: string[];
  className?: string; // size the container via height/aspect classes
  intervalMs?: number;
  showControls?: boolean;
  rounded?: string; // e.g., "rounded-xl"
  imgAlt?: string;
  imgLoading?: 'eager' | 'lazy';
};

export default function AutoCarousel({
  images,
  className,
  intervalMs = 3500,
  showControls = false,
  rounded = "",
  imgAlt = "Carousel image",
  imgLoading = 'lazy',
}: AutoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pausedRef = React.useRef(false);

  const start = React.useCallback(() => {
    if (timerRef.current || !api) return;
    timerRef.current = setInterval(() => {
      if (!api || pausedRef.current) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, Math.max(1500, intervalMs));
  }, [api, intervalMs]);

  const stop = React.useCallback(() => {
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
