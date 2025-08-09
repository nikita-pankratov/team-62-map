import React from 'react';
import { Star } from 'lucide-react';

interface RatingFilterProps {
  minRating: number;
  onRatingChange: (rating: number) => void;
  useRatingFilter: boolean;
  onUseRatingFilterChange: (use: boolean) => void;
  disabled?: boolean;
}

const RatingFilter: React.FC<RatingFilterProps> = ({ 
  minRating, 
  onRatingChange, 
  useRatingFilter,
  onUseRatingFilterChange,
  disabled = false 
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRatingChange(parseFloat(e.target.value));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUseRatingFilterChange(e.target.checked);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-yellow-500" />
        <label className="text-sm font-medium text-gray-700">Minimum Rating</label>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="useRatingFilter"
            checked={useRatingFilter}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label htmlFor="useRatingFilter" className="text-sm text-gray-700">
            Filter by rating
          </label>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 w-8">1.0</span>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={minRating}
            onChange={handleSliderChange}
            disabled={disabled || !useRatingFilter}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer rating-slider disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 w-8">5.0</span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {renderStars(Math.floor(minRating))}
          </div>
          <span className="text-sm font-medium text-yellow-600">
            {minRating.toFixed(1)} stars & up
          </span>
        </div>
      </div>
      
      <style>{`
        .rating-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #eab308;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .rating-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #eab308;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .rating-slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
        
        .rating-slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default RatingFilter;