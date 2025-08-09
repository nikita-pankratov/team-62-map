import React from 'react';
import { MapPin } from 'lucide-react';

interface RadiusControlProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  showCircles: boolean;
  onShowCirclesChange: (show: boolean) => void;
  disabled?: boolean;
}

const RadiusControl: React.FC<RadiusControlProps> = ({ 
  radius, 
  onRadiusChange, 
  showCircles, 
  onShowCirclesChange, 
  disabled = false 
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRadiusChange(parseFloat(e.target.value));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onShowCirclesChange(e.target.checked);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-orange-500" />
        <label className="text-sm font-medium text-gray-700">Business Radius</label>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="showCircles"
            checked={showCircles}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label htmlFor="showCircles" className="text-sm text-gray-700">
            Show radius circles
          </label>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 w-12">0.1 mi</span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={radius}
            onChange={handleSliderChange}
            disabled={disabled || !showCircles}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 w-12">5 mi</span>
        </div>
        
        <div className="text-center">
          <span className="text-sm font-medium text-orange-600">
            {radius} mile{radius !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default RadiusControl;