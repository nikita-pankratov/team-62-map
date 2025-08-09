import { useState, useEffect } from 'react'
import { X, Settings, Key, Save } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onApiKeyChange: (apiKey: string) => void
  onChatGPTKeyChange: (chatGPTKey: string) => void
  currentApiKey?: string
  currentChatGPTKey?: string
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onApiKeyChange,
  onChatGPTKeyChange,
  currentApiKey = '',
  currentChatGPTKey = ''
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey)
  const [chatGPTKey, setChatGPTKey] = useState(currentChatGPTKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showChatGPTKey, setShowChatGPTKey] = useState(false)

  // Initialize form fields with localStorage values when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedApiKey = localStorage.getItem('googleMapsApiKey') || currentApiKey
      const savedChatGPTKey = localStorage.getItem('chatGPTApiKey') || currentChatGPTKey
      
      setApiKey(savedApiKey)
      setChatGPTKey(savedChatGPTKey)
    }
  }, [isOpen, currentApiKey, currentChatGPTKey])

  if (!isOpen) return null

  const handleSave = () => {
    // Save to localStorage for persistence
    if (apiKey.trim()) {
      localStorage.setItem('googleMapsApiKey', apiKey)
    } else {
      localStorage.removeItem('googleMapsApiKey')
    }
    
    if (chatGPTKey.trim()) {
      localStorage.setItem('chatGPTApiKey', chatGPTKey)
    } else {
      localStorage.removeItem('chatGPTApiKey')
    }
    
    onApiKeyChange(apiKey)
    onChatGPTKeyChange(chatGPTKey)
    onClose()
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-gray-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">API Settings</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Google Maps API Key */}
              <div>
                <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="googleApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={currentApiKey ? maskKey(currentApiKey) : "Enter your Google Maps API key"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for Google Maps functionality and business search
                </p>
              </div>

              {/* ChatGPT API Key */}
              <div>
                <label htmlFor="chatgptApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  ChatGPT API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="chatgptApiKey"
                    type={showChatGPTKey ? 'text' : 'password'}
                    value={chatGPTKey}
                    onChange={(e) => setChatGPTKey(e.target.value)}
                    placeholder={currentChatGPTKey ? maskKey(currentChatGPTKey) : "Enter your ChatGPT API key"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatGPTKey(!showChatGPTKey)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showChatGPTKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for AI-powered business gap analysis
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Your API keys are stored securely and only used for the services you've authorized.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
