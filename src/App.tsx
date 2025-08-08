import React, { useState } from 'react';
import { MapPin, Globe } from 'lucide-react';
import ApiKeyInput from './components/ApiKeyInput';
import CitySearch from './components/CitySearch';
import BusinessSearch from './components/BusinessSearch';
import CollapsibleControls from './components/CollapsibleControls';
import GoogleMap from './components/GoogleMap';
import BusinessSidebar from './components/BusinessSidebar';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isSearchingBusinesses, setIsSearchingBusinesses] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(0.5);
  const [showCircles, setShowCircles] = useState<boolean>(true);
  const [minRating, setMinRating] = useState<number>(1.0);
  const [useRatingFilter, setUseRatingFilter] = useState<boolean>(false);
  const [businessCount, setBusinessCount] = useState<number>(20);
  const [businessSearchRadius, setBusinessSearchRadius] = useState<number>(5);

  const handleCitySelect = (lat: number, lng: number, cityName: string) => {
    setMapCenter({ lat, lng });
    setSelectedCity(cityName);
    // Clear business search when city changes
    setBusinessType('');
    setBusinesses([]);
  };

  const handleBusinessSearch = (businessType: string) => {
    setBusinessType(businessType);
    setBusinesses([]);
  };

  const handleSearchStart = () => {
    setIsSearchingBusinesses(true);
  };

  const handleSearchComplete = () => {
    setIsSearchingBusinesses(false);
  };

  const handleBusinessesFound = (foundBusinesses: any[]) => {
    setBusinesses(foundBusinesses);
  };


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with API Key Input */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-4 relative">
            <div className="absolute left-0 hidden md:block">
              <img 
                src="https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" 
                alt="Tortoise" 
                className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
              />
            </div>
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">
                <span className="text-green-600">Tortoise</span> 
                <span className="text-gray-400 mx-2">&gt;</span> 
                <span className="text-orange-500">Hare</span>
              </h1>
            </div>
            <div className="absolute right-0 hidden md:block">
              <img 
                src="https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" 
                alt="Hare" 
                className="w-12 h-12 rounded-full object-cover border-2 border-orange-300"
              />
            </div>
          </div>
          <ApiKeyInput onApiKeyChange={setApiKey} />
        </div>
      </div>

      {/* Search Controls */}
      {apiKey && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CitySearch onCitySelect={handleCitySelect} apiKey={apiKey} />
              <BusinessSearch 
                onBusinessSearch={handleBusinessSearch} 
                selectedCity={selectedCity}
                apiKey={apiKey} 
              />
            </div>
            
            {/* Collapsible Controls Section */}
            <div className="mt-4">
              <CollapsibleControls
                searchRadius={searchRadius}
                onSearchRadiusChange={setSearchRadius}
                showCircles={showCircles}
                onShowCirclesChange={setShowCircles}
                minRating={minRating}
                onRatingChange={setMinRating}
                useRatingFilter={useRatingFilter}
                onUseRatingFilterChange={setUseRatingFilter}
                businessCount={businessCount}
                onBusinessCountChange={setBusinessCount}
                businessSearchRadius={businessSearchRadius}
                onBusinessSearchRadiusChange={setBusinessSearchRadius}
                disabled={!apiKey}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Map Area */}
        <div className="flex-1 relative">
          {apiKey ? (
            <GoogleMap 
              apiKey={apiKey} 
              center={mapCenter || undefined}
              cityName={selectedCity || undefined}
              businessType={businessType || undefined}
              searchRadius={searchRadius}
              showCircles={showCircles}
              minRating={minRating}
              useRatingFilter={useRatingFilter}
              businessCount={businessCount}
              businessSearchRadius={businessSearchRadius}
              onBusinessesFound={handleBusinessesFound}
              onSearchStart={handleSearchStart}
              onSearchComplete={handleSearchComplete}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Ready for Your API Key</h3>
                <p className="text-gray-500">Enter your Google Maps API key above to load the interactive map</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Business Sidebar */}
        {apiKey && (
          <BusinessSidebar 
            businesses={businesses}
            isLoading={isSearchingBusinesses}
            selectedCity={selectedCity}
            businessType={businessType}
          />
        )}
      </div>
    </div>
  );
}

export default App;