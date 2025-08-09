import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Brain } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
  onChatGPTKeyChange?: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeyChange, onChatGPTKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [chatGPTKey, setChatGPTKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChatGPTKey, setShowChatGPTKey] = useState(false);

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('googleMapsApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange(savedApiKey);
    }

    const savedChatGPTKey = localStorage.getItem('chatGPTApiKey');
    if (savedChatGPTKey) {
      setChatGPTKey(savedChatGPTKey);
      onChatGPTKeyChange?.(savedChatGPTKey);
    }
  }, [onApiKeyChange, onChatGPTKeyChange]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    onApiKeyChange(value);
    
    // Save to localStorage for persistence
    if (value.trim()) {
      localStorage.setItem('googleMapsApiKey', value);
    } else {
      localStorage.removeItem('googleMapsApiKey');
    }
  };

  const handleChatGPTKeyChange = (value: string) => {
    setChatGPTKey(value);
    onChatGPTKeyChange?.(value);
    
    // Save to localStorage for persistence
    if (value.trim()) {
      localStorage.setItem('chatGPTApiKey', value);
    } else {
      localStorage.removeItem('chatGPTApiKey');
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Maps API Key */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Key className="h-5 w-5 text-blue-500 mr-2" />
          <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
            Google Maps API Key:
          </label>
        </div>
        <div className="flex-1 relative max-w-md">
          <input
            type={showApiKey ? 'text' : 'password'}
            id="apiKey"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="AIzaSyBNLrJhOMz6idD09..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {!apiKey && (
          <div className="text-xs text-gray-500">
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
              Get API Key
            </a>
          </div>
        )}
      </div>

      {/* ChatGPT API Key */}
      {onChatGPTKeyChange && (
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-green-500 mr-2" />
            <label htmlFor="chatGPTKey" className="text-sm font-medium text-gray-700">
              ChatGPT API Key:
            </label>
          </div>
          <div className="flex-1 relative max-w-md">
            <input
              type={showChatGPTKey ? 'text' : 'password'}
              id="chatGPTKey"
              value={chatGPTKey}
              onChange={(e) => handleChatGPTKeyChange(e.target.value)}
              placeholder="sk-proj-... (or type 'demo' for mock data)"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowChatGPTKey(!showChatGPTKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showChatGPTKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {!chatGPTKey && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                  Get API Key
                </a>
              </div>
              <div className="text-blue-600">
                💡 Type "demo" to try with mock data
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;