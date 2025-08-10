// Environment variables configuration
// All environment variables must be prefixed with VITE_ to be accessible in the client

export const env = {
  // Google Maps API Key - Required for map functionality
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  
  // ChatGPT API Key - Optional, for gap analysis
  CHATGPT_API_KEY: import.meta.env.VITE_CHATGPT_API_KEY || '',
} as const;

// Type-safe environment variable access
export const getGoogleMapsApiKey = (): string => {
  return env.GOOGLE_MAPS_API_KEY;
};

export const getChatGPTApiKey = (): string => {
  return env.CHATGPT_API_KEY;
};

// Check if required environment variables are set
export const validateEnvironment = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!env.GOOGLE_MAPS_API_KEY) {
    missing.push('VITE_GOOGLE_MAPS_API_KEY');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Development helper to log environment status
export const logEnvironmentStatus = (): void => {
  if (import.meta.env.DEV) {
    const validation = validateEnvironment();
    console.log('🔧 Environment Variables Status:');
    console.log(`  Google Maps API Key: ${env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  ChatGPT API Key: ${env.CHATGPT_API_KEY ? '✅ Set' : '⚠️  Optional'}`);
    
    if (!validation.isValid) {
      console.warn('⚠️  Missing required environment variables:', validation.missing);
      console.log('📝 Create a .env file in the project root with the required variables.');
    }
  }
};
