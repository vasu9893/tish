import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Heart, AtSign, Play, Filter, Search, MoreHorizontal, RefreshCw, Wifi, WifiOff, Instagram, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import useNotificationStore from '../stores/notificationStore';
import socketIOService from '../services/websocketService';
import { toast } from 'sonner';
import io from 'socket.io-client';

const NotificationDashboard = () => {
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [stats, setStats] = useState({
    totalEvents: 0,
    eventsToday: 0,
    activeFlows: 0,
    responseRate: 0
  });
  
  const {
    notifications,
    unreadCount,
    filters,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    setFilters,
    getFilteredNotifications,
    getUnreadNotifications
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications()
    setupSocketConnection()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const setupSocketConnection = () => {
    try {
      // Connect to Socket.IO server
      const newSocket = io('https://tish-production.up.railway.app', {
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server')
        setIsConnected(true)
        
        // Authenticate with JWT token
        const token = localStorage.getItem('token')
        if (token) {
          newSocket.emit('authenticate', { token })
        }
      })

      newSocket.on('authenticated', (data) => {
        if (data.success) {
          console.log('✅ Socket.IO authenticated:', data.user.username)
        } else {
          console.error('❌ Socket.IO authentication failed:', data.error)
        }
      })

      // Listen for new webhook events
      newSocket.on('new_webhook_event', (data) => {
        console.log('🔔 New webhook event received:', data)
        if (data.type === 'instagram_webhook') {
          // Add new notification to the list
          setNotifications(prev => [data.event, ...prev])
          // Update stats
          updateStats([data.event, ...notifications])
          
          // Show toast notification
          showToast(`New ${data.event.eventType} event received!`)
        }
      })

      // Listen for webhook event broadcasts
      newSocket.on('webhook_event_broadcast', (data) => {
        console.log('📡 Webhook event broadcast:', data)
        if (data.type === 'instagram_webhook') {
          // Update notifications if not already added
          setNotifications(prev => {
            const exists = prev.find(n => n.id === data.event.id)
            if (!exists) {
              return [data.event, ...prev]
            }
            return prev
          })
        }
      })

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.IO server')
        setIsConnected(false)
      })

      newSocket.on('error', (error) => {
        console.error('❌ Socket.IO error:', error)
      })

      setSocket(newSocket)
      
    } catch (error) {
      console.error('❌ Failed to setup Socket.IO connection:', error)
    }
  }

  const showToast = (message) => {
    // Create a simple toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
    toast.textContent = message
    document.body.appendChild(toast)
    
    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }

  const updateStats = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const eventsToday = notifications.filter(n => new Date(n.timestamp) >= startOfDay).length;
    const totalEvents = notifications.length;
    const activeFlows = notifications.filter(n => n.eventType === 'flow_execution').length;
    const responseRate = totalEvents > 0 ? Math.round((activeFlows / totalEvents) * 100) : 0;
    
    setStats({
      totalEvents,
      eventsToday,
      activeFlows,
      responseRate
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadNotifications = getUnreadNotifications();
  const displayNotifications = showAll ? filteredNotifications : unreadNotifications.slice(0, 5);

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'comments': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'mentions': return <AtSign className="w-4 h-4 text-purple-600" />;
      case 'live_comments': return <Play className="w-4 h-4 text-orange-600" />;
      case 'message_reactions': return <Heart className="w-4 h-4 text-red-600" />;
      case 'message_postbacks': return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'message_referrals': return <MessageSquare className="w-4 h-4 text-teal-600" />;
      case 'message_seen': return <MessageSquare className="w-4 h-4 text-gray-600" />;
      case 'flow_execution': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'webhook_error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'comments': return 'bg-blue-100 text-blue-800';
      case 'mentions': return 'bg-purple-100 text-purple-800';
      case 'live_comments': return 'bg-orange-100 text-orange-800';
      case 'message_reactions': return 'bg-red-100 text-red-800';
      case 'message_postbacks': return 'bg-indigo-100 text-indigo-800';
      case 'message_referrals': return 'bg-teal-100 text-teal-800';
      case 'message_seen': return 'bg-gray-100 text-gray-800';
      case 'flow_execution': return 'bg-green-100 text-green-800';
      case 'webhook_error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const handleReconnect = () => {
    socketIOService.disconnect();
    setTimeout(() => {
      socketIOService.connect();
      toast.info('Reconnecting to notification service...');
    }, 1000);
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Connected';
      case 'connecting': return '🟡 Connecting';
      case 'disconnected': return '🔴 Disconnected';
      default: return '⚪ Unknown';
    }
  };

  const getEventTypeLabel = (eventType) => {
    switch (eventType) {
      case 'comments': return 'Comment';
      case 'mentions': return 'Mention';
      case 'live_comments': return 'Live Comment';
      case 'message_reactions': return 'Reaction';
      case 'message_postbacks': return 'Postback';
      case 'message_referrals': return 'Referral';
      case 'message_seen': return 'Seen';
      case 'flow_execution': return 'Flow Executed';
      case 'webhook_error': return 'Webhook Error';
      default: return 'Event';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All time webhook events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsToday}</div>
            <p className="text-xs text-muted-foreground">
              Instagram activity today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFlows}</div>
            <p className="text-xs text-muted-foreground">
              Automation responses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Automated responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Instagram Webhook Events</h2>
          <p className="text-gray-600">Real-time notifications from Instagram webhooks and automated responses</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Socket.IO Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live Connected' : 'Live Disconnected'}
            </span>
          </div>
          
          <Button 
            onClick={loadNotifications} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h4 className="font-medium text-gray-900">
                {connectionStatus === 'connected' ? 'Connected to Instagram' : 'Not Connected'}
              </h4>
              <p className="text-sm text-gray-600">
                {connectionStatus === 'connected' 
                  ? 'Receiving real-time webhook events from Instagram' 
                  : 'Connect your Instagram account to receive notifications'
                }
              </p>
            </div>
          </div>
          {connectionStatus !== 'connected' && (
            <Button
              size="sm"
              onClick={() => window.location.href = '/connect-instagram'}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
            >
              <Instagram className="w-4 h-4 mr-2" />
              Connect Instagram
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          value={filters.eventType}
          onValueChange={(value) => setFilters({ eventType: value })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Event Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Event Types</SelectItem>
            <SelectItem value="comments">Comments</SelectItem>
            <SelectItem value="mentions">Mentions</SelectItem>
            <SelectItem value="live_comments">Live Comments</SelectItem>
            <SelectItem value="message_reactions">Reactions</SelectItem>
            <SelectItem value="flow_execution">Flow Execution</SelectItem>
            <SelectItem value="webhook_error">Webhook Errors</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="h-9"
        />

        <Button
          variant="outline"
          onClick={() => setShowAll(!showAll)}
          className="h-9"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showAll ? 'Show Unread Only' : 'Show All'}
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p>Loading webhook events...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No webhook events</p>
              <p className="text-sm">
                {connectionStatus === 'connected' 
                  ? 'New Instagram events will appear here' 
                  : 'Connect Instagram to receive webhook events'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getEventTypeIcon(notification.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.userInfo?.username || notification.senderId || 'Instagram User'}
                          </p>
                          <Badge className={getEventTypeColor(notification.eventType)}>
                            {getEventTypeLabel(notification.eventType)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.content?.text || notification.message || 'No content available'}
                      </p>
                      
                      {notification.processingError && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Processing Error:</strong> {notification.processingError}
                        </div>
                      )}
                      
                      {notification.flowResponse && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          <strong>Automated Response:</strong> {notification.flowResponse}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getEventTypeIcon(selectedNotification.eventType)}
                <Badge className={getEventTypeColor(selectedNotification.eventType)}>
                  {getEventTypeLabel(selectedNotification.eventType)}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">User</h4>
                <p className="text-sm text-gray-600">
                  {selectedNotification.userInfo?.username || selectedNotification.senderId || 'Unknown'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Content</h4>
                <p className="text-sm text-gray-600">
                  {selectedNotification.content?.text || selectedNotification.message || 'No content'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Timestamp</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedNotification.timestamp).toLocaleString()}
                </p>
              </div>
              
              {selectedNotification.processingError && (
                <div>
                  <h4 className="font-medium text-red-900">Processing Error</h4>
                  <p className="text-sm text-red-700">{selectedNotification.processingError}</p>
                </div>
              )}
              
              {selectedNotification.flowResponse && (
                <div>
                  <h4 className="font-medium text-green-900">Automated Response</h4>
                  <p className="text-sm text-green-700">{selectedNotification.flowResponse}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>
              {!selectedNotification.isRead && (
                <Button
                  onClick={() => {
                    markAsRead(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDashboard;
