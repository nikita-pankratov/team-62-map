/**
 * Map screenshot service for capturing map images for ChatGPT analysis
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export class MapScreenshotService {
  /**
   * Capture a screenshot of the Google Map
   * @param mapInstance The Google Maps instance
   * @param options Screenshot options
   * @returns Promise<string> Base64 encoded image
   */
  static async captureMapView(
    mapInstance: google.maps.Map,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    const {
      width = 800,
      height = 600,
      format = 'png',
      quality = 0.8
    } = options;

    try {
      // Create a temporary canvas element
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Get the map div element
      const mapDiv = mapInstance.getDiv();
      if (!mapDiv) {
        throw new Error('Map div not found');
      }

      // Use html2canvas to capture the map
      const html2canvas = await import('html2canvas');
      
      const canvasElement = await html2canvas.default(mapDiv, {
        width: width,
        height: height,
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        backgroundColor: '#f0f0f0'
      });

      // Convert to base64
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const base64 = canvasElement.toDataURL(mimeType, quality);
      
      // Remove the data URL prefix to return just the base64 string
      return base64.split(',')[1];
    } catch (error) {
      console.error('Error capturing map screenshot:', error);
      throw new Error(`Failed to capture map screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Alternative method using Google Maps Static API (requires separate API key)
   * This is a fallback if html2canvas doesn't work reliably
   */
  static async captureStaticMap(
    center: { lat: number; lng: number },
    zoom: number,
    apiKey: string,
    options: {
      width?: number;
      height?: number;
      maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
      markers?: Array<{ lat: number; lng: number; color?: string; label?: string }>;
    } = {}
  ): Promise<string> {
    const {
      width = 800,
      height = 600,
      maptype = 'roadmap',
      markers = []
    } = options;

    try {
      // Build markers parameter
      const markerParams = markers.map(marker => {
        const color = marker.color || 'red';
        const label = marker.label || '';
        return `color:${color}|label:${label}|${marker.lat},${marker.lng}`;
      });

      // Build the Static Maps API URL
      const params = new URLSearchParams({
        center: `${center.lat},${center.lng}`,
        zoom: zoom.toString(),
        size: `${width}x${height}`,
        maptype: maptype,
        key: apiKey
      });

      // Add markers if any
      if (markerParams.length > 0) {
        markerParams.forEach(marker => {
          params.append('markers', marker);
        });
      }

      const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
      
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Static Maps API error: ${response.status} ${response.statusText}`);
      }

      // Convert to base64
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error capturing static map:', error);
      throw new Error(`Failed to capture static map: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate that we can capture screenshots (check for required dependencies)
   */
  static async validateScreenshotCapability(): Promise<boolean> {
    try {
      // Check if html2canvas is available
      await import('html2canvas');
      return true;
    } catch (error) {
      console.warn('html2canvas not available, screenshot capture may not work:', error);
      return false;
    }
  }

  /**
   * Get estimated file size of a base64 image
   */
  static getBase64Size(base64String: string): number {
    // Each base64 character represents 6 bits, so 4 characters = 3 bytes
    // But we need to account for padding
    const padding = (base64String.match(/=/g) || []).length;
    return Math.floor((base64String.length * 3) / 4) - padding;
  }

  /**
   * Compress base64 image if it's too large
   */
  static async compressBase64Image(
    base64String: string, 
    maxSizeKB: number = 1024
  ): Promise<string> {
    try {
      // Create an image element
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions to reduce size
          const currentSize = this.getBase64Size(base64String);
          const targetSizeBytes = maxSizeKB * 1024;
          
          if (currentSize <= targetSizeBytes) {
            resolve(base64String);
            return;
          }

          // Reduce dimensions proportionally
          const ratio = Math.sqrt(targetSizeBytes / currentSize);
          canvas.width = Math.floor(img.width * ratio);
          canvas.height = Math.floor(img.height * ratio);

          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          
          // Remove data URL prefix
          resolve(compressed.split(',')[1]);
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = `data:image/png;base64,${base64String}`;
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      return base64String; // Return original if compression fails
    }
  }
}
