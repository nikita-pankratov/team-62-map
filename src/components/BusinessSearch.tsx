import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search, ChevronDown, X } from 'lucide-react';
import { 
  QUICK_LINK_CATEGORIES, 
  BUSINESS_CATEGORIES, 
  searchCategories, 
  type BusinessCategory 
} from '../utils/businessCategories';

interface BusinessSearchProps {
  onBusinessSearch: (businessType: string) => void;
  selectedCity: string;
  apiKey: string;
  currentMapCenter?: { lat: number; lng: number } | null;
  originalMapCenter?: { lat: number; lng: number } | null;
}

const BusinessSearch: React.FC<BusinessSearchProps> = ({ 
  onBusinessSearch, 
  selectedCity, 
  apiKey, 
  currentMapCenter, 
  originalMapCenter 
}) => {
  const [businessType, setBusinessType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<BusinessCategory[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if map has been moved from original position
  const isMapMoved = currentMapCenter && originalMapCenter && 
    (Math.abs(currentMapCenter.lat - originalMapCenter.lat) > 0.001 || 
     Math.abs(currentMapCenter.lng - originalMapCenter.lng) > 0.001);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowAllCategories(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input changes and search
  const handleInputChange = (value: string) => {
    setBusinessType(value);
    setSelectedCategory(null);
    
    if (value.trim()) {
      const results = searchCategories(value);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSearch = () => {
    const searchTerm = selectedCategory?.id || businessType.trim();
    
    if (!searchTerm) {
      setError('Please enter a business type or select a category');
      return;
    }

    if (!selectedCity && !isMapMoved) {
      setError('Please select a city first');
      return;
    }

    if (!apiKey) {
      setError('API key is required for business search');
      return;
    }

    setIsSearching(true);
    setError('');
    setShowDropdown(false);
    setShowAllCategories(false);
    onBusinessSearch(searchTerm);
    
    // Reset searching state after a delay
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  const handleCategorySelect = (category: BusinessCategory) => {
    setSelectedCategory(category);
    setBusinessType(category.name);
    setShowDropdown(false);
    setShowAllCategories(false);
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleQuickLinkClick = (category: BusinessCategory) => {
    setSelectedCategory(category);
    setBusinessType(category.name);
    setShowDropdown(false);
    setShowAllCategories(false);
    setSearchResults([]);
    
    // Auto-search for quick links
    if ((selectedCity || isMapMoved) && apiKey) {
      setIsSearching(true);
      setError('');
      onBusinessSearch(category.id);
      
      setTimeout(() => {
        setIsSearching(false);
      }, 2000);
    }
  };

  const clearSelection = () => {
    setSelectedCategory(null);
    setBusinessType('');
    setSearchResults([]);
    setShowDropdown(false);
    setShowAllCategories(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowAllCategories(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-purple-500" />
        <label className="text-sm font-medium text-gray-700">Business Search</label>
        {isMapMoved && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            📍 Using current map location
          </span>
        )}
      </div>

      {/* Quick Links */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {QUICK_LINK_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleQuickLinkClick(category)}
              disabled={isSearching || !apiKey || (!selectedCity && !isMapMoved)}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
              title={`Search for ${category.name}`}
            >
              {category.icon && <span>{category.icon}</span>}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={businessType}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => businessType.trim() && setShowDropdown(true)}
              placeholder="Search business categories or type manually..."
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
              disabled={isSearching || !apiKey || (!selectedCity && !isMapMoved)}
            />
            
            {selectedCategory && (
              <button
                onClick={clearSelection}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Browse all categories"
              style={{ right: selectedCategory ? '1.75rem' : '0.5rem' }}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || !apiKey || (!selectedCity && !isMapMoved) || (!businessType.trim() && !selectedCategory)}
            title={(!selectedCity && !isMapMoved) ? "Please search for a city first or move the map." : ""}
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

        {/* Dropdown with search results or all categories */}
        {(showDropdown || showAllCategories) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {showAllCategories ? (
              // Show all categories grouped
              <div className="p-2">
                {BUSINESS_CATEGORIES.map((group) => (
                  <div key={group.id} className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {group.name}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {group.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className="text-left px-2 py-1 text-xs hover:bg-purple-50 rounded transition-colors"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show search results
              <div className="py-1">
                {searchResults.length > 0 ? (
                  searchResults.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 transition-colors"
                    >
                      {category.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No categories found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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