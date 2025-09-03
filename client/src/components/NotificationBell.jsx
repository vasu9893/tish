import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Filter, Search } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import useNotificationStore from '../stores/notificationStore';
import { toast } from 'sonner';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  
  const {
    notifications,
    unreadCount,
    filters,
    isLoading,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setFilters,
    getFilteredNotifications,
    getUnreadNotifications
  } = useNotificationStore();

  // Mock mode for testing
  const [mockMode, setMockMode] = useState(false);
  const [mockInterval, setMockInterval] = useState(null);

  useEffect(() => {
    // Load initial notifications
    loadNotifications();
    
    // Setup WebSocket connection (placeholder)
    setupWebSocket();
    
    return () => {
      if (mockInterval) {
        clearInterval(mockInterval);
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/notifications');
      // if (response.data?.success) {
      //   response.data.notifications.forEach(notif => addNotification(notif));
      // }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const setupWebSocket = () => {
    // TODO: Implement WebSocket connection
    // For now, just simulate connection
    setTimeout(() => {
      useNotificationStore.getState().setConnectionStatus(true);
    }, 1000);
  };

  const startMockMode = () => {
    if (mockMode) return;
    
    setMockMode(true);
    const interval = setInterval(() => {
      const mockEvents = [
        {
          eventType: 'comments',
          userInfo: { username: 'user_' + Math.floor(Math.random() * 1000) },
          content: { text: 'Great post! Love this content.' },
          timestamp: new Date().toISOString()
        },
        {
          eventType: 'messages',
          userInfo: { username: 'dm_user_' + Math.floor(Math.random() * 1000) },
          content: { text: 'Hi! I have a question about your services.' },
          timestamp: new Date().toISOString()
        },
        {
          eventType: 'mentions',
          userInfo: { username: 'mention_user_' + Math.floor(Math.random() * 1000) },
          content: { text: 'Check out this amazing account!' },
          timestamp: new Date().toISOString()
        }
      ];
      
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      addNotification(randomEvent);
      
      // Show toast for new notification
      toast(`${randomEvent.eventType}: ${randomEvent.content.text.substring(0, 50)}...`, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => setIsOpen(true)
        }
      });
    }, 3000); // Every 3 seconds
    
    setMockInterval(interval);
  };

  const stopMockMode = () => {
    if (mockInterval) {
      clearInterval(mockInterval);
      setMockInterval(null);
    }
    setMockMode(false);
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'comments': return '💬';
      case 'messages': return '💌';
      case 'mentions': return '🏷️';
      case 'live_comments': return '📺';
      case 'message_reactions': return '❤️';
      case 'message_postbacks': return '🔘';
      case 'message_referrals': return '🔗';
      case 'message_seen': return '👁️';
      default: return '🔔';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            variant="destructive"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white border rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? '🟢 Live' : '🔴 Offline'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mock Mode Toggle */}
            <div className="flex items-center space-x-2 mb-3">
              <Button
                size="sm"
                variant={mockMode ? 'destructive' : 'outline'}
                onClick={mockMode ? stopMockMode : startMockMode}
              >
                {mockMode ? '🛑 Stop Mock' : '🧪 Start Mock'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={filters.eventType}
                onValueChange={(value) => setFilters({ eventType: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="mentions">Mentions</SelectItem>
                  <SelectItem value="live_comments">Live Comments</SelectItem>
                  <SelectItem value="message_reactions">Reactions</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
                <p className="text-sm">New webhook events will appear here</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setShowDetails(notification);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getEventTypeIcon(notification.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.userInfo?.username || notification.senderId || 'Unknown User'}
                          </p>
                          <Badge className={getStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                          {notification.content?.text || 'No content available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {notification.eventType?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notification Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Type</label>
                  <p className="text-sm text-gray-900">{showDetails.eventType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusColor(showDetails.status)}>
                    {showDetails.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sender</label>
                  <p className="text-sm text-gray-900">
                    {showDetails.userInfo?.username || showDetails.senderId || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(showDetails.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-900">
                    {showDetails.content?.text || 'No content available'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Full Payload</label>
                <div className="mt-1 p-3 bg-gray-900 rounded border overflow-x-auto">
                  <pre className="text-xs text-green-400">
                    {JSON.stringify(showDetails, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDetails(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  markAsRead(showDetails.id);
                  setShowDetails(null);
                }}
                disabled={showDetails.isRead}
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

export default NotificationBell;
