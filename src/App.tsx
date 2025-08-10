import { useState, useEffect } from 'react';
import CitySearch from './components/CitySearch';
import BusinessSearch from './components/BusinessSearch';
import CollapsibleControls from './components/CollapsibleControls';
import GoogleMap from './components/GoogleMap';
import TabbedSidebar from './components/TabbedSidebar';
import { AuthModal } from './components/auth/AuthModal';
import { FloatingNavigation } from './components/FloatingNavigation';
import { SettingsModal } from './components/SettingsModal';
import { type OverlapResult } from './utils/geographicUtils';
import { type DemographicsData, type DemographicsError } from './utils/demographicsUtils';
import { createChatGPTService, type GapAnalysisResult, type AnalysisInput } from './utils/chatgptService';
import { MapScreenshotService } from './utils/mapScreenshotService';
import { getGoogleMapsApiKey, getChatGPTApiKey, logEnvironmentStatus } from './utils/env';

interface Business {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  formatted_phone_number?: string;
  website?: string;
  demographics?: DemographicsData | DemographicsError;
  location?: { lat: number; lng: number };
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState(getGoogleMapsApiKey());
  const [chatGPTKey, setChatGPTKey] = useState(getChatGPTApiKey());
  // Set default center to US center
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>({
    lat: 39.8283,
    lng: -98.5795
  });
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('');
  const [searchTrigger, setSearchTrigger] = useState<number>(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSearchingBusinesses, setIsSearchingBusinesses] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(0.5);
  const [showCircles, setShowCircles] = useState<boolean>(true);
  const [minRating, setMinRating] = useState<number>(1.0);
  const [useRatingFilter, setUseRatingFilter] = useState<boolean>(false);
  const [businessCount, setBusinessCount] = useState<number>(20);
  const [businessSearchRadius, setBusinessSearchRadius] = useState<number>(5);
  const [overlaps, setOverlaps] = useState<OverlapResult[]>([]);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  
  // Gap Analysis State
  const [gapAnalysisResult, setGapAnalysisResult] = useState<GapAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Sidebar State
  const [activeTab, setActiveTab] = useState<'analysis' | 'businesses'>('analysis');
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);

  const [mapInstanceRef, setMapInstanceRef] = useState<google.maps.Map | null>(null);

  // Log environment status in development
  useEffect(() => {
    logEnvironmentStatus();
  }, []);

  // Load ChatGPT key from localStorage if not set in environment
  useEffect(() => {
    const envChatGPTKey = getChatGPTApiKey();
    if (!envChatGPTKey) {
      const savedChatGPTKey = localStorage.getItem('chatGPTApiKey');
      if (savedChatGPTKey) {
        setChatGPTKey(savedChatGPTKey);
      }
    }
  }, []);

  const handleCitySelect = (lat: number, lng: number, cityName: string) => {
    setMapCenter({ lat, lng });
    setSelectedCity(cityName);
    // Clear business search when city changes
    setBusinessType('');
    setBusinesses([]);
    setOverlaps([]);
  };

  const handleBusinessSearch = (businessType: string) => {
    setBusinessType(businessType);
    setBusinesses([]);
    setOverlaps([]);
    setSelectedBusinessId(null); // Clear selection when searching new businesses
    
    // Increment search trigger to force re-search even with same business type
    setSearchTrigger(prev => prev + 1);
    
    // Ensure business count doesn't exceed API limit
    if (businessCount > 20) {
      setBusinessCount(20);
    }
  };

  const handleSearchStart = () => {
    setIsSearchingBusinesses(true);
  };

  const handleSearchComplete = () => {
    setIsSearchingBusinesses(false);
  };

  const handleBusinessesFound = (foundBusinesses: Business[]) => {
    setBusinesses(foundBusinesses);
  };

  const handleOverlapsDetected = (detectedOverlaps: OverlapResult[]) => {
    setOverlaps(detectedOverlaps);
  };

  const handleBusinessCountChange = (count: number) => {
    // Ensure we don't exceed Google API limit of 20
    const validatedCount = Math.min(count, 20);
    setBusinessCount(validatedCount);
  };

  const handleMapCenterChanged = (newCenter: { lat: number; lng: number }) => {
    setCurrentMapCenter(newCenter);
  };

  const handleBusinessSelect = (businessId: string) => {
    setSelectedBusinessId(businessId);
  };

  const handleHeatmapToggle = (enabled: boolean) => {
    setShowHeatmap(enabled);
  };

  const handleGapAnalysis = async () => {
    if (!chatGPTKey || !mapInstanceRef || !businessType || !currentMapCenter) {
      setAnalysisError('Missing required data for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Capture map screenshot
      const mapScreenshot = await MapScreenshotService.captureMapView(mapInstanceRef, {
        width: 800,
        height: 600,
        format: 'png'
      });

      // Prepare analysis input
      const analysisInput: AnalysisInput = {
        businesses: businesses,
        searchArea: {
          center: currentMapCenter,
          radius: businessSearchRadius * 1609.34, // Convert miles to meters
          cityName: selectedCity
        },
        mapScreenshot: mapScreenshot,
        businessType: businessType,
        searchRadius: searchRadius,
        filters: {
          minRating: minRating,
          useRatingFilter: useRatingFilter
        }
      };

      // Call ChatGPT service
      const chatGPTService = createChatGPTService(chatGPTKey);
      const result = await chatGPTService.analyzeBusinessGaps(analysisInput);

      setGapAnalysisResult(result);
      setAnalysisError(null);
    } catch (error) {
      console.error('Gap analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze business gaps');
      setGapAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecommendationSelect = (recommendationId: string) => {
    // Switch to analysis tab and select the recommendation
    setActiveTab('analysis');
    setSelectedRecommendationId(recommendationId);
    console.log('Recommendation selected:', recommendationId);
  };

  const handleTabChange = (tab: 'analysis' | 'businesses') => {
    setActiveTab(tab);
  };

  const handleMapInstanceReady = (mapInstance: google.maps.Map) => {
    setMapInstanceRef(mapInstance);
  };


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Navigation */}
      <FloatingNavigation 
        onShowAuth={() => setShowAuthModal(true)}
        onShowSettings={() => setShowSettingsModal(true)}
      />

      {/* Search Controls */}
      {apiKey && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CitySearch onCitySelect={handleCitySelect} apiKey={apiKey} />
              <BusinessSearch 
                onBusinessSearch={handleBusinessSearch} 
                selectedCity={selectedCity}
                apiKey={apiKey}
                currentMapCenter={currentMapCenter}
                originalMapCenter={mapCenter}
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
                onBusinessCountChange={handleBusinessCountChange}
                businessSearchRadius={businessSearchRadius}
                onBusinessSearchRadiusChange={setBusinessSearchRadius}
                disabled={!apiKey}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Map Area */}
        <div className="flex-1 relative">
          <GoogleMap 
            apiKey={apiKey || ''} 
            center={mapCenter || undefined}
            cityName={selectedCity || undefined}
            businessType={businessType || undefined}
            searchTrigger={searchTrigger}
            searchRadius={searchRadius}
            showCircles={showCircles}
            minRating={minRating}
            useRatingFilter={useRatingFilter}
            businessCount={businessCount}
            businessSearchRadius={businessSearchRadius}
            showHeatmap={showHeatmap}
            recommendations={gapAnalysisResult?.recommendations || []}
            onBusinessesFound={handleBusinessesFound}
            onSearchStart={handleSearchStart}
            onSearchComplete={handleSearchComplete}
            onOverlapsDetected={handleOverlapsDetected}
            onMapCenterChanged={handleMapCenterChanged}
            onBusinessSelect={handleBusinessSelect}
            onHeatmapToggle={handleHeatmapToggle}
            onRecommendationSelect={handleRecommendationSelect}
            onMapInstanceReady={handleMapInstanceReady}
          />
        </div>
        
        {/* Tabbed Sidebar */}
        {apiKey && (
          <TabbedSidebar
            businesses={businesses}
            isSearchingBusinesses={isSearchingBusinesses}
            selectedCity={selectedCity}
            businessType={businessType}
            overlaps={overlaps}
            selectedBusinessId={selectedBusinessId}
            onGapAnalysis={handleGapAnalysis}
            isAnalyzing={isAnalyzing}
            gapAnalysisResult={gapAnalysisResult}
            analysisError={analysisError}
            chatGPTKey={chatGPTKey}
            businessCount={businesses.length}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            selectedRecommendationId={selectedRecommendationId}
          />
        )}
      </div>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onApiKeyChange={setApiKey}
        onChatGPTKeyChange={setChatGPTKey}
        currentApiKey={apiKey}
        currentChatGPTKey={chatGPTKey}
      />
    </div>
  );
}

export default App;