import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';
import { 
  findOverlappingBusinesses, 
  formatDistance,
  type BusinessWithLocation,
  type OverlapResult
} from '../utils/geographicUtils';
import { fetchDemographics, type DemographicsData, type DemographicsError } from '../utils/demographicsUtils';
import { type RecommendedPoint } from '../utils/chatgptService';
import { mapBusinessTypeToPlacesType } from '../utils/businessCategories';

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

interface GoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  cityName?: string;
  businessType?: string;
  searchTrigger?: number;
  searchRadius?: number;
  showCircles?: boolean;
  minRating?: number;
  useRatingFilter?: boolean;
  businessCount?: number;
  businessSearchRadius?: number;
  showHeatmap?: boolean;
  recommendations?: RecommendedPoint[];
  onBusinessesFound?: (businesses: Business[]) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
  onOverlapsDetected?: (overlaps: OverlapResult[]) => void;
  onMapCenterChanged?: (center: { lat: number; lng: number }) => void;
  onBusinessSelect?: (businessId: string) => void;
  onHeatmapToggle?: (enabled: boolean) => void;
  onRecommendationSelect?: (recommendationId: string) => void;
  onMapInstanceReady?: (mapInstance: google.maps.Map) => void;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}



const GoogleMap: React.FC<GoogleMapProps> = ({ 
  apiKey, 
  center, 
  cityName, 
  businessType,
  searchTrigger = 0,
  searchRadius = 2.5, 
  showCircles = true,
  minRating = 1.0,
  useRatingFilter = false,
  businessCount = 20,
  businessSearchRadius = 5,
  showHeatmap = false,
  recommendations = [],
  onBusinessesFound,
  onSearchStart,
  onSearchComplete,
  onOverlapsDetected,
  onMapCenterChanged,
  onBusinessSelect,
  onHeatmapToggle,
  onRecommendationSelect,
  onMapInstanceReady
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null);
  const businessMarkersRef = useRef<(google.maps.Marker | google.maps.marker.AdvancedMarkerElement)[]>([]);
  const radiusCirclesRef = useRef<google.maps.Circle[]>([]);
  const recommendationMarkersRef = useRef<(google.maps.Marker | google.maps.marker.AdvancedMarkerElement)[]>([]);
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const heatmapDataRef = useRef<google.maps.LatLng[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const demographicInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const demographicAbortControllerRef = useRef<AbortController | null>(null);
  const lastDemographicRequestRef = useRef<string>('');
  const onBusinessesFoundRef = useRef(onBusinessesFound);
  const onSearchStartRef = useRef(onSearchStart);
  const onSearchCompleteRef = useRef(onSearchComplete);
  const onOverlapsDetectedRef = useRef(onOverlapsDetected);
  const onMapCenterChangedRef = useRef(onMapCenterChanged);
  const onBusinessSelectRef = useRef(onBusinessSelect);
  const onHeatmapToggleRef = useRef(onHeatmapToggle);
  const onRecommendationSelectRef = useRef(onRecommendationSelect);
  const onMapInstanceReadyRef = useRef(onMapInstanceReady);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const centerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchTimeRef = useRef<number>(0);
  const currentMapCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  
  // Rate limiting constants
  const MIN_SEARCH_INTERVAL = 2000; // Minimum 2 seconds between searches
  const QUOTA_RESET_DELAY = 60000; // Wait 1 minute before retrying after quota exhaustion


  // Update refs when props change
  useEffect(() => {
    onBusinessesFoundRef.current = onBusinessesFound;
    onSearchStartRef.current = onSearchStart;
    onSearchCompleteRef.current = onSearchComplete;
    onOverlapsDetectedRef.current = onOverlapsDetected;
    onMapCenterChangedRef.current = onMapCenterChanged;
    onBusinessSelectRef.current = onBusinessSelect;
    onHeatmapToggleRef.current = onHeatmapToggle;
    onRecommendationSelectRef.current = onRecommendationSelect;
    onMapInstanceReadyRef.current = onMapInstanceReady;
  }, [onBusinessesFound, onSearchStart, onSearchComplete, onOverlapsDetected, onMapCenterChanged, onBusinessSelect, onHeatmapToggle, onRecommendationSelect, onMapInstanceReady]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (centerChangeTimeoutRef.current) {
        clearTimeout(centerChangeTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
      if (!mapRef.current || !window.google?.maps?.Map) return;

      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          // zoom: center ? 5 : 10, // Zoom out to show whole US by default, zoom in for cities
          zoom: cityName ? 12 : 5, // Zoom out to show whole US by default, zoom in for cities
          center: mapCenter,
          mapId: 'cf4b184591b2eb8439f0861c', // Required for Advanced Markers - styles controlled via Cloud Console
          mapTypeId: window.google.maps.MapTypeId?.ROADMAP || 'roadmap',
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        // Add a marker at the specified location using AdvancedMarkerElement
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          // Create pin element
          const pinElement = new window.google.maps.marker.PinElement({
            background: '#3B82F6',
            borderColor: '#ffffff',
            scale: 1.2,
            glyph: '',
          });

          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: mapCenter,
            map: mapInstanceRef.current,
            title: displayName,
            content: pinElement.element,
          });
        } else {
          // Fallback to legacy Marker for older API versions
          markerRef.current = new window.google.maps.Marker({
            position: mapCenter,
            map: mapInstanceRef.current,
            title: displayName,
            icon: {
              path: window.google.maps.SymbolPath?.CIRCLE || 0,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
        }

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
          if (infoWindowRef.current && mapInstanceRef.current && markerRef.current) {
            infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
          }
        });

        // Add click listener to map for demographic data
        mapInstanceRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            showDemographicPopup(lat, lng, event.latLng);
          }
        });

        // Add listener for map center changes (when user drags/moves the map)
        // Note: This only updates the current center for search purposes, does NOT trigger automatic searches
        mapInstanceRef.current.addListener('center_changed', () => {
          if (mapInstanceRef.current) {
            // Clear existing timeout
            if (centerChangeTimeoutRef.current) {
              clearTimeout(centerChangeTimeoutRef.current);
            }
            
            // Debounce the center change to prevent excessive updates
            centerChangeTimeoutRef.current = setTimeout(() => {
              if (mapInstanceRef.current) {
                const newCenter = mapInstanceRef.current.getCenter();
                if (newCenter) {
                  const centerObj = {
                    lat: newCenter.lat(),
                    lng: newCenter.lng()
                  };
                  
                  // Only update if the center has actually changed significantly
                  const prev = currentMapCenterRef.current;
                  if (!prev || 
                      Math.abs(prev.lat - centerObj.lat) > 0.001 || 
                      Math.abs(prev.lng - centerObj.lng) > 0.001) {
                    currentMapCenterRef.current = centerObj; // Update ref for search purposes
                    onMapCenterChangedRef.current?.(centerObj);
                  }
                }
              }
            }, 300); // Simple debounce for center tracking only
          }
        });

        // Set initial current map center
        currentMapCenterRef.current = mapCenter;

        setMapLoaded(true);
        setError('');
        
        // Notify parent that map instance is ready
        onMapInstanceReadyRef.current?.(mapInstanceRef.current);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Google Maps';
        setError(`Failed to initialize Google Maps: ${errorMessage}`);
        console.error('Map initialization error:', err);
      }
    };

    loadGoogleMapsScript(apiKey)
      .then(initializeMap)
      .catch((err) => {
        setError('Failed to load Google Maps. Please check your API key.');
        console.error('Script loading error:', err);
      });
  }, [apiKey, center, mapCenter, displayName]);

  // Update map when center changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && infoWindowRef.current) {
      // Update map center and zoom
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(center ? 10 : 3); // Zoom out to show whole US by default, zoom in for cities
      
      // Update marker position - handle both AdvancedMarkerElement and legacy Marker
      if (markerRef.current instanceof window.google.maps.marker.AdvancedMarkerElement) {
        // AdvancedMarkerElement
        markerRef.current.position = mapCenter;
        markerRef.current.title = displayName;
      } else if (markerRef.current instanceof window.google.maps.Marker) {
        // Legacy Marker
        markerRef.current.setPosition(mapCenter);
        markerRef.current.setTitle(displayName);
      }
      
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
  }, [center, mapCenter, displayName]);

  const clearBusinessMarkers = () => {
    businessMarkersRef.current.forEach(marker => {
      if (marker instanceof window.google.maps.Marker) {
        marker.setMap(null);
      } else {
        // AdvancedMarkerElement
        marker.map = null;
      }
    });
    businessMarkersRef.current = [];
    
    // Clear all radius circles
    radiusCirclesRef.current.forEach(circle => {
      circle.setMap(null);
    });
    radiusCirclesRef.current = [];
  };

  const clearRecommendationMarkers = () => {
    recommendationMarkersRef.current.forEach(marker => {
      if (marker instanceof window.google.maps.Marker) {
        marker.setMap(null);
      } else {
        // AdvancedMarkerElement
        marker.map = null;
      }
    });
    recommendationMarkersRef.current = [];
  };

  const createRecommendationMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !recommendations?.length) {
      clearRecommendationMarkers();
      return;
    }

    // Clear existing recommendation markers
    clearRecommendationMarkers();

    recommendations.forEach((recommendation) => {
      const getTortoiseIcon = (level: number) => {
        if (level <= 30) return '🐇'; // Hare - High risk/reward
        if (level <= 70) return '⚖️'; // Balanced
        return '🐢'; // Tortoise - Low risk/steady
      };

      const getTortoiseColor = (level: number) => {
        if (level <= 30) return '#F97316'; // Orange for Hare
        if (level <= 70) return '#EAB308'; // Yellow for Balanced  
        return '#22C55E'; // Green for Tortoise
      };

      let marker;
      const position = { lat: recommendation.lat, lng: recommendation.lng };

      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        // Create pin element for recommendation markers
        const recommendationPinElement = new window.google.maps.marker.PinElement({
          background: getTortoiseColor(recommendation.tortoiseLevel),
          borderColor: '#ffffff',
          scale: 1.1,
          glyph: getTortoiseIcon(recommendation.tortoiseLevel),
        });

        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: position,
          map: mapInstanceRef.current,
          title: `Recommendation ${recommendation.id.replace('rec_', '')} - ${getTortoiseIcon(recommendation.tortoiseLevel)} ${recommendation.tortoiseLevel}`,
          content: recommendationPinElement.element,
        });
      } else {
        // Fallback to legacy Marker for older API versions
        marker = new window.google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: `Recommendation ${recommendation.id.replace('rec_', '')} - ${getTortoiseIcon(recommendation.tortoiseLevel)} ${recommendation.tortoiseLevel}`,
          icon: {
            path: window.google.maps.SymbolPath?.CIRCLE || 0,
            scale: 8,
            fillColor: getTortoiseColor(recommendation.tortoiseLevel),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      }

      // Create info window for recommendation
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
            <div style="display: flex; items-center; margin-bottom: 8px;">
              <span style="font-size: 20px; margin-right: 8px;">${getTortoiseIcon(recommendation.tortoiseLevel)}</span>
              <h3 style="margin: 0; color: #1f2937; font-size: 16px;">
                Recommendation ${recommendation.id.replace('rec_', '')}
              </h3>
            </div>
            
            <div style="background: ${recommendation.tortoiseLevel <= 30 ? '#FEF3C7' : recommendation.tortoiseLevel <= 70 ? '#FEF9C3' : '#D1FAE5'}; 
                        border: 1px solid ${recommendation.tortoiseLevel <= 30 ? '#F59E0B' : recommendation.tortoiseLevel <= 70 ? '#EAB308' : '#22C55E'}; 
                        border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 600; color: ${recommendation.tortoiseLevel <= 30 ? '#92400E' : recommendation.tortoiseLevel <= 70 ? '#A16207' : '#065F46'};">
                Tortoise Level: ${recommendation.tortoiseLevel} (${recommendation.tortoiseLevel <= 30 ? 'Hare Strategy' : recommendation.tortoiseLevel <= 70 ? 'Balanced' : 'Tortoise Strategy'})
              </span>
            </div>

            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-between; margin-bottom: 4px;">
                <span style="color: #6b7280; font-size: 12px;">Target Match:</span>
                <span style="font-weight: 500; font-size: 12px;">${recommendation.demographics.targetMatch}%</span>
              </div>
              <div style="display: flex; justify-between; margin-bottom: 4px;">
                <span style="color: #6b7280; font-size: 12px;">Competition:</span>
                <span style="font-weight: 500; font-size: 12px;">${recommendation.demographics.competitionLevel}%</span>
              </div>
              <div style="display: flex; justify-between;">
                <span style="color: #6b7280; font-size: 12px;">Market Potential:</span>
                <span style="font-weight: 500; font-size: 12px;">${recommendation.demographics.marketPotential}%</span>
              </div>
            </div>

            <p style="margin: 8px 0; color: #374151; font-size: 13px; line-height: 1.4;">
              ${recommendation.reasoning}
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                📍 ${recommendation.lat.toFixed(4)}, ${recommendation.lng.toFixed(4)}
              </p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        // Notify parent about recommendation selection
        onRecommendationSelectRef.current?.(recommendation.id);
      });

      recommendationMarkersRef.current.push(marker);
    });
  }, [recommendations]);

  // Effect to update recommendation markers when recommendations change
  useEffect(() => {
    if (mapInstanceRef.current) {
      createRecommendationMarkers();
    }
  }, [recommendations, createRecommendationMarkers]);

  const createHeatmapLayer = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps?.visualization?.HeatmapLayer) {
      console.warn('Heatmap visualization library not available');
      return;
    }

    // Clear existing heatmap
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
    }

    // Create heatmap layer with current data
    if (heatmapDataRef.current.length > 0) {
      heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapDataRef.current,
        map: showHeatmap ? mapInstanceRef.current : null,
        radius: 120, // Increased radius to show broader coverage and gaps
        opacity: 0.7, // Slightly more opaque to better show cool areas
        dissipating: false, // Keep heatmap visible at all zoom levels
        gradient: [
          'rgba(0, 0, 255, 0)', // Transparent at the edges
          'rgba(0, 100, 255, 0.3)', // Light blue for low density
          'rgba(0, 150, 255, 0.5)', // Medium blue
          'rgba(0, 200, 255, 0.6)', // Brighter blue
          'rgba(0, 255, 200, 0.7)', // Cyan
          'rgba(50, 255, 150, 0.8)', // Light green
          'rgba(100, 255, 100, 0.85)', // Green
          'rgba(150, 255, 50, 0.9)', // Yellow-green
          'rgba(200, 255, 0, 0.95)', // Yellow
          'rgba(255, 200, 0, 1)', // Orange
          'rgba(255, 150, 0, 1)', // Dark orange
          'rgba(255, 100, 0, 1)', // Red-orange
          'rgba(255, 50, 0, 1)', // Red
          'rgba(255, 0, 0, 1)' // Pure red for highest density
        ]
      });
    }
  }, [showHeatmap]);

  const updateHeatmapData = useCallback((businesses: Business[]) => {
    if (!window.google?.maps?.LatLng) return;

    // Convert business locations to LatLng objects for heatmap
    const heatmapPoints: google.maps.LatLng[] = [];
    
    businesses.forEach(business => {
      if (business.location) {
        heatmapPoints.push(
          new window.google.maps.LatLng(business.location.lat, business.location.lng)
        );
      }
    });

    heatmapDataRef.current = heatmapPoints;
    
    // Recreate heatmap layer with new data
    createHeatmapLayer();
  }, [createHeatmapLayer]);

  const toggleHeatmap = (enabled: boolean) => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(enabled ? mapInstanceRef.current : null);
    }
    onHeatmapToggleRef.current?.(enabled);
  };

  const showDemographicPopup = async (lat: number, lng: number, position: google.maps.LatLng) => {
    // Create a unique key for this request
    const requestKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
    
    // Check if we're already processing this exact location
    if (lastDemographicRequestRef.current === requestKey) {
      console.log('Skipping duplicate demographic request for same location');
      return;
    }
    
    // Cancel any existing demographic request
    if (demographicAbortControllerRef.current) {
      demographicAbortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    demographicAbortControllerRef.current = new AbortController();
    const currentController = demographicAbortControllerRef.current;
    
    // Update the last request key
    lastDemographicRequestRef.current = requestKey;
    
    // Close existing demographic popup
    if (demographicInfoWindowRef.current) {
      demographicInfoWindowRef.current.close();
    }

    // Create new info window with loading state
    demographicInfoWindowRef.current = new window.google.maps.InfoWindow({
      position: position,
      content: `
        <div style="padding: 15px; font-family: Arial, sans-serif; width: 500px; max-height: 500px; overflow-y: auto; box-sizing: border-box;">
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
      console.log(`Fetching FIPS codes for lat: ${lat}, lng: ${lng}`);
      const geoUrl = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`;
      const geoResponse = await fetch(geoUrl, { signal: currentController.signal });
      
      console.log(`FCC API Response: ${geoResponse.status} ${geoResponse.statusText}`);
      
      if (!geoResponse.ok) {
        throw new Error(`FCC API error: ${geoResponse.status} ${geoResponse.statusText}`);
      }
      
      const geoText = await geoResponse.text();
      console.log('FCC API response text length:', geoText.length);
      
      if (!geoText.trim()) {
        throw new Error('Empty response from FCC API');
      }
      
      let geoData;
      try {
        geoData = JSON.parse(geoText);
        console.log('FCC API parsed data:', geoData);
      } catch {
        console.error('Failed to parse FCC API response:', geoText);
        throw new Error('Invalid JSON response from FCC API');
      }
      
      if (!geoData.results || geoData.results.length === 0) {
        console.error('No results in FCC API response:', geoData);
        throw new Error('Location not found in census data');
      }

      const result = geoData.results[0];
      console.log('FCC API result:', result);
      console.log('Available properties:', Object.keys(result));
      
      // Check different possible property names for county FIPS
      const state_fips = result.state_fips || result.state_code;
      const county_fips_full = result.county_fips || result.county_code;
      const block_fips = result.block_fips || result.block_code;
      
      // Extract just the county code (last 3 digits) from the full county FIPS
      // county_fips from FCC API is like "06073" (state+county), we need just "073"
      const county_fips = county_fips_full ? String(county_fips_full).slice(-3) : null;
      
      console.log('Extracted FIPS codes:', { 
        state_fips, 
        county_fips_full, 
        county_fips_extracted: county_fips, 
        block_fips 
      });
      
      if (!state_fips || !county_fips || !block_fips) {
        console.error('Available result properties:', result);
        throw new Error(`Missing FIPS data: state=${state_fips}, county=${county_fips}, block=${block_fips}`);
      }
      
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
      
      // Ensure FIPS codes are strings and properly formatted
      const state = String(state_fips).padStart(2, '0'); // Ensure 2-digit state code
      const county = String(county_fips).padStart(3, '0'); // Ensure 3-digit county code
      const tract6 = String(tract).slice(5); // last 6 digits for tract
      
      console.log(`Parsed FIPS: state="${state}", county="${county}", tract="${tract6}"`);
      
      const censusUrl = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${vars}&for=tract:${tract6}&in=state:${state}+county:${county}`;
      console.log('Census API URL:', censusUrl);
      
      const censusResponse = await fetch(censusUrl, { signal: currentController.signal });
      console.log(`Census API Response: ${censusResponse.status} ${censusResponse.statusText}`);
      
      if (!censusResponse.ok) {
        throw new Error(`Census API error: ${censusResponse.status} ${censusResponse.statusText}`);
      }
      
      const censusText = await censusResponse.text();
      console.log('Census API response text length:', censusText.length);
      
      if (!censusText.trim()) {
        throw new Error('Empty response from Census API');
      }
      
      let censusData;
      try {
        censusData = JSON.parse(censusText);
        console.log('Census API parsed data:', censusData);
      } catch {
        console.error('Failed to parse Census API response:', censusText);
        throw new Error('Invalid JSON response from Census API');
      }
      
      if (!censusData || censusData.length < 2) {
        console.error('Insufficient census data:', censusData);
        throw new Error('No demographic data available for this location');
      }

      // Check if request was cancelled before proceeding with data processing
      if (currentController.signal.aborted) {
        return;
      }

      // Parse the data (first row is headers, second row is data)
      const headers = censusData[0];
      const data = censusData[1];
      const dataObj: Record<string, string> = {};
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
        <div style="padding: 15px; font-family: Arial, sans-serif; width: 500px; max-height: 500px; overflow-y: auto; box-sizing: border-box;">
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
      // If the error is due to abortion, don't show error popup
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Demographic request was cancelled');
        return;
      }
      
      console.error('Error fetching demographic data:', error);
      
      // Only show error if this request wasn't cancelled
      if (!currentController.signal.aborted && demographicInfoWindowRef.current) {
        demographicInfoWindowRef.current.setContent(`
        <div style="padding: 15px; font-family: Arial, sans-serif; width: 500px; max-height: 500px; overflow-y: auto; box-sizing: border-box;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626;">❌ Error Loading Demographics</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Unable to fetch census data for this location. This might be a remote area or the census services may be temporarily unavailable.
          </p>
          <div style="margin: 12px 0 0 0; padding: 8px; background: #f3f4f6; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #374151;">Error: ${error instanceof Error ? error.message : String(error)}</p>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </p>
        </div>
      `);
      }
    } finally {
      // Clear the request key when done (success or error)
      if (lastDemographicRequestRef.current === requestKey) {
        lastDemographicRequestRef.current = '';
      }
    }
  };

  const fetchBusinessDemographics = async (businesses: Business[], abortSignal: AbortSignal) => {
    try {
      console.log(`Fetching demographics for ${businesses.length} businesses`);
      
      // Fetch demographics for each business with a small delay to avoid overwhelming the APIs
      const demographicsPromises = businesses.map(async (business, index) => {
        if (!business.location || abortSignal.aborted) return business;
        
        // Add a small delay between requests to be nice to the APIs
        await new Promise(resolve => setTimeout(resolve, index * 100));
        
        if (abortSignal.aborted) return business;
        
        try {
          const demographics = await fetchDemographics(
            business.location.lat, 
            business.location.lng, 
            abortSignal
          );
          
          return {
            ...business,
            demographics
          };
        } catch (error) {
          console.warn(`Failed to fetch demographics for ${business.name}:`, error);
          return {
            ...business,
            demographics: { 
              error: 'Failed to load demographics',
              details: error instanceof Error ? error.message : String(error)
            }
          };
        }
      });
      
      // Wait for all demographics to be fetched
      const businessesWithDemographics = await Promise.all(demographicsPromises);
      
      // Only update if the request wasn't cancelled
      if (!abortSignal.aborted) {
        console.log('Demographics fetched successfully, updating businesses');
        onBusinessesFoundRef.current?.(businessesWithDemographics);
      }
    } catch (error) {
      if (!abortSignal.aborted) {
        console.error('Error fetching business demographics:', error);
      }
    }
  };

  const searchBusinesses = useCallback(async () => {
    // Use current map center if available, otherwise fall back to prop center
    const searchCenter = currentMapCenterRef.current || center;
    if (!mapInstanceRef.current || !businessType || !searchCenter) return;

    // Skip search if quota is exhausted
    if (quotaExhausted) {
      console.log('Skipping search due to quota exhaustion');
      return;
    }

    // Rate limiting: check if enough time has passed since last search
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTimeRef.current;
    if (timeSinceLastSearch < MIN_SEARCH_INTERVAL) {
      console.log(`Rate limiting: ${MIN_SEARCH_INTERVAL - timeSinceLastSearch}ms remaining`);
      return;
    }

    // Cancel any existing search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    
    // Create new abort controller for this search
    searchAbortControllerRef.current = new AbortController();
    const currentController = searchAbortControllerRef.current;

    // Update last search time
    lastSearchTimeRef.current = now;

    // Notify parent that search is starting
    onSearchStartRef.current?.();

    // Convert search radius miles to meters (1 mile = 1609.34 meters)
    const searchRadiusInMeters = businessSearchRadius * 1609.34;
    // Convert display radius miles to meters
    const radiusInMeters = searchRadius * 1609.34;

    try {
      // Dynamically import the new Places library
      const { Place } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      // Create the request object for the new API
      const locationRestriction = new google.maps.Circle({
        center: { lat: searchCenter.lat, lng: searchCenter.lng },
        radius: searchRadiusInMeters
      });
      
      const mappedBusinessType = mapBusinessTypeToPlacesType(businessType);
      console.log(`Searching for business type: "${businessType}" -> mapped to: "${mappedBusinessType}"`);
      
      const request = {
        locationRestriction: locationRestriction,
        includedTypes: [mappedBusinessType],
        maxResultCount: Math.min(businessCount, 20), // Google API limits results to 20 maximum
        fields: ['id', 'displayName', 'location', 'rating', 'priceLevel', 'types', 'formattedAddress', 'nationalPhoneNumber', 'websiteURI', 'regularOpeningHours']
      };

      // Use the new searchNearby function
      const { places } = await Place.searchNearby(request);
      
      // Check if this search was cancelled before proceeding
      if (currentController.signal.aborted) {
        return;
      }
      
      // Clear existing business markers only after we have new results
      clearBusinessMarkers();
      
      if (places && places.length > 0) {
        // First, convert all places to business objects
        const allBusinesses: Business[] = places.map((place: google.maps.places.Place) => ({
          place_id: place.id || '',
          name: place.displayName || '',
          vicinity: place.formattedAddress || '',
          rating: place.rating ?? undefined,
          price_level: place.priceLevel ? Number(place.priceLevel) : undefined,
          types: place.types || [],
          formatted_phone_number: place.nationalPhoneNumber ?? undefined,
          website: place.websiteURI ?? undefined
        }));
        
        // Apply rating filter to determine which businesses to show
        const filteredBusinesses = useRatingFilter 
          ? allBusinesses.filter(business => {
              return !business.rating || business.rating >= minRating;
            })
          : allBusinesses;
        
        // Create markers only for filtered businesses
        const detailedBusinesses: Business[] = [];
        
        // First, prepare business data for overlap detection and demographics
        const businessesWithLocation: BusinessWithLocation[] = [];
        const businessLocations: { [place_id: string]: { lat: number; lng: number } } = {};
        
        filteredBusinesses.forEach(business => {
          const place = places.find(p => p.id === business.place_id);
          if (!place || !place.location) return;
          
          const lat = typeof place.location.lat === 'function' ? place.location.lat() : Number(place.location.lat);
          const lng = typeof place.location.lng === 'function' ? place.location.lng() : Number(place.location.lng);
          
          businessLocations[business.place_id] = { lat, lng };
          
          businessesWithLocation.push({
            place_id: business.place_id,
            name: business.name,
            location: { lat, lng },
            radius: radiusInMeters
          });
        });
        
        // Detect overlapping businesses
        const overlaps = findOverlappingBusinesses(businessesWithLocation);
        const overlappingPlaceIds = new Set<string>();
        overlaps.forEach(overlap => {
          overlappingPlaceIds.add(overlap.business1);
          overlappingPlaceIds.add(overlap.business2);
        });
        
        // Notify parent about overlaps
        onOverlapsDetectedRef.current?.(overlaps);
        
        filteredBusinesses.forEach((business) => {
          // Find the original place object for this business
          const place = places.find(p => p.id === business.place_id);
          if (!place) return;
          
          const isOverlapping = overlappingPlaceIds.has(business.place_id);
          let marker;
          
          if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            // Create pin element for business markers with different colors for overlapping
            const businessPinElement = new window.google.maps.marker.PinElement({
              background: isOverlapping ? '#DC2626' : '#F97316', // Red for overlapping, orange for normal
              borderColor: '#ffffff',
              scale: isOverlapping ? 0.9 : 0.8, // Slightly larger for overlapping
              glyph: isOverlapping ? '⚠' : '',
            });

            marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: place.location,
              map: mapInstanceRef.current,
              title: place.displayName,
              content: businessPinElement.element,
            });
          } else {
            // Fallback to legacy Marker for older API versions
            marker = new window.google.maps.Marker({
              position: place.location,
              map: mapInstanceRef.current,
              title: place.displayName,
              icon: {
                path: window.google.maps.SymbolPath?.CIRCLE || 0,
                scale: isOverlapping ? 7 : 6,
                fillColor: isOverlapping ? '#DC2626' : '#F97316',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            });
          }

          // Find overlaps for this specific business for info window
          const businessOverlaps = overlaps.filter(overlap => 
            overlap.business1 === business.place_id || overlap.business2 === business.place_id
          );
          
          let overlapInfo = '';
          if (businessOverlaps.length > 0) {
            overlapInfo = `
              <div style="margin-top: 10px; padding: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
                <p style="margin: 0 0 4px 0; color: #dc2626; font-size: 12px; font-weight: 600;">⚠ Overlapping Coverage</p>
                <p style="margin: 0; color: #7f1d1d; font-size: 11px;">
                  Overlaps with ${businessOverlaps.length} other business${businessOverlaps.length > 1 ? 'es' : ''}
                </p>
              </div>
            `;
          }

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial, sans-serif; max-width: 250px;">
                <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${place.displayName || 'Unknown'}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${place.formattedAddress || 'Address not available'}</p>
                <p style="margin: 5px 0 0 0; color: #3B82F6; font-size: 14px; font-weight: 500;">
                  Rating: ${place.rating ? place.rating + '/5 ⭐' : 'N/A'}
                </p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
                  Coverage radius: ${formatDistance(radiusInMeters)}
                </p>
                ${overlapInfo}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
            // Notify parent about business selection
            onBusinessSelectRef.current?.(business.place_id);
          });

          businessMarkersRef.current.push(marker);
          
          // Add individual radius circle around each business with different styling for overlapping
          if (showCircles) {
            const businessCircle = new window.google.maps.Circle({
              strokeColor: isOverlapping ? '#DC2626' : '#F97316', // Red for overlapping, orange for normal
              strokeOpacity: isOverlapping ? 1.0 : 0.8,
              strokeWeight: isOverlapping ? 3 : 2, // Thicker stroke for overlapping
              fillColor: isOverlapping ? '#DC2626' : '#F97316',
              fillOpacity: isOverlapping ? 0.25 : 0.15, // More opaque for overlapping
              map: mapInstanceRef.current,
              center: place.location,
              radius: radiusInMeters,
            });
            
            radiusCirclesRef.current.push(businessCircle);
          }
          
          // Add the business to the detailed list with location
          const businessLocation = businessLocations[business.place_id];
          detailedBusinesses.push({
            ...business,
            location: businessLocation
          });
        });
        
        // Check if this search was cancelled before sending results
        if (currentController.signal.aborted) {
          return;
        }
        
        // Send the filtered businesses to parent immediately (without demographics first)
        onBusinessesFoundRef.current?.(detailedBusinesses);
        
        // Update heatmap data with new business locations
        updateHeatmapData(detailedBusinesses);
        
        // Fetch demographics for each business in the background
        fetchBusinessDemographics(detailedBusinesses, currentController.signal);
      } else {
        // No results found
        onBusinessesFoundRef.current?.([]);
      }
    } catch (error) {
      // If the error is due to abortion, don't do anything
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('Error searching for businesses:', error);
      
      // Check if this is a quota exhaustion error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || 
          errorMessage.includes('Quota exceeded') || 
          errorMessage.includes('quota metric')) {
        console.warn('Google Places API quota exhausted, implementing temporary search pause');
        setQuotaExhausted(true);
        setError('Search temporarily paused due to API quota limits. Will resume automatically.');
        
        // Reset quota flag after delay
        setTimeout(() => {
          setQuotaExhausted(false);
          setError('');
          console.log('Quota exhaustion period ended, searches resumed');
        }, QUOTA_RESET_DELAY);
      } else if (errorMessage.includes('INVALID_REQUEST') || 
                 errorMessage.includes('invalid') || 
                 errorMessage.includes('Invalid type')) {
        const mappedType = mapBusinessTypeToPlacesType(businessType);
        setError(`Invalid business type: "${businessType}" (mapped to "${mappedType}"). Try a more specific term like "restaurant", "hospital", or "gas station".`);
      } else {
        setError(`Search error: ${errorMessage}`);
      }
      
      // Clear markers on error and notify completion
      clearBusinessMarkers();
      onBusinessesFoundRef.current?.([]);
    }
    
    // Only notify completion if this search wasn't aborted
    if (!currentController.signal.aborted) {
      onSearchCompleteRef.current?.();
    }
  }, [businessType, center, searchRadius, showCircles, minRating, useRatingFilter, businessCount, businessSearchRadius, quotaExhausted, updateHeatmapData]);

  // Handle heatmap visibility changes
  useEffect(() => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(showHeatmap ? mapInstanceRef.current : null);
    }
  }, [showHeatmap]);

  // Search for businesses only when businessType or other search parameters change
  // NOTE: We use currentMapCenterRef to avoid triggering searches on map movement
  useEffect(() => {
    const searchCenter = currentMapCenterRef.current || center;
    if (mapInstanceRef.current && businessType && searchCenter && !quotaExhausted) {
      // Clear any existing search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Calculate appropriate delay based on rate limiting
      const now = Date.now();
      const timeSinceLastSearch = now - lastSearchTimeRef.current;
      const minDelay = Math.max(0, MIN_SEARCH_INTERVAL - timeSinceLastSearch);
      
      searchTimeoutRef.current = setTimeout(() => {
        searchBusinesses();
      }, minDelay);
      
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [businessType, searchTrigger, center, businessCount, businessSearchRadius, minRating, useRatingFilter, quotaExhausted, searchBusinesses]);

  if (error) {
    const isQuotaError = error.includes('quota') || error.includes('API quota limits');
    const isApiKeyError = error.includes('API key');
    
    return (
      <div className={`w-full h-96 ${isQuotaError ? 'bg-yellow-50 border-yellow-200' : isApiKeyError ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className={`h-12 w-12 ${isQuotaError ? 'text-yellow-500' : isApiKeyError ? 'text-blue-500' : 'text-red-500'} mx-auto mb-4`} />
          <p className={`${isQuotaError ? 'text-yellow-700' : isApiKeyError ? 'text-blue-700' : 'text-red-700'} font-medium`}>{error}</p>
          {isQuotaError && (
            <p className="text-yellow-600 text-sm mt-2">
              Searches will resume automatically. Try moving the map less frequently to avoid this issue.
            </p>
          )}
          {isApiKeyError && (
            <p className="text-blue-600 text-sm mt-2">
              Click the settings icon in the top navigation to add your Google Maps API key.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden relative">
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
      
      {/* Heatmap Toggle Button */}
      {mapLoaded && heatmapDataRef.current.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => toggleHeatmap(!showHeatmap)}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium text-sm transition-all duration-200 ${
              showHeatmap 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
            }`}
            title={showHeatmap ? 'Hide business density heatmap' : 'Show business density heatmap'}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${showHeatmap ? 'bg-white' : 'bg-gradient-to-r from-blue-500 to-red-500'}`}></div>
              <span>{showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;