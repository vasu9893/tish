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
  X,
  Bell,
  Activity,
  TrendingUp
} from 'lucide-react'
import Chats from './Chats'
import FlowBuilder from './FlowBuilder'
import Settings from './Settings'
import InstagramAutomation from '../components/InstagramAutomation'
import InstagramAnalytics from '../components/InstagramAnalytics'
import NotificationDashboard from '../components/NotificationDashboard'
import NotificationBell from '../components/NotificationBell'
import api from '../utils/api'
import { Badge } from '../components/ui/badge'

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('notifications')
  const [instagramStatus, setInstagramStatus] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Add error boundary
    useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
      setActiveTab('notifications')
    }
  }, [location.state])

  useEffect(() => {
    checkInstagramStatus()
    
    // Refresh Instagram status every 30 seconds
    const interval = setInterval(checkInstagramStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const checkInstagramStatus = async () => {
    try {
      setIsLoadingStatus(true)
      const response = await api.get('/api/instagram/status')
      console.log('Instagram status response:', response.data)
      
      if (response.data.success && response.data.connected) {
        setInstagramStatus(response.data.data)
        setIsConnected(true)
        console.log('✅ Instagram is connected:', response.data.data)
      } else {
        setInstagramStatus(null)
        setIsConnected(false)
        console.log('❌ Instagram is not connected. Status:', response.data)
      }
    } catch (error) {
      console.error('Failed to check Instagram status:', error)
      setInstagramStatus(null)
      setIsConnected(false)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const handleSuccessMessage = (data) => {
    setSuccessData(data)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
                  {isLoadingStatus ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <span className="text-sm text-blue-600">Checking...</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                        {isConnected ? 'Instagram Connected' : 'Instagram Not Connected'}
                      </span>
                      {instagramStatus && (
                        <div className="flex items-center space-x-2 ml-2">
                          <span className="text-xs text-gray-400">
                            ({instagramStatus.username || instagramStatus.instagramUsername})
                          </span>
                          {instagramStatus.accountType && (
                            <Badge variant="outline" className="text-xs">
                              {instagramStatus.accountType}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Refresh Button */}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={checkInstagramStatus}
                  disabled={isLoadingStatus}
                  className="px-2 py-1"
                  title="Refresh Instagram status"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                </Button>
                
                {!isConnected && !isLoadingStatus && (
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

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
              <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                  </div>
                <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccessMessage && successData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mx-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <p className="text-sm text-green-700">{successData.message}</p>
              </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-600 hover:text-green-700"
                >
              <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
          </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl mx-auto">
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
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
            <TabsTrigger value="webhooks" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Webhooks</span>
            </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

          {/* Notifications Tab - Now Primary */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Real-time Notifications</h2>
                <p className="text-gray-600">Monitor Instagram webhook events, comments, mentions, and engagement in real-time</p>
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
            
            <NotificationDashboard />
          </TabsContent>

          {/* Instagram Tab - Focused on Management */}
          <TabsContent value="instagram" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instagram Management</h2>
                <p className="text-gray-600">Manage Instagram connections, automation, and analytics</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    checkInstagramStatus()
                    window.location.reload()
                  }}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Instagram Management Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <InstagramAutomation />
              </div>
              <div className="bg-white rounded-lg border p-6">
                <InstagramAnalytics />
              </div>
            </div>
          </TabsContent>

          {/* Flows Tab */}
          <TabsContent value="flows" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Automation Flows</h2>
                <p className="text-gray-600">Build and manage automated workflows for Instagram engagement</p>
              </div>
              <div className="flex space-x-2">
              <Button 
                onClick={() => navigate('/flow-builder')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Flow
              </Button>
            </div>
            </div>
            
            <FlowBuilder />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Automation Dashboard</h2>
                <p className="text-gray-600">Monitor and control your automated Instagram workflows</p>
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
            
            {/* Automation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Flows</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automated Responses</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.5% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => navigate('/flow-builder')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Create New Flow
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('flows')}
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View All Flows
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Webhook Management</h2>
                <p className="text-gray-600">Configure and monitor Instagram webhook endpoints for real-time notifications</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => navigate('/webhook-management')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Open Webhook Dashboard
                </Button>
              </div>
            </div>
            
            {/* Webhook Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Webhook Status</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor your Instagram webhook connection and event processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status</span>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Event</span>
                    <span className="text-sm text-gray-500">2 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Events Today</span>
                    <span className="text-sm text-gray-500">47</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span>Event Types</span>
                  </CardTitle>
                  <CardDescription>
                    Configure which Instagram events to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comments</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mentions</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Message Reactions</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Live Comments</span>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => navigate('/webhook-management')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Open Webhook Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/webhook-management?tab=testing')}
                  className="w-full"
                >
                  🧪 Test Webhooks
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600">Manage your account settings and preferences</p>
              </div>
            </div>
            
            <Settings user={user} onUpdate={handleSuccessMessage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
