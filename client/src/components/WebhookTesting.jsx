import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Webhook, 
  TestTube, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Settings,
  Globe,
  Shield,
  Activity
} from 'lucide-react'
import api from '../utils/api'

const WebhookTesting = () => {
  const [webhookStatus, setWebhookStatus] = useState('unknown')
  const [webhookUrl, setWebhookUrl] = useState('')
  [webhookUrl, setWebhookUrl] = useState('')
  const [testResults, setTestResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [webhookEvents, setWebhookEvents] = useState([])

  useEffect(() => {
    checkWebhookStatus()
    loadWebhookEvents()
  }, [])

  const checkWebhookStatus = async () => {
    try {
      setIsLoading(true)
      
      // Check if webhook endpoint is accessible
      const response = await api.get('/api/instagram/webhook/status')
      
      if (response.data.success) {
        setWebhookStatus(response.data.status)
        setWebhookUrl(response.data.webhookUrl)
      } else {
        setWebhookStatus('error')
      }
    } catch (error) {
      console.error('Failed to check webhook status:', error)
      setWebhookStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebhookEvents = async () => {
    try {
      const response = await api.get('/api/instagram/webhook/events')
      if (response.data.success) {
        setWebhookEvents(response.data.events)
      }
    } catch (error) {
      console.error('Failed to load webhook events:', error)
    }
  }

  const testWebhookEndpoint = async () => {
    try {
      setIsLoading(true)
      
      const testEvent = {
        eventType: 'test_webhook',
        content: 'This is a test webhook event',
        timestamp: new Date().toISOString()
      }

      const response = await api.post('/api/instagram/webhook/test', testEvent)
      
      if (response.data.success) {
        setTestResults(prev => [...prev, {
          id: Date.now(),
          type: 'success',
          message: 'Webhook endpoint test successful',
          timestamp: new Date(),
          details: response.data
        }])
      } else {
        setTestResults(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          message: 'Webhook endpoint test failed',
          timestamp: new Date(),
          details: response.data
        }])
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Webhook endpoint test error',
        timestamp: new Date(),
        details: error.message
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const simulateInstagramEvent = async (eventType) => {
    try {
      setIsLoading(true)
      
      const eventData = {
        eventType,
        content: `Simulated ${eventType} event`,
        username: 'test_user',
        timestamp: new Date().toISOString()
      }

      const response = await api.post('/api/instagram/debug/simulate-event', eventData)
      
      if (response.data.success) {
        setTestResults(prev => [...prev, {
          id: Date.now(),
          type: 'success',
          message: `Simulated ${eventType} event successful`,
          timestamp: new Date(),
          details: response.data
        }])
        
        // Reload webhook events
        loadWebhookEvents()
      } else {
        setTestResults(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          message: `Simulated ${eventType} event failed`,
          timestamp: new Date(),
          details: response.data
        }])
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: `Simulated ${eventType} event error`,
        timestamp: new Date(),
        details: error.message
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'inactive': return 'text-red-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <AlertCircle className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Webhook Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="w-5 h-5" />
            <span>Webhook Status</span>
          </CardTitle>
          <CardDescription>
            Monitor Instagram webhook connectivity and event processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(webhookStatus)}
              <span className={`font-medium ${getStatusColor(webhookStatus)}`}>
                Status: {webhookStatus === 'active' ? 'Active' : webhookStatus === 'inactive' ? 'Inactive' : 'Error'}
              </span>
            </div>
            <Button 
              onClick={checkWebhookStatus} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {webhookUrl && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span>Endpoint: {webhookUrl}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{webhookEvents.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {webhookEvents.filter(e => e.isProcessed).length}
              </div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {webhookEvents.filter(e => !e.isProcessed).length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Webhook Testing</span>
          </CardTitle>
          <CardDescription>
            Test webhook endpoints and simulate Instagram events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testWebhookEndpoint}
              disabled={isLoading}
              variant="outline"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Endpoint
            </Button>
            
            <Button 
              onClick={() => simulateInstagramEvent('comments')}
              disabled={isLoading}
              variant="outline"
            >
              💬 Simulate Comment
            </Button>
            
            <Button 
              onClick={() => simulateInstagramEvent('mentions')}
              disabled={isLoading}
              variant="outline"
            >
              🏷️ Simulate Mention
            </Button>
            
            <Button 
              onClick={() => simulateInstagramEvent('live_comments')}
              disabled={isLoading}
              variant="outline"
            >
              📺 Simulate Live Comment
            </Button>
            
            <Button 
              onClick={() => simulateInstagramEvent('message_reactions')}
              disabled={isLoading}
              variant="outline"
            >
              ❤️ Simulate Reaction
            </Button>
          </div>
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {testResults.slice(-5).map((result) => (
                <div 
                  key={result.id}
                  className={`p-3 rounded-lg border ${
                    result.type === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {result.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">{result.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {result.details && (
                    <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Webhook Events</span>
          </CardTitle>
          <CardDescription>
            Latest Instagram webhook events and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhookEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No webhook events yet</p>
              <p className="text-sm">Events will appear here when Instagram sends webhooks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhookEvents.slice(0, 10).map((event) => (
                <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={event.isProcessed ? "default" : "secondary"}>
                      {event.eventType}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{event.content?.text || 'No content'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {event.isProcessed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-xs text-gray-500">
                      {event.isProcessed ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Webhook Configuration</span>
          </CardTitle>
          <CardDescription>
            Steps to configure Instagram webhooks for real-time events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Why No Real Webhooks?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Instagram webhooks need to be configured in Meta Developer Console</li>
              <li>• Your server must be accessible from the internet (HTTPS required)</li>
              <li>• Webhook verification token must match your environment variable</li>
              <li>• Instagram account must have webhook permissions enabled</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Setup Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Developer Console</a></li>
              <li>Select your Instagram app and go to "Webhooks"</li>
              <li>Add webhook URL: <code className="bg-gray-100 px-1 rounded">{webhookUrl || 'https://your-domain.com/api/instagram/webhook'}</code></li>
              <li>Set verify token: <code className="bg-gray-100 px-1 rounded">{process.env.META_VERIFY_TOKEN || 'your_verify_token'}</code></li>
              <li>Subscribe to events: comments, mentions, live_comments</li>
              <li>Test webhook with "Test" button</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WebhookTesting
