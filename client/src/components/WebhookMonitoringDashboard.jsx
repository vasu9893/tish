import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import api from '../utils/api';

const WebhookMonitoringDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all monitoring data in parallel
      const [dashboardResponse, statusResponse, errorsResponse] = await Promise.all([
        api.get('/api/webhooks/monitoring/dashboard'),
        api.get('/api/webhooks/monitoring/status'),
        api.get('/api/webhooks/monitoring/errors')
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      }
      
      if (statusResponse.success) {
        setSystemStatus(statusResponse.data);
      }
      
      if (errorsResponse.success) {
        setErrorAnalysis(errorsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const performManualHealthCheck = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/webhooks/monitoring/health-check');
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Manual health check completed',
        });
        
        // Reload dashboard data
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to perform health check:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform health check',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '⏳';
    }
  };

  const formatUptime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (!dashboardData && !systemStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhook Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of webhook system health, performance, and errors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </Button>
          <Button
            onClick={performManualHealthCheck}
            disabled={loading}
          >
            🏥 Manual Health Check
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* System Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Badge className={getHealthStatusColor(systemStatus?.status || 'unknown')}>
                  {systemStatus?.status || 'unknown'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getHealthStatusIcon(systemStatus?.status || 'unknown')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(systemStatus?.uptime || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Total Events Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Badge variant="outline">
                  {dashboardData?.database?.total || 0}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.database?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processed events
                </p>
              </CardContent>
            </Card>

            {/* Success Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Badge variant="outline">
                  {dashboardData?.database?.total > 0 
                    ? `${((dashboardData.database.completed / dashboardData.database.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.database?.total > 0 
                    ? `${((dashboardData.database.completed / dashboardData.database.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.database?.completed || 0} completed
                </p>
              </CardContent>
            </Card>

            {/* Active Subscriptions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Badge variant="outline">
                  {systemStatus?.activeSubscriptions || 0}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.activeSubscriptions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Webhook subscriptions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest webhook events and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentEvents?.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recentEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{event.eventType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <Badge className={getHealthStatusColor(event.processedStatus)}>
                        {event.processedStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Status</CardTitle>
              <CardDescription>
                Comprehensive health check results and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.health ? (
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">Overall System Health</h4>
                      <p className="text-sm text-muted-foreground">
                        Last checked: {formatTimestamp(dashboardData.health.timestamp)}
                      </p>
                    </div>
                    <Badge className={getHealthStatusColor(dashboardData.health.overall)}>
                      {dashboardData.health.overall}
                    </Badge>
                  </div>

                  {/* Health Checks */}
                  <div className="space-y-3">
                    {Object.entries(dashboardData.health.checks).map(([checkName, checkData]) => (
                      <div key={checkName} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h5 className="font-medium capitalize">{checkName.replace(/([A-Z])/g, ' $1')}</h5>
                          <p className="text-sm text-muted-foreground">{checkData.message}</p>
                        </div>
                        <Badge className={getHealthStatusColor(checkData.status)}>
                          {checkData.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {dashboardData.health.recommendations?.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <h5 className="font-medium mb-2">Recommendations:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {dashboardData.health.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No health data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Real-time performance statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.performance ? (
                <div className="space-y-6">
                  {/* Event Processing Stats */}
                  <div>
                    <h4 className="font-semibold mb-3">Event Processing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardData.performance.eventStats?.total || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Events</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {dashboardData.performance.eventStats?.successRate || 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-2xl font-bold text-orange-600">
                          {dashboardData.performance.performanceStats?.eventsLastHour || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Events/Hour</div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Stats */}
                  <div>
                    <h4 className="font-semibold mb-3">Subscription Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-2xl font-bold text-purple-600">
                          {dashboardData.performance.subscriptionStats?.active || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <div className="text-2xl font-bold text-indigo-600">
                          {dashboardData.performance.subscriptionStats?.activeRate || 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Active Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Trends */}
                  <div>
                    <h4 className="font-semibold mb-3">Performance Trends</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Processing Efficiency</span>
                        <span className="text-sm font-medium">
                          {dashboardData.performance.performanceStats?.averageProcessingAttempts || 0} avg attempts
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((dashboardData.performance.performanceStats?.averageProcessingAttempts || 1) * 20, 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Detailed error tracking and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorAnalysis ? (
                <div className="space-y-4">
                  {/* Error Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {errorAnalysis.totalErrors || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Errors</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {errorAnalysis.totalOccurrences || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Occurrences</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {errorAnalysis.errorGroups?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Error Types</div>
                    </div>
                  </div>

                  {/* Error Groups */}
                  {errorAnalysis.errorGroups?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Error Types</h4>
                      <div className="space-y-2">
                        {errorAnalysis.errorGroups.map((group, index) => (
                          <div key={index} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{group.type}</span>
                              <Badge variant="outline">
                                {group.totalOccurrences} occurrences
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              First: {formatTimestamp(group.firstOccurrence)} | 
                              Last: {formatTimestamp(group.lastOccurrence)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {errorAnalysis.recommendations?.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <h5 className="font-medium mb-2">Error Recommendations:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {errorAnalysis.recommendations.map((rec, index) => (
                            <li key={index}>
                              <span className={`font-medium ${
                                rec.priority === 'high' ? 'text-red-600' : 
                                rec.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                              }`}>
                                [{rec.priority.toUpperCase()}]
                              </span> {rec.message}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No error data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookMonitoringDashboard;
