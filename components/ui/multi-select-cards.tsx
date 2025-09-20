'use client';

import React, { useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface MultiSelectCardsProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  gridCols?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onAddCustom?: (value: string) => void;
}

interface MultiSelectCardProps {
  option: MultiSelectOption;
  isSelected: boolean;
  onToggle: (value: string) => void;
}

// Memoized individual card component to prevent unnecessary re-renders
const MultiSelectCard = React.memo<MultiSelectCardProps>(({ option, isSelected, onToggle }) => {
  // Use a ref to track if we're in the middle of handling a click
  const isHandlingClick = React.useRef(false);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent rapid successive clicks
    if (isHandlingClick.current) {
      return;
    }
    
    isHandlingClick.current = true;
    
    // Schedule the toggle and reset the flag
    requestAnimationFrame(() => {
      onToggle(option.value);
      // Reset after a short delay
      setTimeout(() => {
        isHandlingClick.current = false;
      }, 100);
    });
  }, [onToggle, option.value]);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={isSelected}
            readOnly
            className="pointer-events-none"
          />
          <div className="flex items-center space-x-2 flex-1">
            {option.icon && (
              <span className="text-primary flex-shrink-0">
                {typeof option.icon === 'string' ? (
                  <span className="text-sm">{option.icon}</span>
                ) : (
                  option.icon
                )}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate">{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground block truncate">
                  {option.description}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MultiSelectCard.displayName = 'MultiSelectCard';

// Main multi-select cards component
export const MultiSelectCards = React.memo<MultiSelectCardsProps>(({
  options,
  selectedValues,
  onChange,
  className = '',
  gridCols = 'grid-cols-2 md:grid-cols-3',
  allowCustom = false,
  customPlaceholder = 'Add custom option',
  onAddCustom,
}) => {
  const [customValue, setCustomValue] = React.useState('');

  // Memoize the toggle handler with simple debouncing
  const handleToggle = useCallback((value: string) => {
    const isSelected = selectedValues.includes(value);
    const newValues = isSelected 
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onChange(newValues);
  }, [selectedValues, onChange]);

  // Memoize the remove handler
  const handleRemove = useCallback((value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  }, [selectedValues, onChange]);

  // Memoize the add custom handler
  const handleAddCustom = useCallback(() => {
    const trimmedValue = customValue.trim();
    if (trimmedValue && !selectedValues.includes(trimmedValue)) {
      if (onAddCustom) {
        onAddCustom(trimmedValue);
      } else {
        onChange([...selectedValues, trimmedValue]);
      }
      setCustomValue('');
    }
  }, [customValue, selectedValues, onChange, onAddCustom]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  }, [handleAddCustom]);

  // Memoize selected tags to prevent unnecessary re-renders
  const selectedTags = useMemo(() => {
    return selectedValues.map((value) => {
      const option = options.find(opt => opt.value === value);
      return (
        <span
          key={value}
          className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
        >
          {option?.label || value}
          <X
            className="w-3 h-3 cursor-pointer hover:text-destructive"
            onClick={() => handleRemove(value)}
          />
        </span>
      );
    });
  }, [selectedValues, options, handleRemove]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Options Grid */}
      <div className={`grid ${gridCols} gap-3`}>
        {options.map((option) => (
          <MultiSelectCard
            key={option.value}
            option={option}
            isSelected={selectedValues.includes(option.value)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Custom Input */}
      {allowCustom && (
        <div className="flex space-x-2">
          <Input
            placeholder={customPlaceholder}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            type="button"
            onClick={handleAddCustom}
            disabled={!customValue.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Selected Tags */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags}
        </div>
      )}
    </div>
  );
});

MultiSelectCards.displayName = 'MultiSelectCards';

// Hook for easier form integration
export const useMultiSelectField = (
  fieldValue: string[] | undefined,
  onChange: (values: string[]) => void
) => {
  const values = useMemo(() => fieldValue || [], [fieldValue]);
  
  const handleChange = useCallback((newValues: string[]) => {
    onChange(newValues);
  }, [onChange]);

  return {
    selectedValues: values,
    onChange: handleChange,
  };
};
