import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  AtSign, 
  X, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const WebhookNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, messages, comments, mentions

  // Simulate real-time webhook events (replace with actual WebSocket/SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate incoming webhook events
      if (Math.random() < 0.3) { // 30% chance of new event
        addNotification(generateMockEvent());
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const generateMockEvent = () => {
    const eventTypes = ['messages', 'comments', 'mentions', 'message_reactions'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const mockEvents = {
      messages: {
        eventType: 'messages',
        content: { text: 'Hey! I love your latest post! 🔥' },
        userInfo: { username: 'user_' + Math.random().toString(36).substring(2, 8) },
        timestamp: new Date()
      },
      comments: {
        eventType: 'comments',
        content: { text: 'This is amazing! Keep it up! 👏' },
        userInfo: { username: 'commenter_' + Math.random().toString(36).substring(2, 8) },
        timestamp: new Date()
      },
      mentions: {
        eventType: 'mentions',
        content: { text: 'Check out this awesome content! @instantchat' },
        userInfo: { username: 'mentioner_' + Math.random().toString(36).substring(2, 8) },
        timestamp: new Date()
      },
      message_reactions: {
        eventType: 'message_reactions',
        content: { text: '❤️' },
        userInfo: { username: 'reactor_' + Math.random().toString(36).substring(2, 8) },
        timestamp: new Date()
      }
    };

    return mockEvents[eventType];
  };

  const addNotification = (event) => {
    const notification = {
      id: Date.now() + Math.random(),
      ...event,
      read: false,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast.success(`New ${event.eventType} from ${event.userInfo.username}`, {
      description: event.content.text?.substring(0, 50) + '...',
      action: {
        label: 'View',
        onClick: () => setIsOpen(true)
      }
    });
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Recalculate unread count
    const newUnreadCount = notifications.filter(n => n.id !== notificationId && !n.read).length;
    setUnreadCount(newUnreadCount);
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'messages': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'comments': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'live_comments': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'message_reactions': return <Heart className="w-4 h-4 text-red-600" />;
      case 'mentions': return <AtSign className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventTypeLabel = (eventType) => {
    switch (eventType) {
      case 'messages': return 'Message';
      case 'comments': return 'Comment';
      case 'live_comments': return 'Live Comment';
      case 'message_reactions': return 'Reaction';
      case 'mentions': return 'Mention';
      default: return eventType;
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'messages': return 'bg-blue-100 text-blue-800';
      case 'comments': return 'bg-green-100 text-green-800';
      case 'live_comments': return 'bg-purple-100 text-purple-800';
      case 'message_reactions': return 'bg-red-100 text-red-800';
      case 'mentions': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.eventType === filter;
  });

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Notification Panel */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-96 bg-white border rounded-lg shadow-lg z-50">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark all read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-1">
                  {['all', 'messages', 'comments', 'mentions'].map((tab) => (
                    <Button
                      key={tab}
                      variant={filter === tab ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(tab)}
                      className="text-xs"
                    >
                      {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-1 p-2">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                {getEventTypeIcon(notification.eventType)}
                                <Badge className={getEventTypeColor(notification.eventType)}>
                                  {getEventTypeLabel(notification.eventType)}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {notification.userInfo.username}
                              </p>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {notification.content.text}
                              </p>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {notification.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Test Button for Demo */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => addNotification(generateMockEvent())}
        className="ml-2"
      >
        Test Notification
      </Button>
    </>
  );
};

export default WebhookNotifications;
