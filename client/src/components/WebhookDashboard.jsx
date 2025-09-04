import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bell, 
  Settings, 
  Activity, 
  MessageSquare, 
  Heart, 
  AtSign,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const WebhookDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    status: '',
    accountId: '',
    startDate: '',
    endDate: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, eventsRes, statsRes] = await Promise.all([
        api.get('/api/webhooks/subscriptions'),
        api.get('/api/webhooks/events'),
        api.get('/api/webhooks/stats')
      ]);

      if (subsRes.data?.success) setSubscriptions(subsRes.data.data);
      if (eventsRes.data?.success) setEvents(eventsRes.data.data.events);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to load webhook data:', error);
      toast.error('Failed to load webhook data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (subscriptionData) => {
    try {
      const response = await api.post('/api/webhooks/subscriptions', subscriptionData);
      if (response.data?.success) {
        toast.success('Webhook subscription created successfully');
        loadData();
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription');
    }
  };

  const handleToggleSubscription = async (subscriptionId, enabled) => {
    try {
      const response = await api.put(`/api/webhooks/subscriptions/${subscriptionId}`, {
        status: enabled ? 'active' : 'inactive'
      });
      if (response.data?.success) {
        toast.success(`Subscription ${enabled ? 'activated' : 'deactivated'}`);
        loadData();
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    
    try {
      const response = await api.delete(`/api/webhooks/subscriptions/${subscriptionId}`);
      if (response.data?.success) {
        toast.success('Subscription deleted successfully');
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const handleRetryEvent = async (eventId) => {
    try {
      const response = await api.post(`/api/webhooks/events/${eventId}/retry`);
      if (response.data?.success) {
        toast.success('Event queued for retry');
        loadData();
      }
    } catch (error) {
      console.error('Failed to retry event:', error);
      toast.error('Failed to retry event');
    }
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'messages': return <MessageSquare className="w-4 h-4" />;
      case 'comments': return <MessageSquare className="w-4 h-4" />;
      case 'live_comments': return <MessageSquare className="w-4 h-4" />;
      case 'message_reactions': return <Heart className="w-4 h-4" />;
      case 'mentions': return <AtSign className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getProcessedStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      retry: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading webhook data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-gray-600">Manage Instagram webhook subscriptions and monitor events</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.database?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.database?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.database?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{stats.database?.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getEventTypeIcon(event.eventType)}
                          <span className="text-sm font-medium">{event.eventType}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getProcessedStatusBadge(event.processedStatus)}
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Event Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.eventTypes && stats.eventTypes.length > 0 ? (
                    stats.eventTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getEventTypeIcon(type._id)}
                          <span className="text-sm font-medium">{type._id}</span>
                        </div>
                        <Badge variant="secondary">{type.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No event types data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhook Subscriptions</h3>
            <Button onClick={() => setActiveTab('create')}>
              <Bell className="w-4 h-4 mr-2" />
              Create Subscription
            </Button>
          </div>

          <div className="space-y-4">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((subscription) => (
              <Card key={subscription.subscriptionId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">Account: {subscription.instagramAccountId}</h4>
                        {getStatusBadge(subscription.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {subscription.subscribedFields.map((field, index) => (
                          <Badge key={index} variant="outline">
                            {field.field}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>Total Events: {subscription.stats?.totalEvents || 0}</p>
                        <p>Last Activity: {subscription.lastActivity ? new Date(subscription.lastActivity).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSubscription(
                          subscription.subscriptionId,
                          subscription.status === 'inactive'
                        )}
                      >
                        {subscription.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('edit')}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSubscription(subscription.subscriptionId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No subscriptions found. Create your first webhook subscription to get started.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={filters.eventType} onValueChange={(value) => setFilters({...filters, eventType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="messages">Messages</SelectItem>
                    <SelectItem value="comments">Comments</SelectItem>
                    <SelectItem value="mentions">Mentions</SelectItem>
                    <SelectItem value="message_reactions">Reactions</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Account ID"
                  value={filters.accountId}
                  onChange={(e) => setFilters({...filters, accountId: e.target.value})}
                />

                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />

                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="space-y-4">
            {events && events.length > 0 ? (
              events.map((event) => (
              <Card key={event.eventId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getEventTypeIcon(event.eventType)}
                        <h4 className="font-semibold">{event.eventType}</h4>
                        {getProcessedStatusBadge(event.processedStatus)}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <p>From: {event.userInfo?.username || event.senderId}</p>
                        <p>Content: {event.content?.text?.substring(0, 100) || 'No content'}...</p>
                        <p>Time: {new Date(event.timestamp).toLocaleString()}</p>
                      </div>

                      {event.processingError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Error: {event.processingError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {event.processedStatus === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryEvent(event.eventId)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No events found. Webhook events will appear here once they are received.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookDashboard;
