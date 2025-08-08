import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import RadiusControl from './RadiusControl';
import RatingFilter from './RatingFilter';
import BusinessCountControl from './BusinessCountControl';

interface CollapsibleControlsProps {
  searchRadius: number;
  onSearchRadiusChange: (radius: number) => void;
  showCircles: boolean;
  onShowCirclesChange: (show: boolean) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  useRatingFilter: boolean;
  onUseRatingFilterChange: (use: boolean) => void;
  businessCount: number;
  onBusinessCountChange: (count: number) => void;
  businessSearchRadius: number;
  onBusinessSearchRadiusChange: (radius: number) => void;
  disabled?: boolean;
}

const CollapsibleControls: React.FC<CollapsibleControlsProps> = ({
  searchRadius,
  onSearchRadiusChange,
  showCircles,
  onShowCirclesChange,
  minRating,
  onRatingChange,
  useRatingFilter,
  onUseRatingFilterChange,
  businessCount,
  onBusinessCountChange,
  businessSearchRadius,
  onBusinessSearchRadiusChange,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-700">Advanced Search Options</span>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <div className="text-xs text-gray-500 hidden sm:block">
              {businessCount} businesses • {businessSearchRadius}mi radius • {useRatingFilter ? `${minRating}+ stars` : 'all ratings'}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RadiusControl 
              radius={searchRadius}
              onRadiusChange={onSearchRadiusChange}
              showCircles={showCircles}
              onShowCirclesChange={onShowCirclesChange}
              disabled={disabled}
            />
            <RatingFilter 
              minRating={minRating}
              onRatingChange={onRatingChange}
              useRatingFilter={useRatingFilter}
              onUseRatingFilterChange={onUseRatingFilterChange}
              disabled={disabled}
            />
            <BusinessCountControl 
              businessCount={businessCount}
              onBusinessCountChange={onBusinessCountChange}
              searchRadius={businessSearchRadius}
              onSearchRadiusChange={onBusinessSearchRadiusChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleControls;