'use client';

import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface GoogleMapsPreviewProps {
  lat?: number;
  lng?: number;
  placeId?: string;
  name?: string;
  ratio?: number;
  className?: string;
}

const GoogleMapsPreview: React.FC<GoogleMapsPreviewProps> = ({ lat, lng, placeId, name, ratio = 16 / 10, className }) => {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : undefined;

  const openHref = placeId
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
    : hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : undefined;

  return (
    <div className={`relative rounded-lg overflow-hidden border bg-muted/20 ${className || ''}`}>
      {mapSrc ? (
        <AspectRatio ratio={ratio}>
          <iframe
            title={name || 'Map preview'}
            loading="lazy"
            src={mapSrc}
            className="w-full h-full"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
            aria-hidden="false"
          />
        </AspectRatio>
      ) : (
        <AspectRatio ratio={ratio}>
          <div className="flex items-center justify-center h-full p-4 text-sm text-muted-foreground bg-muted/10">
            <span>Map preview unavailable</span>
          </div>
        </AspectRatio>
      )}
    </div>
  );
};

export default GoogleMapsPreview;


