'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PlaceAutocompleteSelection {
  placeId: string;
  fullText: string;
  mainText: string;
  secondaryText?: string;
  types: string[];
  distanceMeters?: number;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceAutocompleteSelection) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  /**
   * Maps to Places API (New) `includedPrimaryTypes`.
   * Defaults support cities, states/provinces, and countries.
   */
  types?: string[];
  /**
   * Optional two-character country codes used to bias the suggestions.
   */
  regionCodes?: string[];
}

type Suggestion = PlaceAutocompleteSelection;

const DEFAULT_TYPES = ['locality', 'administrative_area_level_1', 'country'];
const FETCH_DEBOUNCE_MS = 250;

const normalizePrimaryType = (type: string) => {
  switch (type) {
    case '(cities)':
      return 'locality';
    case '(regions)':
      return 'administrative_area_level_1';
    case '(countries)':
      return 'country';
    default:
      return type;
  }
};

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

/**
 * Places API (New) powered autocomplete input with fully client-controlled UI.
 */
export const PlaceAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
  icon,
  types = DEFAULT_TYPES,
  regionCodes,
}: PlaceAutocompleteProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef<string>(createSessionToken());

  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const normalizedTypes = useMemo(() => {
    const mapped = types.map(normalizePrimaryType);
    return Array.from(new Set(mapped));
  }, [types]);

  // Ensure internal state stays in sync with external form state
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const resetSuggestions = () => {
    setSuggestions([]);
    setHighlightIndex(-1);
    setIsDropdownOpen(false);
  };

  const fetchSuggestions = (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);

    fetch('/api/maps/autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        sessionToken: sessionTokenRef.current,
        includedPrimaryTypes: normalizedTypes,
        includedRegionCodes: regionCodes,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.error ?? 'Failed to fetch suggestions');
        }

        return response.json() as Promise<{ suggestions?: Suggestion[] }>;
      })
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        const next = data.suggestions ?? [];
        setSuggestions(next);
        setIsDropdownOpen(next.length > 0);
        setHighlightIndex(next.length > 0 ? 0 : -1);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Autocomplete fetch error:', error);
        setFetchError(error instanceof Error ? error.message : 'Failed to fetch suggestions');
        resetSuggestions();
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
  };

  // Debounce network requests for smoother UX and lower API usage
  useEffect(() => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      resetSuggestions();
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => fetchSuggestions(trimmed), FETCH_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, normalizedTypes, regionCodes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onChange(nextValue);
  };

  const handleSuggestionSelect = React.useCallback((suggestion: Suggestion) => {
    setInputValue(suggestion.fullText);
    onChange(suggestion.fullText);
    onPlaceSelect?.(suggestion);
    resetSuggestions();
    sessionTokenRef.current = createSessionToken();
  }, [onChange, onPlaceSelect]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % suggestions.length);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      }
      case 'Enter': {
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          event.preventDefault();
          handleSuggestionSelect(suggestions[highlightIndex]);
        }
        break;
      }
      case 'Escape': {
        setIsDropdownOpen(false);
        break;
      }
      default:
        break;
    }
  };

  const formatDistance = (distanceMeters?: number) => {
    if (!distanceMeters || Number.isNaN(distanceMeters)) {
      return null;
    }

    if (distanceMeters >= 1000) {
      return `${(distanceMeters / 1000).toFixed(1)} km`;
    }

    return `${Math.round(distanceMeters)} m`;
  };

  const dropdownContent = useMemo(() => {
    if (fetchError) {
      return (
        <div className="px-3 py-2 text-sm text-destructive">
          {fetchError}
        </div>
      );
    }

    if (isLoading && suggestions.length === 0) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading suggestions...
        </div>
      );
    }

    if (suggestions.length === 0) {
      return (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No matches found. Try a different search.
        </div>
      );
    }

    return (
      <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.placeId}>
            <button
              type="button"
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                highlightIndex === index ? 'bg-muted' : 'hover:bg-muted'
              )}
              role="option"
              aria-selected={highlightIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightIndex(index)}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <span className="font-medium text-foreground">
                {suggestion.mainText}
              </span>
              {(suggestion.secondaryText || suggestion.distanceMeters) && (
                <span className="flex w-full items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate pr-2">
                    {suggestion.secondaryText}
                  </span>
                  <span>{formatDistance(suggestion.distanceMeters)}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  }, [fetchError, highlightIndex, isLoading, suggestions, handleSuggestionSelect]);

  return (
    <div ref={containerRef} className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}

      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={icon ? cn('pl-10', className) : className}
        autoComplete="off"
      />

      {(isLoading || fetchError) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <div className="h-4 w-4 text-destructive">!</div>
          )}
        </div>
      )}

      {isDropdownOpen && (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-lg">
          {dropdownContent}
        </div>
      )}
    </div>
  );
};
