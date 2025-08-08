import React, { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';

interface CitySearchProps {
  onCitySelect: (lat: number, lng: number, cityName: string) => void;
  apiKey: string;
}

const CitySearch: React.FC<CitySearchProps> = ({ onCitySelect, apiKey }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    
    if (!value.trim() || !apiKey) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingPredictions(true);
    
    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions({
        input: value,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' }
      }, (predictions, status) => {
        setIsLoadingPredictions(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 8)); // Limit to 8 suggestions
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      });
    } catch (err) {
      setIsLoadingPredictions(false);
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handlePredictionSelect = (prediction: any) => {
    setSearchQuery(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    
    // Automatically search for the selected city
    geocodeCity(prediction.description);
  };

  const geocodeCity = async (cityName: string) => {
    if (!apiKey) {
      setError('API key is required for search');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        { 
          address: cityName,
          componentRestrictions: { country: 'US' }
        },
        (results, status) => {
          setIsSearching(false);
          
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const cityName = results[0].formatted_address;
            
            onCitySelect(lat, lng, cityName);
            setError('');
          } else {
            setError('City not found. Please try a different search term.');
          }
        }
      );
    } catch (err) {
      setIsSearching(false);
      setError('Search failed. Please try again.');
      console.error('Geocoding error:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a city name');
      return;
    }

    setShowDropdown(false);
    geocodeCity(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-green-500" />
        <label className="text-sm font-medium text-gray-700">City / County / Region Search</label>
      </div>
      <div className="flex gap-2 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => {
            // Delay hiding dropdown to allow for clicks
            setTimeout(() => setShowDropdown(false), 150);
          }}
          placeholder="Enter city / county / region name (e.g., New York, Chicago County)"
          className="flex-1 px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
          disabled={isSearching || !apiKey}
        />
        
        {/* Dropdown indicator */}
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isLoadingPredictions ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
          ) : predictions.length > 0 ? (
            <ChevronDown className="h-3 w-3 text-gray-400" />
          ) : null}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || !apiKey || !searchQuery.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
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
      
      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionSelect(prediction)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none border-b border-gray-100 last:border-b-0 flex items-center gap-2"
            >
              <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="truncate">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default CitySearch;