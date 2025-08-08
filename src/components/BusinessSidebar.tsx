import React from 'react';
import { Building2, MapPin, Phone, Globe, Mail, Star, Database } from 'lucide-react';

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
}

interface BusinessSidebarProps {
  businesses: Business[];
  isLoading: boolean;
  selectedCity: string;
  businessType: string;
}

const BusinessSidebar: React.FC<BusinessSidebarProps> = ({ 
  businesses, 
  isLoading, 
  selectedCity, 
  businessType 
}) => {
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
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
            {businesses.map((business, index) => (
              <div key={business.place_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
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

                  {/* Data Source */}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <Database className="h-3 w-3 mr-1" />
                    <span>Data source: Google</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSidebar;