import React, { useState } from 'react';
import { Brain, Building2 } from 'lucide-react';
import BusinessSidebar from './BusinessSidebar';
import GapAnalysisPanel from './GapAnalysisPanel';
import StrategyGuide from './StrategyGuide';
import { type OverlapResult } from '../utils/geographicUtils';
import { type GapAnalysisResult } from '../utils/chatgptService';

interface Business {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  formatted_phone_number?: string;
  website?: string;
  email?: string;
  demographics?: any;
  location?: { lat: number; lng: number };
}

interface TabbedSidebarProps {
  // Business Sidebar Props
  businesses: Business[];
  isSearchingBusinesses: boolean;
  selectedCity: string;
  businessType: string;
  overlaps: OverlapResult[];
  selectedBusinessId: string | null;
  
  // Gap Analysis Props
  onGapAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  gapAnalysisResult: GapAnalysisResult | null;
  analysisError: string | null;
  chatGPTKey: string;
  businessCount: number;
  
  // Tab Control Props
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  selectedRecommendationId?: string | null;
}

type TabType = 'analysis' | 'businesses';

const TabbedSidebar: React.FC<TabbedSidebarProps> = ({
  businesses,
  isSearchingBusinesses,
  selectedCity,
  businessType,
  overlaps,
  selectedBusinessId,
  onGapAnalysis,
  isAnalyzing,
  gapAnalysisResult,
  analysisError,
  chatGPTKey,
  businessCount,
  activeTab: externalActiveTab,
  onTabChange,
  selectedRecommendationId,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('analysis');
  
  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  
  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const tabConfig = [
    {
      id: 'analysis' as TabType,
      label: 'AI Analysis',
      icon: Brain,
      count: gapAnalysisResult?.recommendations?.length || 0,
      available: !!chatGPTKey,
    },
    {
      id: 'businesses' as TabType,
      label: 'Business List',
      icon: Building2,
      count: businesses.length,
      available: true,
    },
  ];

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Tab Headers */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {tabConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = !tab.available;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabChange(tab.id)}
                disabled={isDisabled}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : isDisabled
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : isDisabled ? 'text-gray-400' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : isDisabled
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'analysis' && chatGPTKey && (
          <div className="h-full overflow-auto">
            <div className="p-4">
              <GapAnalysisPanel
                onAnalyze={onGapAnalysis}
                isLoading={isAnalyzing}
                result={gapAnalysisResult}
                error={analysisError}
                disabled={!businessType || !selectedCity || businesses.length === 0}
                businessType={businessType}
                cityName={selectedCity}
                businessCount={businessCount}
                selectedRecommendationId={selectedRecommendationId}
              />
            </div>
          </div>
        )}

        {activeTab === 'analysis' && !chatGPTKey && (
          <div className="h-full overflow-auto">
            <div className="p-4">
              <StrategyGuide />
              <div className="text-center py-8">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">ChatGPT Key Required</h3>
                <p className="text-gray-500 text-sm">
                  Enter your ChatGPT API key above to enable AI gap analysis
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="h-full">
            <BusinessSidebar
              businesses={businesses}
              isLoading={isSearchingBusinesses}
              selectedCity={selectedCity}
              businessType={businessType}
              overlaps={overlaps}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedSidebar;
