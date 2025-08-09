import { LogIn, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface FloatingNavigationProps {
  onShowAuth: () => void
  onShowSettings: () => void
}

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({
  onShowAuth,
  onShowSettings
}) => {
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-1">
      <div className="mx-1 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Logo and brand name */}
        <div className="flex items-center space-x-3">
          {/* Placeholder for logo - will be added soon */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">TortoiseAI</h1>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-2">
          {/* Settings button */}
          <div className="relative group">
            <button
              onClick={onShowSettings}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Settings
            </div>
          </div>

          {/* Auth button */}
          <div className="relative group">
            {loading ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                title={`Sign Out (${user.email?.split('@')[0] || 'User'})`}
              >
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                title="Sign In"
              >
                <LogIn className="h-5 w-5 text-blue-600" />
              </button>
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {loading ? 'Loading...' : user ? `Sign Out (${user.email?.split('@')[0] || 'User'})` : 'Sign In'}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
