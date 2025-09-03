import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import WebhookDashboard from '@/components/WebhookDashboard';
import WebhookNotifications from '@/components/WebhookNotifications';
import WebhookTestingPanel from '@/components/WebhookTestingPanel';
import WebhookMonitoringDashboard from '@/components/WebhookMonitoringDashboard';

const WebhookManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Management System</h1>
          <p className="text-muted-foreground">
            Complete Instagram webhook management, testing, and monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">v2.0.0</Badge>
          <Badge variant="secondary">Production Ready</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Badge className="bg-green-100 text-green-800">Healthy</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✅</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Badge variant="outline">0</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Instagram accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Processed</CardTitle>
            <Badge variant="outline">0</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Webhook events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Badge variant="outline">100%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              Event processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Webhook Management System Features</CardTitle>
          <CardDescription>
            Comprehensive Instagram webhook integration with advanced management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🔗 Meta API Integration</h4>
              <p className="text-sm text-muted-foreground">
                Full integration with Instagram Graph API for webhook subscriptions
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🛡️ Security & Validation</h4>
              <p className="text-sm text-muted-foreground">
                X-Hub-Signature-256 validation and payload verification
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📊 Real-time Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Live system health checks and performance metrics
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🧪 Comprehensive Testing</h4>
              <p className="text-sm text-muted-foreground">
                Test suite creation and execution for all event types
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📈 Analytics & Insights</h4>
              <p className="text-sm text-muted-foreground">
                Detailed event tracking and subscription management
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ High Performance</h4>
              <p className="text-sm text-muted-foreground">
                Batching, retry mechanisms, and deduplication
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 Getting Started</CardTitle>
                <CardDescription>
                  Quick setup guide for Instagram webhook integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">1</Badge>
                    <div>
                      <h4 className="font-medium">Configure Meta App</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up webhook URL and verify token in Meta App Dashboard
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">2</Badge>
                    <div>
                      <h4 className="font-medium">Connect Instagram Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Authenticate and connect your Instagram Business account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">3</Badge>
                    <div>
                      <h4 className="font-medium">Subscribe to Events</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose which webhook events to receive notifications for
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">4</Badge>
                    <div>
                      <h4 className="font-medium">Test & Monitor</h4>
                      <p className="text-sm text-muted-foreground">
                        Use testing tools and monitor system health
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supported Events */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Supported Webhook Events</CardTitle>
                <CardDescription>
                  All Instagram webhook event types supported by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">comments</Badge>
                    <span className="text-sm text-muted-foreground">Post comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">live_comments</Badge>
                    <span className="text-sm text-muted-foreground">Live stream comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">messages</Badge>
                    <span className="text-sm text-muted-foreground">Direct messages</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">mentions</Badge>
                    <span className="text-sm text-muted-foreground">Account mentions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">message_reactions</Badge>
                    <span className="text-sm text-muted-foreground">Message reactions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">message_postbacks</Badge>
                    <span className="text-sm text-muted-foreground">Message postbacks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">message_referrals</Badge>
                    <span className="text-sm text-muted-foreground">Message referrals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">message_seen</Badge>
                    <span className="text-sm text-muted-foreground">Message read receipts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ System Requirements</CardTitle>
              <CardDescription>
                Technical requirements and configuration details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Backend Requirements</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Node.js 18+ with Express.js</li>
                    <li>• MongoDB database connection</li>
                    <li>• HTTPS endpoint with valid SSL certificate</li>
                    <li>• Meta App ID and App Secret</li>
                    <li>• Webhook verification token</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Instagram Requirements</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Instagram Business or Creator account</li>
                    <li>• Advanced Access permissions (for comments)</li>
                    <li>• Instagram Business Basic permissions</li>
                    <li>• Valid Instagram access token</li>
                    <li>• Public account for comment notifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <WebhookDashboard />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <WebhookTestingPanel />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <WebhookMonitoringDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <WebhookNotifications />
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Additional Resources</CardTitle>
          <CardDescription>
            Documentation and support resources for the webhook system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">📖 Documentation</h4>
              <p className="text-sm text-muted-foreground">
                Complete API documentation and integration guides
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Docs
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔧 API Reference</h4>
              <p className="text-sm text-muted-foreground">
                Detailed endpoint documentation and examples
              </p>
              <Button variant="outline" size="sm" className="w-full">
                API Docs
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">💬 Support</h4>
              <p className="text-sm text-muted-foreground">
                Get help with setup and troubleshooting
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Get Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagement;
