import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import api from '../utils/api';

const WebhookTestingPanel = () => {
  const [testSuites, setTestSuites] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [formData, setFormData] = useState({
    accountId: '',
    senderId: '',
    senderUsername: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/webhooks/testing/suites');
      if (response.success) {
        setTestSuites(response.data.suites || []);
        setTestResults(response.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load test suites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test suites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestSuite = async () => {
    try {
      if (!formData.accountId || !formData.senderId || !formData.senderUsername) {
        toast({
          title: 'Validation Error',
          description: 'All fields are required',
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      const response = await api.post('/api/webhooks/testing/create-suite', formData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Test suite created successfully',
        });
        
        // Reset form and reload suites
        setFormData({ accountId: '', senderId: '', senderUsername: '' });
        await loadTestSuites();
      }
    } catch (error) {
      console.error('Failed to create test suite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test suite',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeTestSuite = async (suiteId) => {
    try {
      setLoading(true);
      const response = await api.post(`/api/webhooks/testing/execute-suite/${suiteId}`);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Test suite executed: ${response.data.passed}/${response.data.totalTests} passed`,
        });
        
        // Reload results
        await loadTestSuites();
      }
    } catch (error) {
      console.error('Failed to execute test suite:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute test suite',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/webhooks/testing/cleanup');
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Old test data cleaned up successfully',
        });
        
        // Reload data
        await loadTestSuites();
      }
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup test data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'error': return '⚠️';
      default: return '⏳';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhook Testing Panel</h2>
          <p className="text-muted-foreground">
            Create and execute comprehensive webhook test suites for Instagram events
          </p>
        </div>
        <Button 
          onClick={cleanupTestData} 
          disabled={loading}
          variant="outline"
        >
          🧹 Cleanup Old Data
        </Button>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Test Suite</TabsTrigger>
          <TabsTrigger value="suites">Test Suites</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Test Suite</CardTitle>
              <CardDescription>
                Create a comprehensive test suite covering all Instagram webhook event types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Instagram Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="17841466879910630"
                    value={formData.accountId}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender User ID</Label>
                  <Input
                    id="senderId"
                    placeholder="123456789"
                    value={formData.senderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, senderId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderUsername">Sender Username</Label>
                  <Input
                    id="senderUsername"
                    placeholder="test_user"
                    value={formData.senderUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, senderUsername: e.target.value }))}
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  This will create a test suite covering: comments, messages, mentions, live_comments, 
                  message_reactions, message_postbacks, message_referrals, and message_seen events.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={createTestSuite} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating...' : '🧪 Create Test Suite'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Suites ({testSuites.length})</CardTitle>
              <CardDescription>
                Manage and execute your webhook test suites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testSuites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test suites created yet. Create one in the "Create Test Suite" tab.
                </div>
              ) : (
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div key={suite.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Suite: {suite.id}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(suite.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => executeTestSuite(suite.id)}
                          disabled={loading}
                          size="sm"
                        >
                          🚀 Execute
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Account ID:</span> {suite.accountId}
                        </div>
                        <div>
                          <span className="font-medium">Sender ID:</span> {suite.senderId}
                        </div>
                        <div>
                          <span className="font-medium">Username:</span> {suite.senderUsername}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-sm">Tests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suite.tests.map((test, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {test.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results ({testResults.length})</CardTitle>
              <CardDescription>
                View detailed results from executed test suites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test results available. Execute a test suite to see results.
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div key={result.suiteId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Suite: {result.suiteId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Executed: {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {result.passed}/{result.totalTests}
                          </div>
                          <div className="text-sm text-muted-foreground">Passed</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        {result.results.map((testResult, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getStatusIcon(testResult.status)}</span>
                              <div>
                                <div className="font-medium">{testResult.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Type: {testResult.type}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(testResult.status)}>
                                {testResult.status}
                              </Badge>
                              {testResult.statusCode && (
                                <Badge variant="outline">
                                  {testResult.statusCode}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {result.failed > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {result.failed} test(s) failed. Check the webhook processing logs for details.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookTestingPanel;
