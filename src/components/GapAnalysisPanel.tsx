import React, { useState } from 'react';
import { Zap, Brain, TrendingUp, AlertCircle, CheckCircle, Loader, Users, DollarSign, Home, GraduationCap } from 'lucide-react';
import { type GapAnalysisResult, type RecommendedPoint } from '../utils/chatgptService';
import { formatCurrency, formatNumber, formatPercent, isDemographicsError } from '../utils/demographicsUtils';
import StrategyGuide from './StrategyGuide';

interface GapAnalysisPanelProps {
  onAnalyze: () => Promise<void>;
  isLoading: boolean;
  result: GapAnalysisResult | null;
  error: string | null;
  disabled: boolean;
  businessType: string;
  cityName: string;
  businessCount: number;
  selectedRecommendationId?: string | null;
}

const GapAnalysisPanel: React.FC<GapAnalysisPanelProps> = ({
  onAnalyze,
  isLoading,
  result,
  error,
  disabled,
  businessType,
  cityName,
  businessCount,
  selectedRecommendationId
}) => {
  const [internalSelectedRecommendation, setInternalSelectedRecommendation] = useState<string | null>(null);
  
  // Use external selectedRecommendationId if provided, otherwise use internal state
  const selectedRecommendation = selectedRecommendationId !== undefined ? selectedRecommendationId : internalSelectedRecommendation;

  const getTortoiseIcon = (level: number) => {
    if (level <= 30) return '🐇'; // Hare - High risk/reward
    if (level <= 70) return '⚖️'; // Balanced
    return '🐢'; // Tortoise - Low risk/steady
  };

  const getTortoiseLabel = (level: number) => {
    if (level <= 30) return 'Hare Strategy';
    if (level <= 70) return 'Balanced';
    return 'Tortoise Strategy';
  };

  const getTortoiseColor = (level: number) => {
    if (level <= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (level <= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const RecommendationCard = ({ recommendation }: { recommendation: RecommendedPoint }) => {
    const isSelected = selectedRecommendation === recommendation.id;
    
    return (
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => {
          // Only use internal state if no external control is provided
          if (selectedRecommendationId === undefined) {
            setInternalSelectedRecommendation(isSelected ? null : recommendation.id);
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getTortoiseIcon(recommendation.tortoiseLevel)}</span>
            <div>
              <h4 className="font-semibold text-gray-900">
                Location {recommendation.id.replace('rec_', '')}
              </h4>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTortoiseColor(recommendation.tortoiseLevel)}`}>
                {getTortoiseLabel(recommendation.tortoiseLevel)} ({recommendation.tortoiseLevel})
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Target Match:</span>
            <span className="font-medium">{recommendation.demographics.targetMatch}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Competition Level:</span>
            <span className="font-medium">{recommendation.demographics.competitionLevel}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Market Potential:</span>
            <span className="font-medium">{recommendation.demographics.marketPotential}%</span>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-3">{recommendation.reasoning}</p>

        {isSelected && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Coordinates:</span>
                <span className="ml-2">{recommendation.lat.toFixed(4)}, {recommendation.lng.toFixed(4)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Nearest Competitor:</span>
                <span className="ml-2">{recommendation.proximityAnalysis.nearestCompetitor.name} ({(recommendation.proximityAnalysis.nearestCompetitor.distance / 1609.34).toFixed(1)} miles)</span>
              </div>
              {recommendation.proximityAnalysis.supportingBusinesses.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Supporting Businesses:</span>
                  <span className="ml-2">{recommendation.proximityAnalysis.supportingBusinesses.join(', ')}</span>
                </div>
              )}
              
              {/* Real Demographics Section */}
              {recommendation.realDemographics && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Local Demographics
                    </span>
                  </div>
                  {isDemographicsError(recommendation.realDemographics) ? (
                    <div className="text-xs text-red-600">
                      {recommendation.realDemographics.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-gray-600">Pop:</span>
                        <span className="ml-1 font-medium">{formatNumber(recommendation.realDemographics.population)}</span>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-gray-600">College:</span>
                        <span className="ml-1 font-medium">{formatPercent(recommendation.realDemographics.collegePercent)}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-gray-600">Income:</span>
                        <span className="ml-1 font-medium text-xs">{formatCurrency(recommendation.realDemographics.medianIncome)}</span>
                      </div>
                      <div className="flex items-center">
                        <Home className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-gray-600">Home:</span>
                        <span className="ml-1 font-medium text-xs">{formatCurrency(recommendation.realDemographics.medianHomeValue)}</span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-600 mt-1">
                        <span className="font-medium">Area:</span> {recommendation.realDemographics.tractName}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Gap Analysis</h3>
              <p className="text-sm text-gray-600">
                Find optimal locations for {businessType} in {cityName}
              </p>
            </div>
          </div>
          
          <button
            onClick={onAnalyze}
            disabled={disabled || isLoading || businessCount === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              disabled || isLoading || businessCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Find Gaps</span>
              </>
            )}
          </button>
        </div>

        {businessCount === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Search for businesses first to enable gap analysis
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Strategy Guide - Always visible */}
        <StrategyGuide />
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Analyzing Market Gaps</h4>
            <p className="text-gray-600">ChatGPT is examining {businessCount} businesses and demographic data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Analysis Failed</h4>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && !error && (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Market Analysis</h4>
                <div className="ml-auto text-sm text-blue-700">
                  Confidence: {result.metadata.confidence}%
                </div>
              </div>
              <p className="text-blue-800 text-sm mb-3">{result.analysis.summary}</p>
              
              {result.analysis.keyFindings.length > 0 && (
                <div className="mb-3">
                  <h5 className="font-medium text-blue-900 text-sm mb-1">Key Findings:</h5>
                  <ul className="space-y-1">
                    {result.analysis.keyFindings.map((finding, index) => (
                      <li key={index} className="text-blue-700 text-sm flex items-start space-x-1">
                        <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.marketOpportunities.length > 0 && (
                <div>
                  <h5 className="font-medium text-blue-900 text-sm mb-1">Market Opportunities:</h5>
                  <ul className="space-y-1">
                    {result.analysis.marketOpportunities.map((opportunity, index) => (
                      <li key={index} className="text-blue-700 text-sm flex items-start space-x-1">
                        <TrendingUp className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Recommended Locations ({result.recommendations.length})
              </h4>
              <div className="space-y-3">
                {result.recommendations.map((recommendation) => (
                  <RecommendationCard 
                    key={recommendation.id} 
                    recommendation={recommendation} 
                  />
                ))}
              </div>
            </div>


          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && !error && (
          <div className="text-center py-8">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Ready for Analysis</h4>
            <p className="text-gray-500">
              Click "Find Gaps" to discover optimal locations for {businessType || 'businesses'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GapAnalysisPanel;
