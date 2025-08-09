import React, { useEffect, useRef } from 'react';
import { Building2, MapPin, Phone, Globe, Mail, Star, Database, AlertTriangle, Info, Users, DollarSign, Home, GraduationCap } from 'lucide-react';
import { type OverlapResult, formatDistance, formatArea } from '../utils/geographicUtils';
import { type DemographicsData, type DemographicsError, formatCurrency, formatNumber, formatPercent, isDemographicsError } from '../utils/demographicsUtils';

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
  demographics?: DemographicsData | DemographicsError;
  location?: { lat: number; lng: number };
}

interface BusinessSidebarProps {
  businesses: Business[];
  isLoading: boolean;
  selectedCity: string;
  businessType: string;
  overlaps?: OverlapResult[];
  selectedBusinessId?: string | null;
}

const BusinessSidebar: React.FC<BusinessSidebarProps> = ({ 
  businesses, 
  isLoading, 
  selectedCity, 
  businessType,
  overlaps = [],
  selectedBusinessId
}) => {
  const businessRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Scroll to selected business when selectedBusinessId changes
  useEffect(() => {
    if (selectedBusinessId && businessRefs.current[selectedBusinessId]) {
      const element = businessRefs.current[selectedBusinessId];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [selectedBusinessId]);

  const formatCategory = (types: string[]) => {
    if (!types || types.length === 0) return 'Business';
    return types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  const getBusinessOverlaps = (businessId: string) => {
    return overlaps.filter(overlap => 
      overlap.business1 === businessId || overlap.business2 === businessId
    );
  };

  const getOverlapPartnerName = (overlap: OverlapResult, currentBusinessId: string) => {
    const partnerId = overlap.business1 === currentBusinessId ? overlap.business2 : overlap.business1;
    const partner = businesses.find(b => b.place_id === partnerId);
    return partner?.name || 'Unknown Business';
  };

  const overlappingBusinessCount = new Set([
    ...overlaps.flatMap(overlap => [overlap.business1, overlap.business2])
  ]).size;

  const totalOverlaps = overlaps.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center mb-2">
          <Building2 className="h-6 w-6 text-purple-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Business Results</h2>
        </div>
        {selectedCity && businessType && (
          <p className="text-sm text-gray-600">
            Showing {businesses.length} {businessType} results in {selectedCity}
          </p>
        )}
        
        {/* Overlap Summary */}
        {businesses.length > 0 && totalOverlaps > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Coverage Overlaps Detected</h3>
            </div>
            <div className="text-xs text-red-700 space-y-1">
              <p>• {totalOverlaps} overlap{totalOverlaps > 1 ? 's' : ''} found</p>
              <p>• {overlappingBusinessCount} of {businesses.length} businesses affected</p>
              <p className="text-red-600 font-medium">⚠ Red markers show overlapping coverage areas</p>
            </div>
          </div>
        )}
        
        {businesses.length > 0 && totalOverlaps === 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-green-600 mr-2" />
              <p className="text-xs text-green-700 font-medium">✓ No overlapping coverage areas detected</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-600">Searching businesses...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative mx-auto mb-4 w-16 h-16">
              <img 
                src="https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop" 
                alt="Waiting tortoise" 
                className="w-16 h-16 rounded-full object-cover opacity-60"
              />
              <Building2 className="h-6 w-6 text-gray-400 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
            <p className="text-gray-500">
              {selectedCity && businessType 
                ? 'No businesses found - the tortoise is still searching...'
                : 'Ready to discover businesses - slow and steady!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((business, index) => {
              const businessOverlaps = getBusinessOverlaps(business.place_id);
              const hasOverlaps = businessOverlaps.length > 0;
              const isSelected = selectedBusinessId === business.place_id;
              
              return (
              <div 
                key={business.place_id || index} 
                ref={(el) => { businessRefs.current[business.place_id] = el; }}
                className={`rounded-lg p-4 border transition-all duration-300 hover:shadow-md ${
                  isSelected 
                    ? 'bg-blue-100 border-blue-400 shadow-lg ring-2 ring-blue-300' 
                    : hasOverlaps 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                      {business.name}
                    </h3>
                  </div>

                  {/* Category */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2 text-purple-500" />
                    <span>{formatCategory(business.types)}</span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{business.vicinity}</span>
                  </div>

                  {/* Phone */}
                  {business.formatted_phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-blue-500" />
                      <a 
                        href={`tel:${business.formatted_phone_number}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {business.formatted_phone_number}
                      </a>
                    </div>
                  )}

                  {/* Website */}
                  {business.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2 text-indigo-500" />
                      <a 
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 transition-colors truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {/* Email */}
                  {business.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-red-500" />
                      <a 
                        href={`mailto:${business.email}`}
                        className="hover:text-red-600 transition-colors"
                      >
                        {business.email}
                      </a>
                    </div>
                  )}

                  {/* Rating */}
                  {business.rating && (
                    <div className="flex items-center text-sm">
                      <div className="flex items-center mr-2">
                        {renderStars(business.rating)}
                      </div>
                      <span className="text-gray-600">
                        {business.rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                  )}

                  {/* Demographics */}
                  {business.location && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          Local Demographics
                        </span>
                      </div>
                      {!business.demographics ? (
                        <div className="flex items-center text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-2"></div>
                          Loading census data...
                        </div>
                      ) : isDemographicsError(business.demographics) ? (
                        <div className="text-xs text-red-600">
                          {business.demographics.error}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-gray-600">Pop:</span>
                            <span className="ml-1 font-medium">{formatNumber(business.demographics.population)}</span>
                          </div>
                          <div className="flex items-center">
                            <GraduationCap className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-gray-600">College:</span>
                            <span className="ml-1 font-medium">{formatPercent(business.demographics.collegePercent)}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-gray-600">Income:</span>
                            <span className="ml-1 font-medium text-xs">{formatCurrency(business.demographics.medianIncome)}</span>
                          </div>
                          <div className="flex items-center">
                            <Home className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-gray-600">Home:</span>
                            <span className="ml-1 font-medium text-xs">{formatCurrency(business.demographics.medianHomeValue)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Overlap Information */}
                  {hasOverlaps && (
                    <div className="bg-white border border-red-300 rounded-md p-3 space-y-2">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Coverage Overlap{businessOverlaps.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {businessOverlaps.map((overlap, overlapIndex) => (
                          <div key={overlapIndex} className="text-xs text-red-700">
                            <p className="font-medium">
                              → {getOverlapPartnerName(overlap, business.place_id)}
                            </p>
                            <div className="ml-3 text-red-600 space-y-0.5">
                              <p>Distance: {formatDistance(overlap.distance)}</p>
                              <p>Overlap area: {formatArea(overlap.overlapArea)}</p>
                              <p>Overlap: {overlap.overlapPercentage.toFixed(1)}% of smaller coverage</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Source */}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <Database className="h-3 w-3 mr-1" />
                    <span>Data source: Google</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSidebar;