import React, { useState } from 'react';
import { Building2, Search } from 'lucide-react';

interface BusinessSearchProps {
  onBusinessSearch: (businessType: string) => void;
  selectedCity: string;
  apiKey: string;
}

const BusinessSearch: React.FC<BusinessSearchProps> = ({ onBusinessSearch, selectedCity, apiKey }) => {
  const [businessType, setBusinessType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Common business types for suggestions
  const businessSuggestions = [
    'restaurant',
    'gas_station',
    'hospital',
    'pharmacy',
    'bank',
    'grocery_store',
    'hotel',
    'shopping_mall',
    'gym',
    'coffee_shop'
  ];

  const handleSearch = () => {
    if (!businessType.trim()) {
      setError('Please enter a business type');
      return;
    }

    if (!selectedCity) {
      setError('Please select a city first');
      return;
    }

    if (!apiKey) {
      setError('API key is required for business search');
      return;
    }

    setIsSearching(true);
    setError('');
    onBusinessSearch(businessType.trim());
    
    // Reset searching state after a delay
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setBusinessType(suggestion.replace('_', ' '));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-purple-500" />
        <label className="text-sm font-medium text-gray-700">Business Search</label>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter business type (e.g., restaurant, hospital)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          disabled={isSearching || !apiKey || !selectedCity}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !apiKey || !selectedCity || !businessType.trim()}
          title={!selectedCity ? "Please search for a city first." : ""}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span className="hidden sm:inline">Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-3 w-3" />
              <span className="hidden sm:inline">Search</span>
            </>
          )}
        </button>
      </div>
      
      {/* Business Type Suggestions - Compact */}
      <div className="mt-2">
        <div className="flex flex-wrap gap-1">
          {businessSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              disabled={isSearching || !apiKey || !selectedCity}
            >
              {suggestion.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default BusinessSearch;