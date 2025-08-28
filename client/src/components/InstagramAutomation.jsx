import React, { useState, useEffect } from 'react'
import { Play, Pause, Settings, Zap, MessageSquare, Users, Clock, Activity } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { api } from '../utils/api'

const InstagramAutomation = () => {
  const [automationFlows, setAutomationFlows] = useState([])
  const [webhookStatus, setWebhookStatus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    trigger: 'message_received',
    conditions: [],
    actions: []
  })

  useEffect(() => {
    loadAutomationFlows()
    checkWebhookStatus()
  }, [])

  const loadAutomationFlows = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/flows')
      if (response.data.success) {
        setAutomationFlows(response.data.data)
      }
    } catch (error) {
      console.error('Error loading automation flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebhookStatus = async () => {
    try {
      const response = await api.get('/api/instagram/status')
      if (response.data.success) {
        setWebhookStatus(response.data.data.webhookSubscribed || false)
      }
    } catch (error) {
      console.error('Error checking webhook status:', error)
    }
  }

  const subscribeToWebhooks = async () => {
    try {
      setLoading(true)
      const response = await api.post('/api/instagram/subscribe-webhook')
      if (response.data.success) {
        setWebhookStatus(true)
        alert('Webhook subscription successful!')
      }
    } catch (error) {
      console.error('Error subscribing to webhooks:', error)
      alert('Failed to subscribe to webhooks')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromWebhooks = async () => {
    try {
      setLoading(true)
      const response = await api.delete('/api/instagram/unsubscribe-webhook')
      if (response.data.success) {
        setWebhookStatus(false)
        alert('Webhook unsubscription successful!')
      }
    } catch (error) {
      console.error('Error unsubscribing from webhooks:', error)
      alert('Failed to unsubscribe from webhooks')
    } finally {
      setLoading(false)
    }
  }

  const toggleFlow = async (flowId, currentStatus) => {
    try {
      const response = await api.patch(`/api/flows/${flowId}/toggle`)
      if (response.data.success) {
        setAutomationFlows(prev => 
          prev.map(flow => 
            flow._id === flowId 
              ? { ...flow, isActive: !currentStatus }
              : flow
          )
        )
      }
    } catch (error) {
      console.error('Error toggling flow:', error)
    }
  }

  const createFlow = async () => {
    try {
      setLoading(true)
      const response = await api.post('/api/flows', newFlow)
      if (response.data.success) {
        setAutomationFlows(prev => [...prev, response.data.data])
        setNewFlow({
          name: '',
          description: '',
          trigger: 'message_received',
          conditions: [],
          actions: []
        })
        setShowCreateFlow(false)
        alert('Automation flow created successfully!')
      }
    } catch (error) {
      console.error('Error creating flow:', error)
      alert('Failed to create automation flow')
    } finally {
      setLoading(false)
    }
  }

  const deleteFlow = async (flowId) => {
    if (!confirm('Are you sure you want to delete this automation flow?')) return

    try {
      const response = await api.delete(`/api/flows/${flowId}`)
      if (response.data.success) {
        setAutomationFlows(prev => prev.filter(flow => flow._id !== flowId))
        alert('Automation flow deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting flow:', error)
      alert('Failed to delete automation flow')
    }
  }

  const FlowCard = ({ flow }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle className="text-lg">{flow.name}</CardTitle>
              <p className="text-sm text-gray-500">{flow.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={flow.isActive ? 'default' : 'secondary'}>
              {flow.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={flow.isActive}
              onCheckedChange={() => toggleFlow(flow._id, flow.isActive)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Trigger: {flow.trigger.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {flow.conditions?.length || 0} conditions
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {flow.actions?.length || 0} actions
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Created: {new Date(flow.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => deleteFlow(flow._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const CreateFlowForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create New Automation Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="flowName">Flow Name</Label>
            <Input
              id="flowName"
              value={newFlow.name}
              onChange={(e) => setNewFlow(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Welcome Message Flow"
            />
          </div>
          <div>
            <Label htmlFor="flowTrigger">Trigger</Label>
            <Select
              value={newFlow.trigger}
              onValueChange={(value) => setNewFlow(prev => ({ ...prev, trigger: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message_received">Message Received</SelectItem>
                <SelectItem value="first_message">First Message</SelectItem>
                <SelectItem value="keyword_detected">Keyword Detected</SelectItem>
                <SelectItem value="time_based">Time Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="flowDescription">Description</Label>
          <Textarea
            id="flowDescription"
            value={newFlow.description}
            onChange={(e) => setNewFlow(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this automation flow does..."
            rows="3"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={createFlow} disabled={!newFlow.name.trim() || loading}>
            Create Flow
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateFlow(false)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instagram Automation</h1>
          <p className="text-gray-600">Manage automated responses and workflows</p>
        </div>
        <Button onClick={() => setShowCreateFlow(!showCreateFlow)}>
          <Zap className="h-4 w-4 mr-2" />
          {showCreateFlow ? 'Cancel' : 'Create Flow'}
        </Button>
      </div>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Webhook Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Webhooks allow Instagram to send real-time messages to your app
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant={webhookStatus ? 'default' : 'secondary'}>
                  {webhookStatus ? 'Subscribed' : 'Not Subscribed'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {webhookStatus ? 'Receiving real-time messages' : 'Manual polling only'}
                </span>
              </div>
            </div>
            <Button
              onClick={webhookStatus ? unsubscribeFromWebhooks : subscribeToWebhooks}
              disabled={loading}
              variant={webhookStatus ? 'destructive' : 'default'}
            >
              {webhookStatus ? 'Unsubscribe' : 'Subscribe'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Flow Form */}
      {showCreateFlow && <CreateFlowForm />}

      {/* Automation Flows */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Automation Flows</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading automation flows...</div>
        ) : automationFlows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No automation flows yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first automation flow to automatically respond to Instagram messages
              </p>
              <Button onClick={() => setShowCreateFlow(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Create First Flow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {automationFlows.map(flow => (
              <FlowCard key={flow._id} flow={flow} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span>Test Webhook</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="h-6 w-6 mb-2" />
              <span>View Logs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstagramAutomation
