import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface GoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  cityName?: string;
  businessType?: string;
  searchRadius?: number;
  showCircles?: boolean;
  minRating?: number;
  useRatingFilter?: boolean;
  businessCount?: number;
  businessSearchRadius?: number;
  onBusinessesFound?: (businesses: any[]) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  apiKey, 
  center, 
  cityName, 
  businessType, 
  searchRadius = 2.5, 
  showCircles = true,
  minRating = 1.0,
  useRatingFilter = false,
  businessCount = 20,
  businessSearchRadius = 5,
  onBusinessesFound,
  onSearchStart,
  onSearchComplete
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const businessMarkersRef = useRef<any[]>([]);
  const radiusCirclesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const demographicInfoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  // Geographic center of the United States
  const CENTER_US = {
    lat: 39.8283,
    lng: -98.5795
  };

  const mapCenter = center || CENTER_US;
  const displayName = cityName || 'Geographic Center of the United States';

  useEffect(() => {
    if (!apiKey) {
      setError('Please provide a valid Google Maps API key');
      return;
    }

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: center ? 10 : 4,
          center: mapCenter,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            }
          ]
        });

        // Add a marker at the specified location
        markerRef.current = new window.google.maps.Marker({
          position: mapCenter,
          map: mapInstanceRef.current,
          title: displayName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Create info window
        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 5px 0; color: #1f2937;">${displayName}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Latitude: ${mapCenter.lat.toFixed(4)}°<br>
                Longitude: ${mapCenter.lng.toFixed(4)}°
              </p>
            </div>
          `
        });

        // Add click listener to marker
        markerRef.current.addListener('click', () => {
          infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
        });

        // Add click listener to map for demographic data
        mapInstanceRef.current.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          showDemographicPopup(lat, lng, event.latLng);
        });

        setMapLoaded(true);
        setError('');
      } catch (err) {
        setError('Failed to initialize Google Maps');
        console.error('Map initialization error:', err);
      }
    };

    loadGoogleMapsScript(apiKey)
      .then(initializeMap)
      .catch((err) => {
        setError('Failed to load Google Maps. Please check your API key.');
        console.error('Script loading error:', err);
      });
  }, [apiKey, mapCenter.lat, mapCenter.lng, displayName, businessType]);

  // Update map when center changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && infoWindowRef.current) {
      // Update map center and zoom
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(center ? 10 : 4);
      
      // Update marker position
      markerRef.current.setPosition(mapCenter);
      markerRef.current.setTitle(displayName);
      
      // Update info window content
      infoWindowRef.current.setContent(`
        <div style="padding: 10px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 5px 0; color: #1f2937;">${displayName}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Latitude: ${mapCenter.lat.toFixed(4)}°<br>
            Longitude: ${mapCenter.lng.toFixed(4)}°
          </p>
        </div>
      `);
    }
  }, [mapCenter.lat, mapCenter.lng, displayName, center]);

  // Search for businesses when businessType changes
  useEffect(() => {
    if (mapInstanceRef.current && businessType && center) {
      searchBusinesses();
    }
  }, [businessType, center, searchRadius, showCircles, minRating, useRatingFilter, businessCount, businessSearchRadius]);

  const clearBusinessMarkers = () => {
    businessMarkersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    businessMarkersRef.current = [];
    
    // Clear all radius circles
    radiusCirclesRef.current.forEach(circle => {
      circle.setMap(null);
    });
    radiusCirclesRef.current = [];
  };

  const showDemographicPopup = async (lat: number, lng: number, position: any) => {
    // Close existing demographic popup
    if (demographicInfoWindowRef.current) {
      demographicInfoWindowRef.current.close();
    }

    // Create new info window with loading state
    demographicInfoWindowRef.current = new window.google.maps.InfoWindow({
      position: position,
      content: `
        <div style="padding: 15px; font-family: Arial, sans-serif; min-width: 250px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid #3B82F6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
            <h3 style="margin: 0; color: #1f2937;">Loading Demographics...</h3>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Fetching census data for this location
          </p>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `
    });

    demographicInfoWindowRef.current.open(mapInstanceRef.current);

    try {
      // Step 1: Get FIPS codes from lat/lon
      const geoResponse = await fetch(`https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`);
      
      if (!geoResponse.ok) {
        throw new Error(`FCC API error: ${geoResponse.status} ${geoResponse.statusText}`);
      }
      
      const geoText = await geoResponse.text();
      if (!geoText.trim()) {
        throw new Error('Empty response from FCC API');
      }
      
      let geoData;
      try {
        geoData = JSON.parse(geoText);
      } catch (parseError) {
        throw new Error('Invalid JSON response from FCC API');
      }
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found in census data');
      }

      const { state_fips, county_fips, block_fips } = geoData.results[0];
      const tract = block_fips.slice(0, 11); // SSCCCTTTTTT -> state(2)+county(3)+tract(6)
      
      // Step 2: Get ACS demographic data
      const YEAR = 2022; // ACS 2022 5-year estimates (latest stable)
      const vars = [
        "NAME",
        "B19013_001E", // Median household income
        "B01003_001E", // Total population
        "B15003_022E", // Bachelor's degree
        "B15003_023E", // Master's degree
        "B15003_024E", // Professional degree
        "B15003_025E", // Doctorate degree
        "B25077_001E", // Median home value
        "B08303_001E"  // Total commuters (for commute time base)
      ].join(",");
      
      const state = state_fips;
      const county = county_fips;
      const tract6 = tract.slice(5); // last 6 digits for tract
      
      const censusUrl = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${vars}&for=tract:${tract6}&in=state:${state}%20county:${county}`;
      const censusResponse = await fetch(censusUrl);
      
      if (!censusResponse.ok) {
        throw new Error(`Census API error: ${censusResponse.status} ${censusResponse.statusText}`);
      }
      
      const censusText = await censusResponse.text();
      if (!censusText.trim()) {
        throw new Error('Empty response from Census API');
      }
      
      let censusData;
      try {
        censusData = JSON.parse(censusText);
      } catch (parseError) {
        throw new Error('Invalid JSON response from Census API');
      }
      
      if (!censusData || censusData.length < 2) {
        throw new Error('No demographic data available for this location');
      }

      // Parse the data (first row is headers, second row is data)
      const headers = censusData[0];
      const data = censusData[1];
      const dataObj: any = {};
      headers.forEach((header: string, index: number) => {
        dataObj[header] = data[index];
      });

      // Calculate derived metrics
      const population = parseInt(dataObj.B01003_001E) || 0;
      const medianIncome = parseInt(dataObj.B19013_001E) || 0;
      const medianHomeValue = parseInt(dataObj.B25077_001E) || 0;
      
      // Calculate education percentages
      const bachelors = parseInt(dataObj.B15003_022E) || 0;
      const masters = parseInt(dataObj.B15003_023E) || 0;
      const professional = parseInt(dataObj.B15003_024E) || 0;
      const doctorate = parseInt(dataObj.B15003_025E) || 0;
      const collegeGrads = bachelors + masters + professional + doctorate;
      const collegePercent = population > 0 ? ((collegeGrads / population) * 100).toFixed(1) : '0';

      // Format numbers
      const formatCurrency = (num: number) => {
        if (num === 0) return 'N/A';
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          maximumFractionDigits: 0 
        }).format(num);
      };

      const formatNumber = (num: number) => {
        if (num === 0) return 'N/A';
        return new Intl.NumberFormat('en-US').format(num);
      };

      // Update info window with demographic data
      demographicInfoWindowRef.current.setContent(`
        <div style="padding: 15px; font-family: Arial, sans-serif; min-width: 280px; max-width: 350px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; border-bottom: 2px solid #3B82F6; padding-bottom: 5px;">
            📊 Demographics
          </h3>
          
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 500;">LOCATION</p>
            <p style="margin: 0; font-size: 13px; color: #374151;">${dataObj.NAME}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Population</p>
              <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 600;">${formatNumber(population)}</p>
            </div>
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">College Grads</p>
              <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 600;">${collegePercent}%</p>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 8px; border-radius: 4px;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #065f46; font-weight: 600; text-transform: uppercase;">Median Household Income</p>
              <p style="margin: 0; font-size: 16px; color: #065f46; font-weight: 700;">${formatCurrency(medianIncome)}</p>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px; border-radius: 4px;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #92400e; font-weight: 600; text-transform: uppercase;">Median Home Value</p>
              <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 700;">${formatCurrency(medianHomeValue)}</p>
            </div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <p style="margin: 0; font-size: 10px; color: #9ca3af; text-align: center;">
              📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
              Data: US Census ACS ${YEAR} 5-Year Estimates
            </p>
          </div>
        </div>
      `);

    } catch (error) {
      console.error('Error fetching demographic data:', error);
      demographicInfoWindowRef.current.setContent(`
        <div style="padding: 15px; font-family: Arial, sans-serif; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626;">❌ Error Loading Demographics</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Unable to fetch census data for this location. This might be a remote area or the census services may be temporarily unavailable.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </p>
        </div>
      `);
    }
  };

  const searchBusinesses = () => {
    if (!mapInstanceRef.current || !businessType || !center) return;

    // Notify parent that search is starting
    if (onSearchStart) {
      onSearchStart();
    }

    // Clear existing business markers
    clearBusinessMarkers();

    // Convert search radius miles to meters (1 mile = 1609.34 meters)
    const searchRadiusInMeters = businessSearchRadius * 1609.34;
    // Convert display radius miles to meters
    const radiusInMeters = searchRadius * 1609.34;

    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    
    const request = {
      location: new window.google.maps.LatLng(center.lat, center.lng),
      radius: searchRadiusInMeters,
      type: businessType.toLowerCase().replace(' ', '_'),
    };

    service.nearbySearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const businesses = results.slice(0, businessCount);
        
        // Get detailed information for each business
        const detailedBusinesses: any[] = [];
        let processedCount = 0;
        
        businesses.forEach((place: any, index: number) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapInstanceRef.current,
            title: place.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#8B5CF6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 5px 0; color: #1f2937;">${place.name}</h3>
            <div className="w-full h-full bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
              {/* Background decorative images */}
              <div className="absolute top-10 left-10 opacity-20">
                <img 
                  src="https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" 
                  alt="Tortoise" 
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-10 right-10 opacity-20">
                <img 
                  src="https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" 
                  alt="Hare" 
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
                  ${place.vicinity}<br>
                  Rating: ${place.rating ? place.rating + '/5' : 'N/A'}
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  <span className="text-green-600">Slow</span> and <span className="text-orange-500">Steady</span> Wins
                </h3>
                <p className="text-gray-500">Enter your Google Maps API key above to start discovering businesses</p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <img 
                      src="https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" 
                      alt="Tortoise" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>Methodical Search</span>
                  </div>
                  <div className="text-gray-300">vs</div>
                  <div className="flex items-center gap-2 text-sm text-orange-500">
                    <img 
                      src="https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" 
                      alt="Hare" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>Quick Results</span>
                  </div>
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          businessMarkersRef.current.push(marker);
          
          // Add individual radius circle around each business
          if (showCircles) {
            const businessCircle = new window.google.maps.Circle({
              strokeColor: '#F97316',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#F97316',
              fillOpacity: 0.15,
              map: mapInstanceRef.current,
              center: place.geometry.location,
              radius: radiusInMeters,
            });
            
            radiusCirclesRef.current.push(businessCircle);
          }
          
          // Get place details for additional information
          const detailsService = new window.google.maps.places.PlacesService(mapInstanceRef.current);
          detailsService.getDetails({
            placeId: place.place_id,
            fields: ['name', 'vicinity', 'formatted_phone_number', 'website', 'rating', 'types', 'price_level']
          }, (details: any, detailsStatus: any) => {
            processedCount++;
            
            if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && details) {
              detailedBusinesses.push({
                place_id: details.place_id || place.place_id,
                name: details.name || place.name,
                vicinity: details.vicinity || place.vicinity,
                rating: details.rating || place.rating,
                price_level: details.price_level || place.price_level,
                types: details.types || place.types || [],
                formatted_phone_number: details.formatted_phone_number,
                website: details.website
              });
            } else {
              // Fallback to basic place data
              detailedBusinesses.push({
                place_id: place.place_id,
                name: place.name,
                vicinity: place.vicinity,
                rating: place.rating,
                price_level: place.price_level,
                types: place.types || []
              });
            }
            
            // When all businesses are processed, send to parent
            if (processedCount === businesses.length && onBusinessesFound) {
              // Apply rating filter before sending to parent
              const filteredBusinesses = useRatingFilter 
                ? detailedBusinesses.filter(business => {
                    return !business.rating || business.rating >= minRating;
                  })
                : detailedBusinesses;
              onBusinessesFound(filteredBusinesses);
              
              // Notify parent that search is complete
              if (onSearchComplete) {
                onSearchComplete();
              }
            }
          });
        });
      } else {
        // No results found, still notify completion
        if (onBusinessesFound) {
          onBusinessesFound([]);
        }
        if (onSearchComplete) {
          onSearchComplete();
        }
      }
    });
  };

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden">
      {!mapLoaded && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default GoogleMap;