/**
 * Geographic utility functions for distance calculations and overlap detection
 */

export interface GeographicPoint {
  lat: number;
  lng: number;
}

export interface BusinessWithLocation {
  place_id: string;
  name: string;
  location: GeographicPoint;
  radius?: number; // radius in meters
}

export interface OverlapResult {
  business1: string; // place_id
  business2: string; // place_id
  distance: number; // distance between centers in meters
  overlapArea: number; // overlapping area in square meters
  overlapPercentage: number; // percentage of overlap relative to smaller circle
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param point1 First geographic point
 * @param point2 Second geographic point
 * @returns Distance in meters
 */
export function calculateDistance(point1: GeographicPoint, point2: GeographicPoint): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if two circles overlap
 * @param center1 Center of first circle
 * @param radius1 Radius of first circle in meters
 * @param center2 Center of second circle
 * @param radius2 Radius of second circle in meters
 * @returns True if circles overlap, false otherwise
 */
export function doCirclesOverlap(
  center1: GeographicPoint,
  radius1: number,
  center2: GeographicPoint,
  radius2: number
): boolean {
  const distance = calculateDistance(center1, center2);
  return distance < (radius1 + radius2);
}

/**
 * Calculate the area of intersection between two circles
 * @param center1 Center of first circle
 * @param radius1 Radius of first circle in meters
 * @param center2 Center of second circle
 * @param radius2 Radius of second circle in meters
 * @returns Intersection area in square meters
 */
export function calculateCircleIntersectionArea(
  center1: GeographicPoint,
  radius1: number,
  center2: GeographicPoint,
  radius2: number
): number {
  const distance = calculateDistance(center1, center2);
  
  // No intersection if circles don't overlap
  if (distance >= radius1 + radius2) {
    return 0;
  }
  
  // One circle is completely inside the other
  if (distance <= Math.abs(radius1 - radius2)) {
    const smallerRadius = Math.min(radius1, radius2);
    return Math.PI * smallerRadius * smallerRadius;
  }
  
  // Partial intersection - use the formula for intersection of two circles
  const r1Squared = radius1 * radius1;
  const r2Squared = radius2 * radius2;
  const dSquared = distance * distance;
  
  // Calculate the area using the lens formula
  const area1 = r1Squared * Math.acos((dSquared + r1Squared - r2Squared) / (2 * distance * radius1));
  const area2 = r2Squared * Math.acos((dSquared + r2Squared - r1Squared) / (2 * distance * radius2));
  const triangleArea = 0.5 * Math.sqrt((-distance + radius1 + radius2) * (distance + radius1 - radius2) * (distance - radius1 + radius2) * (distance + radius1 + radius2));
  
  return area1 + area2 - triangleArea;
}

/**
 * Find all overlapping business pairs and calculate overlap details
 * @param businesses Array of businesses with locations and radii
 * @returns Array of overlap results
 */
export function findOverlappingBusinesses(businesses: BusinessWithLocation[]): OverlapResult[] {
  const overlaps: OverlapResult[] = [];
  
  for (let i = 0; i < businesses.length; i++) {
    for (let j = i + 1; j < businesses.length; j++) {
      const business1 = businesses[i];
      const business2 = businesses[j];
      
      // Default radius if not specified (e.g., 2.5 miles = 4023.36 meters)
      const radius1 = business1.radius || 4023.36;
      const radius2 = business2.radius || 4023.36;
      
      if (doCirclesOverlap(business1.location, radius1, business2.location, radius2)) {
        const distance = calculateDistance(business1.location, business2.location);
        const overlapArea = calculateCircleIntersectionArea(
          business1.location,
          radius1,
          business2.location,
          radius2
        );
        
        // Calculate overlap percentage relative to the smaller circle
        const smallerCircleArea = Math.PI * Math.min(radius1, radius2) ** 2;
        const overlapPercentage = (overlapArea / smallerCircleArea) * 100;
        
        overlaps.push({
          business1: business1.place_id,
          business2: business2.place_id,
          distance,
          overlapArea,
          overlapPercentage
        });
      }
    }
  }
  
  return overlaps;
}

/**
 * Convert miles to meters
 * @param miles Distance in miles
 * @returns Distance in meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

/**
 * Convert meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string with appropriate units
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else if (meters < 1609.34) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    return `${metersToMiles(meters).toFixed(1)} miles`;
  }
}

/**
 * Format area for display
 * @param squareMeters Area in square meters
 * @returns Formatted string with appropriate units
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${Math.round(squareMeters)} m²`;
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(1)} hectares`;
  } else {
    const squareMiles = squareMeters / 2589988.11; // 1 square mile = 2,589,988.11 square meters
    return `${squareMiles.toFixed(2)} sq miles`;
  }
}
