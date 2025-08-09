/**
 * Demographics utility functions for fetching and processing census data
 */

export interface DemographicsData {
  population: number;
  medianIncome: number;
  medianHomeValue: number;
  collegePercent: number;
  tractName: string;
  state: string;
  county: string;
}

export interface DemographicsError {
  error: string;
  details?: string;
}

/**
 * Fetch demographics data for a given latitude and longitude
 * @param lat Latitude
 * @param lng Longitude
 * @param abortSignal Optional AbortSignal for cancellation
 * @returns Promise with demographics data or error
 */
export async function fetchDemographics(
  lat: number, 
  lng: number, 
  abortSignal?: AbortSignal
): Promise<DemographicsData | DemographicsError> {
  try {
    console.log(`Fetching demographics for lat: ${lat}, lng: ${lng}`);
    
    // Step 1: Get FIPS codes from lat/lon
    const geoUrl = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`;
    const geoResponse = await fetch(geoUrl, { signal: abortSignal });
    
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
    } catch {
      throw new Error('Invalid JSON response from FCC API');
    }
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('Location not found in census data');
    }

    const result = geoData.results[0];
    
    // Extract FIPS codes
    const state_fips = result.state_fips || result.state_code;
    const county_fips_full = result.county_fips || result.county_code;
    const block_fips = result.block_fips || result.block_code;
    
    // Extract just the county code (last 3 digits) from the full county FIPS
    const county_fips = county_fips_full ? String(county_fips_full).slice(-3) : null;
    
    if (!state_fips || !county_fips || !block_fips) {
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
    const state = String(state_fips).padStart(2, '0');
    const county = String(county_fips).padStart(3, '0');
    const tract6 = String(tract).slice(5); // last 6 digits for tract
    
    const censusUrl = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${vars}&for=tract:${tract6}&in=state:${state}+county:${county}`;
    const censusResponse = await fetch(censusUrl, { signal: abortSignal });
    
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
    } catch {
      throw new Error('Invalid JSON response from Census API');
    }
    
    if (!censusData || censusData.length < 2) {
      throw new Error('No demographic data available for this location');
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
    const collegePercent = population > 0 ? (collegeGrads / population) * 100 : 0;

    return {
      population,
      medianIncome,
      medianHomeValue,
      collegePercent,
      tractName: dataObj.NAME || 'Unknown Census Tract',
      state: String(state),
      county: String(county)
    };

  } catch (error) {
    // If the error is due to abortion, return a specific error
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Request cancelled' };
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      error: 'Failed to fetch demographics', 
      details: errorMessage 
    };
  }
}

/**
 * Format currency values for display
 */
export function formatCurrency(num: number): string {
  if (num === 0) return 'N/A';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(num);
}

/**
 * Format number values for display
 */
export function formatNumber(num: number): string {
  if (num === 0) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format percentage values for display
 */
export function formatPercent(num: number): string {
  if (num === 0) return 'N/A';
  return `${num.toFixed(1)}%`;
}

/**
 * Check if demographics data has an error
 */
export function isDemographicsError(data: DemographicsData | DemographicsError): data is DemographicsError {
  return 'error' in data;
}
