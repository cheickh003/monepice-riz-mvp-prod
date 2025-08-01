/**
 * Virtualized Filter Options Component
 * 
 * High-performance virtualized list for large filter option sets.
 * Uses virtual scrolling to handle thousands of options efficiently.
 */

'use client';

import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
  selected?: boolean;
}

interface VirtualizedFilterOptionsProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  searchable?: boolean;
  multiSelect?: boolean;
  height?: number;
  itemHeight?: number;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

const VirtualizedFilterOptions = memo(function VirtualizedFilterOptions({
  options,
  selectedValues,
  onSelectionChange,
  searchable = true,
  multiSelect = true,
  height = 300,
  itemHeight = 40,
  placeholder = "Rechercher...",
  loading = false,
  className = ''
}: VirtualizedFilterOptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef<List>(null);

  // Memoized filtered options for performance
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, searchTerm]);

  // Handle selection change
  const handleSelectionChange = (optionId: string, isSelected: boolean) => {
    if (multiSelect) {
      const newSelection = isSelected
        ? [...selectedValues, optionId]
        : selectedValues.filter(id => id !== optionId);
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(isSelected ? [optionId] : []);
    }
  };

  // Scroll to selected items when they change
  useEffect(() => {
    if (selectedValues.length > 0 && listRef.current) {
      const selectedIndex = filteredOptions.findIndex(option => 
        selectedValues.includes(option.id)
      );
      if (selectedIndex >= 0) {
        listRef.current.scrollToItem(selectedIndex, 'smart');
      }
    }
  }, [selectedValues, filteredOptions]);

  if (loading) {
    return (
      <div className={`${className}`}>
        <VirtualizedSkeleton height={height} itemHeight={itemHeight} />
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Search Input */}
      {searchable && (
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {multiSelect && selectedValues.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              {selectedValues.length} élément{selectedValues.length > 1 ? 's' : ''} sélectionné{selectedValues.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Virtualized List */}
      {filteredOptions.length > 0 ? (
        <List
          ref={listRef}
          height={height}
          itemCount={filteredOptions.length}
          itemSize={itemHeight}
          itemData={{
            options: filteredOptions,
            selectedValues,
            onSelectionChange: handleSelectionChange,
            multiSelect
          }}
        >
          {VirtualizedFilterItem}
        </List>
      ) : (
        <div className="p-4 text-center text-gray-500">
          {searchTerm ? 'Aucun résultat trouvé' : 'Aucune option disponible'}
        </div>
      )}

      {/* Results Count */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-600">
          {filteredOptions.length} option{filteredOptions.length > 1 ? 's' : ''} affichée{filteredOptions.length > 1 ? 's' : ''}
          {searchTerm && ` (filtré${filteredOptions.length > 1 ? 's' : ''} sur ${options.length})`}
        </span>
      </div>
    </div>
  );
});

// Virtualized list item component
interface VirtualizedFilterItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    options: FilterOption[];
    selectedValues: string[];
    onSelectionChange: (optionId: string, isSelected: boolean) => void;
    multiSelect: boolean;
  };
}

const VirtualizedFilterItem = memo(function VirtualizedFilterItem({
  index,
  style,
  data
}: VirtualizedFilterItemProps) {
  const { options, selectedValues, onSelectionChange, multiSelect } = data;
  const option = options[index];
  const isSelected = selectedValues.includes(option.id);

  const handleChange = () => {
    onSelectionChange(option.id, !isSelected);
  };

  return (
    <div style={style} className="px-3 py-1">
      <label className="flex items-center space-x-3 py-2 px-2 rounded hover:bg-gray-50 cursor-pointer">
        <input
          type={multiSelect ? "checkbox" : "radio"}
          checked={isSelected}
          onChange={handleChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {option.label}
          </span>
          {option.count !== undefined && (
            <span className="ml-2 text-xs text-gray-500">
              ({option.count})
            </span>
          )}
        </div>
        {isSelected && (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
    </div>
  );
});

// Loading skeleton component
interface VirtualizedSkeletonProps {
  height: number;
  itemHeight: number;
}

const VirtualizedSkeleton = memo(function VirtualizedSkeleton({
  height,
  itemHeight
}: VirtualizedSkeletonProps) {
  const itemCount = Math.ceil(height / itemHeight);

  return (
    <div className="animate-pulse">
      {/* Search skeleton */}
      <div className="p-3 border-b border-gray-200">
        <div className="h-8 bg-gray-200 rounded-md"></div>
      </div>
      
      {/* Items skeleton */}
      <div className="space-y-1 p-3">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 py-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default VirtualizedFilterOptions;