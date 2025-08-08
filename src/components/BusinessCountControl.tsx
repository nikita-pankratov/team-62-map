import React from 'react';
import { Users } from 'lucide-react';

interface BusinessCountControlProps {
  businessCount: number;
  onBusinessCountChange: (count: number) => void;
  searchRadius: number;
  onSearchRadiusChange: (radius: number) => void;
  disabled?: boolean;
}

const BusinessCountControl: React.FC<BusinessCountControlProps> = ({ 
  businessCount, 
  onBusinessCountChange, 
  searchRadius,
  onSearchRadiusChange,
  disabled = false 
}) => {
  const handleCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onBusinessCountChange(parseInt(e.target.value));
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSearchRadiusChange(parseFloat(e.target.value));
  };

  const businessCountOptions = [5, 10, 15, 20, 25, 30, 40, 50];
  const searchRadiusOptions = [1, 2, 3, 5, 8, 10, 15, 20];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-blue-500" />
        <label className="text-sm font-medium text-gray-700">Search Parameters</label>
      </div>
      
      <div className="space-y-3">
        {/* Business Count */}
        <div>
          <label htmlFor="businessCount" className="block text-xs text-gray-600 mb-1">
            Number of businesses to find:
          </label>
          <select
            id="businessCount"
            value={businessCount}
            onChange={handleCountChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {businessCountOptions.map(count => (
              <option key={count} value={count}>
                {count} businesses
              </option>
            ))}
          </select>
        </div>

        {/* Search Radius */}
        <div>
          <label htmlFor="searchRadius" className="block text-xs text-gray-600 mb-1">
            Search area radius:
          </label>
          <select
            id="searchRadius"
            value={searchRadius}
            onChange={handleRadiusChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {searchRadiusOptions.map(radius => (
              <option key={radius} value={radius}>
                {radius} mile{radius !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-500 bg-blue-50 rounded-md p-2">
          <p className="mb-1">
            <strong>Search Area:</strong> {searchRadius} mile{searchRadius !== 1 ? 's' : ''} from city center
          </p>
          <p>
            <strong>Results:</strong> Up to {businessCount} businesses
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessCountControl;