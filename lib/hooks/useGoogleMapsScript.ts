import { useEffect, useState } from 'react';

// Extend Window interface to include Google Maps
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

interface UseGoogleMapsScriptOptions {
  libraries?: string[];
}

/**
 * Hook to dynamically load the Google Maps JavaScript API
 * @param options - Configuration options for loading the script
 * @returns Object containing loading state and any errors
 */
export const useGoogleMapsScript = (options: UseGoogleMapsScriptOptions = {}) => {
  const { libraries = ['places'] } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if the script is already loaded
    if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    // Check if script is currently loading
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.places?.Autocomplete) {
          setLoadError(new Error('Google Maps script loaded but Places API not available'));
        }
      }, 10000);

      return () => {
        clearInterval(checkLoaded);
        clearTimeout(timeout);
      };
    }

    // Fetch API key from our secure endpoint
    const loadScript = async () => {
      try {
        const response = await fetch('/api/maps/config');
        if (!response.ok) {
          throw new Error('Failed to fetch Google Maps API key');
        }
        
        const { apiKey } = await response.json();
        
        // Create and append script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(
          ','
        )}&loading=async`;
        script.async = true;
        script.defer = true;

        script.addEventListener('load', () => {
          // Poll until the API is fully ready
          const checkReady = setInterval(() => {
            if (window.google?.maps?.places?.Autocomplete) {
              setIsLoaded(true);
              clearInterval(checkReady);
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            if (!window.google?.maps?.places?.Autocomplete) {
              setLoadError(new Error('Google Maps loaded but Places API not ready'));
            }
          }, 5000);
        });

        script.addEventListener('error', () =>
          setLoadError(new Error('Failed to load Google Maps script'))
        );

        document.head.appendChild(script);
      } catch (error) {
        setLoadError(error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    loadScript();
  }, [libraries]);

  return { isLoaded, loadError };
};
