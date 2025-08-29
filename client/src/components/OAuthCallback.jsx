import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'

const OAuthCallback = () => {
  const [callbackData, setCallbackData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if we're on a callback page with success parameters
    const urlParams = new URLSearchParams(location.search)
    const instagramSuccess = urlParams.get('instagram')
    
    if (instagramSuccess === 'success') {
      const username = urlParams.get('username')
      const userId = urlParams.get('userId')
      const permissions = urlParams.get('permissions')
      
      if (username && userId) {
        setCallbackData({
          username: decodeURIComponent(username),
          userId: userId,
          permissions: permissions ? decodeURIComponent(permissions).split(',') : []
        })
        setIsLoading(false)
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard?instagram=success&username=' + encodeURIComponent(username) + '&userId=' + userId + '&permissions=' + encodeURIComponent(permissions || ''), { replace: true })
        }, 3000)
      }
    } else {
      // No success parameters, redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }, [location.search, navigate])

  const handleGoToDashboard = () => {
    if (callbackData) {
      navigate('/dashboard?instagram=success&username=' + encodeURIComponent(callbackData.username) + '&userId=' + callbackData.userId + '&permissions=' + encodeURIComponent(callbackData.permissions.join(',') || ''), { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing Instagram connection...</p>
        </div>
      </div>
    )
  }

  if (!callbackData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Unable to determine connection status. Please check your Instagram connection.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Instagram Connected!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">Instagram Account:</span> @{callbackData.username}
              </p>
              <p className="text-xs text-green-600">
                User ID: {callbackData.userId}
              </p>
              {callbackData.permissions && callbackData.permissions.length > 0 && (
                <p className="text-xs text-green-600">
                  Permissions: {callbackData.permissions.join(', ')}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Your Instagram business account has been successfully connected to InstantChat!
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleGoToDashboard} className="w-full">
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected automatically in a few seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OAuthCallback
