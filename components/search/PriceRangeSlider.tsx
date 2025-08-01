/**
 * Price Range Slider Component
 * 
 * High-performance dual-range slider for price filtering.
 * Optimized with RAF for smooth interactions and debounced updates.
 */

'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';

interface PriceRange {
  min: number;
  max: number;
}

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

const PriceRangeSlider = memo(function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 100,
  formatValue = (val) => `${val.toLocaleString('fr-FR')} F`,
  className = '',
  disabled = false
}: PriceRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const changeTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange to prevent excessive calls
  const debouncedOnChange = useCallback((range: PriceRange) => {
    clearTimeout(changeTimeoutRef.current);
    changeTimeoutRef.current = setTimeout(() => {
      onChange(range);
    }, 150);
  }, [onChange]);

  // Calculate percentage from value
  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  // Calculate value from percentage
  const getValueFromPercentage = useCallback((percentage: number) => {
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  // Get mouse/touch position relative to slider
  const getRelativePosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, 
      ((clientX - rect.left) / rect.width) * 100
    ));
    return percentage;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((
    type: 'min' | 'max', 
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(type);
    
    // Add global event listeners
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const percentage = getRelativePosition(clientX);
        const newValue = getValueFromPercentage(percentage);
        
        setLocalValue(prev => {
          const newRange = type === 'min' 
            ? { min: Math.min(newValue, prev.max), max: prev.max }
            : { min: prev.min, max: Math.max(newValue, prev.min) };
          
          debouncedOnChange(newRange);
          return newRange;
        });
      });
    };
    
    const handleEnd = () => {
      setIsDragging(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [disabled, getRelativePosition, getValueFromPercentage, debouncedOnChange]);

  // Handle input changes
  const handleInputChange = useCallback((type: 'min' | 'max', inputValue: string) => {
    const numValue = parseInt(inputValue) || (type === 'min' ? min : max);
    const clampedValue = Math.max(min, Math.min(max, numValue));
    
    const newRange = type === 'min'
      ? { min: Math.min(clampedValue, localValue.max), max: localValue.max }
      : { min: localValue.min, max: Math.max(clampedValue, localValue.min) };
    
    setLocalValue(newRange);
    debouncedOnChange(newRange);
  }, [min, max, localValue, debouncedOnChange]);

  // Calculate positions for visual elements
  const minPercentage = getPercentage(localValue.min);
  const maxPercentage = getPercentage(localValue.max);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Value Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Prix</span>
        <span className="text-sm text-gray-600">
          {formatValue(localValue.min)} - {formatValue(localValue.max)}
        </span>
      </div>

      {/* Slider Track */}
      <div 
        ref={sliderRef}
        className={`relative h-6 bg-gray-200 rounded-full cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          if (disabled || isDragging) return;
          
          const percentage = getRelativePosition(e.clientX);
          const newValue = getValueFromPercentage(percentage);
          
          // Determine which handle is closer
          const distanceToMin = Math.abs(newValue - localValue.min);
          const distanceToMax = Math.abs(newValue - localValue.max);
          
          const type = distanceToMin < distanceToMax ? 'min' : 'max';
          const newRange = type === 'min'
            ? { min: Math.min(newValue, localValue.max), max: localValue.max }
            : { min: localValue.min, max: Math.max(newValue, localValue.min) };
          
          setLocalValue(newRange);
          debouncedOnChange(newRange);
        }}
      >
        {/* Active Range */}
        <div
          className="absolute top-2 h-2 bg-blue-500 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
        
        {/* Min Handle */}
        <div
          className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-grab transform -translate-x-1/2 transition-all duration-150 ${
            isDragging === 'min' ? 'cursor-grabbing scale-110 shadow-lg' : 'hover:scale-105'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={(e) => handleDragStart('min', e)}
          onTouchStart={(e) => handleDragStart('min', e)}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className={`px-2 py-1 bg-gray-800 text-white text-xs rounded transition-opacity duration-150 ${
              isDragging === 'min' ? 'opacity-100' : 'opacity-0'
            }`}>
              {formatValue(localValue.min)}
            </div>
          </div>
        </div>
        
        {/* Max Handle */}
        <div
          className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-grab transform -translate-x-1/2 transition-all duration-150 ${
            isDragging === 'max' ? 'cursor-grabbing scale-110 shadow-lg' : 'hover:scale-105'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={(e) => handleDragStart('max', e)}
          onTouchStart={(e) => handleDragStart('max', e)}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className={`px-2 py-1 bg-gray-800 text-white text-xs rounded transition-opacity duration-150 ${
              isDragging === 'max' ? 'opacity-100' : 'opacity-0'
            }`}>
              {formatValue(localValue.max)}
            </div>
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Minimum</label>
          <input
            type="number"
            value={localValue.min}
            onChange={(e) => handleInputChange('min', e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>
        
        <div className="flex-shrink-0 text-gray-400">-</div>
        
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Maximum</label>
          <input
            type="number"
            value={localValue.max}
            onChange={(e) => handleInputChange('max', e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Moins de 1000', min: 0, max: 1000 },
          { label: '1000-5000', min: 1000, max: 5000 },
          { label: '5000-15000', min: 5000, max: 15000 },
          { label: 'Plus de 15000', min: 15000, max: max }
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              const newRange = { min: preset.min, max: preset.max };
              setLocalValue(newRange);
              debouncedOnChange(newRange);
            }}
            disabled={disabled}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default PriceRangeSlider;