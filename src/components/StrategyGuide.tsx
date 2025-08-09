import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StrategyGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-gray-200 rounded-lg mb-3 shadow-sm">
      {/* Header - Always visible */}
      <div 
        className="p-3 cursor-pointer hover:bg-gradient-to-br hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-colors duration-200 rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800">Strategy Guide</h3>
            <p className="text-xs text-gray-600">Choose your investment approach based on risk tolerance</p>
            
            {/* Preview icons when collapsed */}
            {!isExpanded && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🐇</span>
                  <span className="text-xs text-orange-600 font-medium">0-30</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">⚖️</span>
                  <span className="text-xs text-yellow-600 font-medium">31-70</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🐢</span>
                  <span className="text-xs text-green-600 font-medium">71-100</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 ml-4">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 overflow-y-auto max-h-72" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>

      <div className="space-y-2">
        {/* Hare Strategy */}
        <div className="group relative">
                    <div className="bg-white rounded-lg border-2 border-orange-200 p-3 transition-all duration-300 hover:border-orange-300 hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                🐇
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-orange-700 text-base">Hare Strategy</h4>
                    <div className="text-orange-600 font-semibold text-xs">(0-30)</div>
                  </div>
                </div>
              </div>
            </div>
             <div className="text-gray-700 font-medium text-xs pt-1">High risk, high reward</div>
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute transform px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            High competition, untested markets
          </div>
        </div>

                {/* Balanced Strategy */}
        <div className="group relative">
          <div className="bg-white rounded-lg border-2 border-yellow-200 p-3 transition-all duration-300 hover:border-yellow-300 hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                ⚖️
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-yellow-700 text-base">Balanced</h4>
                    <div className="text-yellow-600 font-semibold text-xs">(31-70)</div>
                  </div>
                </div>
              </div>
            </div>
               <div className="text-gray-700 font-medium text-xs pt-1">Moderate risk, moderate reward</div>
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute transform px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            Balanced approach with steady growth
          </div>
        </div>

                {/* Tortoise Strategy */}
        <div className="group relative">
          <div className="bg-white rounded-lg border-2 border-green-200 p-3 transition-all duration-300 hover:border-green-300 hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                🐢
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-green-700 text-base">Tortoise Strategy</h4>
                    <div className="text-green-600 font-semibold text-xs">(71-100)</div>
                  </div>
                </div>
              </div>
            </div>
               <div className="text-gray-700 font-medium text-xs pt-1">Low risk, steady growth</div>
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute transform px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            Proven markets with stable returns
          </div>
        </div>
      </div>

          {/* Additional context */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>High volatility</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Moderate volatility</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Low volatility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyGuide;
