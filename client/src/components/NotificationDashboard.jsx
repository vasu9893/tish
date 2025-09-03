import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Heart, AtSign, Play, Filter, Search, MoreHorizontal, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import useNotificationStore from '../stores/notificationStore';
import websocketService from '../services/websocketService';
import { toast } from 'sonner';

const NotificationDashboard = () => {
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
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
    // Listen for connection status changes
    const unsubscribe = useNotificationStore.subscribe(
      (state) => state.isConnected,
      (isConnected) => {
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      }
    );
    
    return () => unsubscribe();
  }, []);

  const filteredNotifications = getFilteredNotifications();
  const unreadNotifications = getUnreadNotifications();
  const displayNotifications = showAll ? filteredNotifications : unreadNotifications.slice(0, 5);

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'comments': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'messages': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'mentions': return <AtSign className="w-4 h-4 text-purple-600" />;
      case 'live_comments': return <Play className="w-4 h-4 text-orange-600" />;
      case 'message_reactions': return <Heart className="w-4 h-4 text-red-600" />;
      case 'message_postbacks': return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'message_referrals': return <MessageSquare className="w-4 h-4 text-teal-600" />;
      case 'message_seen': return <MessageSquare className="w-4 h-4 text-gray-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'comments': return 'bg-blue-100 text-blue-800';
      case 'messages': return 'bg-green-100 text-green-800';
      case 'mentions': return 'bg-purple-100 text-purple-800';
      case 'live_comments': return 'bg-orange-100 text-orange-800';
      case 'message_reactions': return 'bg-red-100 text-red-800';
      case 'message_postbacks': return 'bg-indigo-100 text-indigo-800';
      case 'message_referrals': return 'bg-teal-100 text-teal-800';
      case 'message_seen': return 'bg-gray-100 text-gray-800';
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
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const handleReconnect = () => {
    websocketService.disconnect();
    setTimeout(() => {
      websocketService.connect();
      toast.info('Reconnecting to notification service...');
    }, 1000);
  };

  const getEventTypeLabel = (eventType) => {
    return eventType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-600" />;
      default: return <WifiOff className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Live';
      case 'connecting': return '🟡 Connecting...';
      case 'disconnected': return '🔴 Offline';
      default: return '⚪ Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="text-xs">
            {getConnectionStatusText()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            disabled={connectionStatus === 'connecting'}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getConnectionStatusIcon()}
            <div>
              <p className="text-sm font-medium text-gray-900">
                WebSocket Connection Status
              </p>
              <p className="text-xs text-gray-500">
                {websocketService.getBackendUrl()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Status</p>
            <p className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' : 
              connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </p>
          </div>
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
            <SelectItem value="messages">Messages</SelectItem>
            <SelectItem value="mentions">Mentions</SelectItem>
            <SelectItem value="live_comments">Live Comments</SelectItem>
            <SelectItem value="message_reactions">Reactions</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search notifications..."
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
              <p>Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm">
                {connectionStatus === 'connected' 
                  ? 'New webhook events will appear here' 
                  : 'Connect to receive notifications'
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
                            {notification.userInfo?.username || notification.senderId || 'Unknown User'}
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
                        {notification.content?.text || 'No content available'}
                      </p>
                      
                      {notification.processingError && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Error:</strong> {notification.processingError}
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

      {/* Show More/Less Button */}
      {filteredNotifications.length > 5 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
            {showAll ? 'Show Less' : `Show All (${filteredNotifications.length})`}
          </Button>
        </div>
      )}

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getEventTypeIcon(selectedNotification.eventType)}
                <h3 className="text-lg font-semibold">Notification Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Type</label>
                  <p className="text-sm text-gray-900">
                    {getEventTypeLabel(selectedNotification.eventType)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={selectedNotification.isRead ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}>
                    {selectedNotification.isRead ? 'Read' : 'New'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sender</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotification.userInfo?.username || selectedNotification.senderId || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedNotification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-900">
                    {selectedNotification.content?.text || 'No content available'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Full Payload</label>
                <div className="mt-1 p-3 bg-gray-900 rounded border overflow-x-auto">
                  <pre className="text-xs text-green-400">
                    {JSON.stringify(selectedNotification.payload || selectedNotification, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  markAsRead(selectedNotification.id);
                  setSelectedNotification(null);
                }}
                disabled={selectedNotification.isRead}
              >
                Mark as Read
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDashboard;
