import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';

interface CitySearchProps {
  onCitySelect: (lat: number, lng: number, cityName: string) => void;
  apiKey: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

const CitySearch: React.FC<CitySearchProps> = ({ onCitySelect, apiKey }) => {
  const [searchQuery, setSearchQuery] = useState('San Diego, CA, USA');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [error, setError] = useState('');
  const [isApiReady, setIsApiReady] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  // Check if Google Maps API is ready and dynamically load Places library
  useEffect(() => {
    const checkApiReady = async () => {
      if (!window.google?.maps) {
        // If not ready, check again in 100ms
        setTimeout(checkApiReady, 100);
        return;
      }
      
      try {
        // Dynamically import the Places library for the new API
        await window.google.maps.importLibrary("places");
        setIsApiReady(true);
      } catch (error) {
        console.error('Failed to load Places library:', error);
        setError('Failed to load Places API. Please try again.');
      }
    };

    if (apiKey) {
      checkApiReady();
    } else {
      setIsApiReady(false);
    }
  }, [apiKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    setError(''); // Clear any previous errors
    
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
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

    // Debounce the API call
    const timer = setTimeout(() => {
      performAutocomplete(value);
    }, 300);
    
    setDebounceTimer(timer);
  };

  const performAutocomplete = async (value: string) => {
    setIsLoadingPredictions(true);
    
    // Check if Google Maps API is loaded
    if (!isApiReady || !window.google?.maps?.places?.AutocompleteService) {
      console.error('Google Maps Places API not loaded');
      setIsLoadingPredictions(false);
      setError('Google Maps is still loading. Please wait...');
      return;
    }
    
    try {
      // Use AutocompleteService
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions({
        input: value,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' }
      }, (predictions, status) => {
        setIsLoadingPredictions(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const typedPredictions: PlacePrediction[] = predictions.slice(0, 8).map(p => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: p.structured_formatting
          }));
          setPredictions(typedPredictions); // Limit to 8 suggestions
          setShowDropdown(true);
          setError('');
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setPredictions([]);
          setShowDropdown(false);
          setError('');
        } else {
          console.error('Places service error:', status);
          setPredictions([]);
          setShowDropdown(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            setError('Too many requests. Please try again in a moment.');
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setError('API access denied. Please check your API key permissions.');
          } else {
            setError('Search temporarily unavailable. Please try again.');
          }
        }
      });
    } catch (err) {
      console.error('Autocomplete error:', err);
      setIsLoadingPredictions(false);
      setPredictions([]);
      setShowDropdown(false);
      setError('Search service error. Please try again.');
    }
  };

  const handlePredictionSelect = (prediction: PlacePrediction) => {
    setSearchQuery(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    
    // Automatically search for the selected city
    geocodeCity(prediction.description);
  };

  const geocodeCity = useCallback(async (cityName: string) => {
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
  }, [apiKey, onCitySelect]);

  // Auto-search for San Diego when API is ready (for testing)
  useEffect(() => {
    if (isApiReady && apiKey && !hasAutoSearched && searchQuery === 'San Diego, CA, USA') {
      setHasAutoSearched(true);
      geocodeCity(searchQuery);
    }
  }, [isApiReady, apiKey, hasAutoSearched, searchQuery, geocodeCity]);

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
      <div className="flex gap-2">
        <div className="flex-1 relative">
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
            placeholder={
              !apiKey 
                ? "API key required..."
                : !isApiReady 
                  ? "Loading Google Maps..." 
                  : "Enter city / county / region name (e.g., New York, Chicago County)"
            }
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
            disabled={isSearching || !apiKey || !isApiReady}
          />
          
          {/* Dropdown indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {isLoadingPredictions ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
            ) : predictions.length > 0 ? (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            ) : null}
          </div>
          
          {/* Predictions Dropdown */}
          {showDropdown && predictions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {predictions.map((prediction) => (
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
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || !apiKey || !isApiReady || !searchQuery.trim()}
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
      
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default CitySearch;