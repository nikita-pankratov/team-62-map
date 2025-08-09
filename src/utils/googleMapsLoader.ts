let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  // If already loaded, resolve immediately
  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Check if script already exists in DOM
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript && window.google && window.google.maps) {
    isLoaded = true;
    return Promise.resolve();
  }

  // Start loading
  isLoading = true;
  
  loadPromise = new Promise<void>((resolve, reject) => {
    // Remove any existing scripts to prevent conflicts
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    scripts.forEach(script => script.remove());

    const script = document.createElement('script');
    // Updated to use loading=async for better performance and include visualization library for heatmaps
    // places library is loaded dynamically in the component
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker,visualization&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait a bit for the API to fully initialize
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds maximum wait
      
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          isLoaded = true;
          isLoading = false;
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkGoogleMaps, 100);
        } else {
          isLoading = false;
          loadPromise = null;
          reject(new Error('Google Maps API failed to initialize within timeout'));
        }
      };
      checkGoogleMaps();
    };
    
    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};