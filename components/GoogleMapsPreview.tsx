'use client';

import React from 'react';

interface GoogleMapsPreviewProps {
  lat?: number;
  lng?: number;
  placeId?: string;
  name?: string;
  height?: number;
}

const GoogleMapsPreview: React.FC<GoogleMapsPreviewProps> = ({ lat, lng, placeId, name, height = 180 }) => {
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
    <div className="relative rounded-lg overflow-hidden border bg-muted/20">
      {mapSrc ? (
        <iframe
          title={name || 'Map preview'}
          loading="lazy"
          src={mapSrc}
          style={{ border: 0, width: '100%', height }}
          referrerPolicy="no-referrer-when-downgrade"
          aria-hidden="false"
        />
      ) : (
        <div className="p-4 text-sm text-muted-foreground" style={{ height }}>
          Map preview unavailable
        </div>
      )}
      {openHref && (
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-2 left-2 theme-bg theme-bg-hover text-primary-foreground text-xs px-3 py-1 rounded-md shadow-md"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
};

export default GoogleMapsPreview;


