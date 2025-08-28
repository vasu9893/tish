import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { 
  MessageCircle, 
  Bot, 
  Settings as SettingsIcon, 
  LogOut, 
  Instagram, 
  Zap, 
  Users, 
  BarChart3,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  X
} from 'lucide-react'
import Chats from './Chats'
import FlowBuilder from './FlowBuilder'
import Settings from './Settings'
import InstagramChat from '../components/InstagramChat'
import InstagramAutomation from '../components/InstagramAutomation'
import InstagramAnalytics from '../components/InstagramAnalytics'
import api from '../utils/api'

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chats')
  const [instagramStatus, setInstagramStatus] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

    useEffect(() => {
    console.log('🚀 Dashboard: Component Mounted', {
      timestamp: new Date().toISOString(),
      hasToken: !!localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
      location: location.pathname,
      search: location.search
    })
    
    // Check Instagram connection status
    checkInstagramStatus()

    // Check for Instagram OAuth success in URL parameters
    const urlParams = new URLSearchParams(location.search)
    const instagramSuccess = urlParams.get('instagram')

    console.log('🔍 Dashboard: URL Parameters Check:', {
      instagramSuccess,
      pageId: urlParams.get('pageId'),
      pageName: urlParams.get('pageName'),
      instagramAccountId: urlParams.get('instagramAccountId'),
      allParams: Object.fromEntries(urlParams.entries())
    })

    if (instagramSuccess === 'success') {
      const pageId = urlParams.get('pageId')
      const pageName = urlParams.get('pageName')
      const instagramAccountId = urlParams.get('instagramAccountId')

      if (pageId && pageName) {
        console.log('🎉 Dashboard: Instagram OAuth Success Detected:', { 
          pageId, 
          pageName, 
          instagramAccountId,
          timestamp: new Date().toISOString()
        })

        setSuccessData({
          pageId,
          pageName: decodeURIComponent(pageName),
          instagramAccountId
        })
        setShowSuccessMessage(true)

        // Update Instagram status to connected
        setInstagramStatus(true)

        // Switch to Instagram tab to show the new connection
        setActiveTab('instagram')

        // Refresh Instagram status from backend
        setTimeout(() => {
          console.log('🔄 Dashboard: Refreshing Instagram status after OAuth success...')
          checkInstagramStatus()
        }, 1000)

        // Clear URL parameters
        navigate(location.pathname, { replace: true })

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          console.log('⏰ Dashboard: Auto-hiding success message')
          setShowSuccessMessage(false)
          setSuccessData(null)
        }, 5000)
      }
    }
  }, [location.search, navigate])

  const checkInstagramStatus = async () => {
    console.log('🔍 Dashboard: Checking Instagram Status...', {
      timestamp: new Date().toISOString(),
      currentStatus: instagramStatus,
      hasToken: !!localStorage.getItem('token'),
      userId: localStorage.getItem('userId')
    })
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('⚠️ Dashboard: No auth token found, skipping Instagram status check')
        setInstagramStatus(false)
        return
      }
      
      console.log('🔑 Dashboard: Using auth token:', token.substring(0, 20) + '...')
      
      const response = await api.get('/api/instagram/status')
      
      console.log('✅ Dashboard: Instagram Status Response:', {
        success: response.data.success,
        connected: response.data.connected,
        message: response.data.message,
        data: response.data.data,
        timestamp: new Date().toISOString()
      })
      
      setInstagramStatus(response.data.connected || false)
    } catch (error) {
      console.error('❌ Dashboard: Instagram Status Error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isAuthError: error.response?.status === 401,
        isNotFoundError: error.response?.status === 404,
        timestamp: new Date().toISOString()
      })
      setInstagramStatus(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Success Message */}
        {showSuccessMessage && successData && (
          <div className="bg-green-50 border-b border-green-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Instagram Connected Successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      Connected to {successData.pageName} (ID: {successData.pageId})
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">InstantChat</h1>
                <p className="text-sm text-gray-500">Automation Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Instagram Status */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${instagramStatus ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm ${instagramStatus ? 'text-green-600' : 'text-gray-500'}`}>
                    {instagramStatus ? 'Instagram Connected' : 'Instagram Not Connected'}
                  </span>
                </div>
                {!instagramStatus && (
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/connect-instagram')}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Connect Instagram
                  </Button>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
          <TabsTrigger value="chats" className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>Chats</span>
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center space-x-2">
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>Flows</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Automation</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

          {/* Chats Tab */}
          <TabsContent value="chats" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">General Chat</h2>
                <p className="text-gray-600">Manage your general conversations and messages</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
            <Chats user={user} />
          </TabsContent>

          {/* Instagram Tab */}
          <TabsContent value="instagram" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instagram Management</h2>
                <p className="text-gray-600">Direct messaging, conversations, analytics, and Instagram automation</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Instagram Sub-tabs */}
            <div className="bg-white rounded-lg border">
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
                    Chat
                  </button>
                  <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium">
                    Analytics
                  </button>
                </nav>
              </div>
              <div className="p-6">
                <InstagramChat />
              </div>
            </div>
          </TabsContent>

          {/* Flows Tab */}
          <TabsContent value="flows" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Flow Builder</h2>
                <p className="text-gray-600">Build and manage your automated conversation workflows</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                onClick={() => navigate('/flow-builder')}
              >
                <Bot className="w-4 h-4 mr-2" />
                Create Flow
              </Button>
            </div>
            <FlowBuilder user={user} />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instagram Automation</h2>
                <p className="text-gray-600">Manage automation flows, webhooks, and Instagram-specific features</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
            <InstagramAutomation />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
              <p className="text-gray-600">Manage your profile and connected accounts</p>
            </div>
            <Settings user={user} onLogout={handleLogout} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
