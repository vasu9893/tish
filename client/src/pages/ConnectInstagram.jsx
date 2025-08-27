import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const ConnectInstagram = ({ user, onLogout }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [instagramData, setInstagramData] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkInstagramStatus()
  }, [])

  const checkInstagramStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get('/api/instagram/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setConnectionStatus(response.data.connected)
        if (response.data.connected) {
          setInstagramData(response.data.data)
        }
      }
    } catch (error) {
      console.error('Error checking Instagram status:', error)
      setConnectionStatus(false)
    }
  }

  const handleConnectInstagram = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      const response = await api.get('/api/instagram/auth/instagram', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        // Redirect to Meta OAuth
        window.location.href = response.data.authUrl
      } else {
        setError('Failed to start Instagram connection')
      }
    } catch (error) {
      console.error('Error starting Instagram connection:', error)
      setError('Failed to connect to Instagram. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectInstagram = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.delete('/api/instagram/disconnect', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setConnectionStatus(false)
        setInstagramData(null)
        setError(null)
      }
    } catch (error) {
      console.error('Error disconnecting Instagram:', error)
      setError('Failed to disconnect Instagram')
    }
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IC</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">InstantChat</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Instagram Account
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your Instagram business account to receive and send direct messages 
            directly through InstantChat. Manage all your Instagram conversations in one place.
          </p>
        </div>

        {/* Connection Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {connectionStatus ? (
              // Connected State
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Instagram Connected! 🎉
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Page Name:</span>
                      <p className="text-gray-900 font-semibold">{instagramData?.pageName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Instagram Account:</span>
                      <p className="text-gray-900 font-semibold">{instagramData?.instagramUsername || 'Connected'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Last Connected:</span>
                      <p className="text-gray-900">{new Date(instagramData?.lastConnected).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Token Expires:</span>
                      <p className="text-gray-900">{new Date(instagramData?.tokenExpiresAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={goToDashboard}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Go to Chat Dashboard
                  </button>
                  
                  <button
                    onClick={handleDisconnectInstagram}
                    className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Disconnect Instagram
                  </button>
                </div>
              </div>
            ) : (
              // Not Connected State
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Connect Your Instagram Business Account
                </h3>
                
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                  By connecting your Instagram account, you'll be able to:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Receive Messages</h4>
                    <p className="text-sm text-gray-600">Get Instagram DMs in real-time</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Send Replies</h4>
                    <p className="text-sm text-gray-600">Respond directly from InstantChat</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Unified Chat</h4>
                    <p className="text-sm text-gray-600">Manage all conversations in one place</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleConnectInstagram}
                    disabled={isConnecting}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Connect Instagram</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={goToDashboard}
                    className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 font-bold">1</div>
              <p>Click "Connect Instagram" to authorize access</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 font-bold">2</div>
              <p>Complete Meta OAuth login and permissions</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 font-bold">3</div>
              <p>Start receiving and sending Instagram DMs instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectInstagram
