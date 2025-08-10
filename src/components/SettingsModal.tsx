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
  const [showChatGPTKey, setShowChatGPTKey] = useState(false)

  // Initialize form fields with current values when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey(currentApiKey)
      // Check if ChatGPT key is set in environment variables
      const envChatGPTKey = import.meta.env.VITE_CHATGPT_API_KEY;
      const hasEnvChatGPTKey = envChatGPTKey && envChatGPTKey.trim() !== '';
      
      if (hasEnvChatGPTKey) {
        // Use environment variable value
        setChatGPTKey(envChatGPTKey)
      } else {
        // Allow user to set their own value
        setChatGPTKey(currentChatGPTKey || '')
      }
    }
  }, [isOpen, currentApiKey, currentChatGPTKey])

  if (!isOpen) return null

  const handleSave = () => {
    // Check if ChatGPT key is set in environment variables
    const envChatGPTKey = import.meta.env.VITE_CHATGPT_API_KEY;
    const hasEnvChatGPTKey = envChatGPTKey && envChatGPTKey.trim() !== '';
    
    if (!hasEnvChatGPTKey) {
      // Save to localStorage for user-set ChatGPT key
      if (chatGPTKey.trim()) {
        localStorage.setItem('chatGPTApiKey', chatGPTKey)
      } else {
        localStorage.removeItem('chatGPTApiKey')
      }
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

  // Check if ChatGPT key is set in environment variables
  const envChatGPTKey = import.meta.env.VITE_CHATGPT_API_KEY;
  const hasEnvChatGPTKey = envChatGPTKey && envChatGPTKey.trim() !== '';

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
                    type="password"
                    value={currentApiKey ? '••••••••••••••••••••••••••••••••' : ''}
                    placeholder="API key loaded from environment"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    disabled={true}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for Google Maps functionality and business search
                </p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>Environment Variable:</strong> This value is loaded from <code className="bg-blue-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-blue-100 px-1 rounded">.env</code> file.
                  </p>
                </div>
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
                    className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      hasEnvChatGPTKey ? 'bg-gray-50' : 'bg-white'
                    }`}
                    disabled={hasEnvChatGPTKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatGPTKey(!showChatGPTKey)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={hasEnvChatGPTKey}
                  >
                    {showChatGPTKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for AI-powered business gap analysis
                </p>
                {hasEnvChatGPTKey ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Environment Variable:</strong> This value is loaded from <code className="bg-blue-100 px-1 rounded">VITE_CHATGPT_API_KEY</code> in your <code className="bg-blue-100 px-1 rounded">.env</code> file.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-700">
                      <strong>User Setting:</strong> This key will be saved in your browser's localStorage for this session.
                    </p>
                  </div>
                )}
              </div>

              {/* Environment Variables Notice */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Environment Variables</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>API keys are now managed through environment variables for better security. Create a <code className="bg-green-100 px-1 rounded">.env</code> file in the project root with your API keys.</p>
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
              className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${
                hasEnvChatGPTKey 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              disabled={hasEnvChatGPTKey}
            >
              <Save className="h-4 w-4 mr-2" />
              {hasEnvChatGPTKey ? 'Read Only' : 'Save Settings'}
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
