import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Activity, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import api from '../utils/api'

const InstagramAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalMessages: 0,
    totalConversations: 0,
    responseTime: 0,
    engagementRate: 0,
    messageTrends: [],
    topKeywords: [],
    conversationMetrics: []
  })
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      // For now, we'll use mock data since we haven't implemented analytics endpoints yet
      // In production, you'd call: const response = await api.get(`/api/instagram/analytics?range=${timeRange}`)
      
      // Mock analytics data
      const mockAnalytics = {
        totalMessages: 1247,
        totalConversations: 89,
        responseTime: 2.3, // minutes
        engagementRate: 78.5, // percentage
        messageTrends: [
          { date: '2024-01-01', messages: 45, conversations: 12 },
          { date: '2024-01-02', messages: 52, conversations: 15 },
          { date: '2024-01-03', messages: 38, conversations: 11 },
          { date: '2024-01-04', messages: 67, conversations: 18 },
          { date: '2024-01-05', messages: 73, conversations: 20 },
          { date: '2024-01-06', messages: 58, conversations: 16 },
          { date: '2024-01-07', messages: 82, conversations: 22 }
        ],
        topKeywords: [
          { keyword: 'pricing', count: 45, sentiment: 'positive' },
          { keyword: 'support', count: 38, sentiment: 'neutral' },
          { keyword: 'feature', count: 32, sentiment: 'positive' },
          { keyword: 'issue', count: 28, sentiment: 'negative' },
          { keyword: 'demo', count: 25, sentiment: 'positive' }
        ],
        conversationMetrics: [
          { metric: 'First Response Time', value: '2.3 min', trend: '+12%' },
          { metric: 'Resolution Time', value: '15.7 min', trend: '-8%' },
          { metric: 'Customer Satisfaction', value: '4.8/5', trend: '+5%' },
          { metric: 'Automation Usage', value: '67%', trend: '+23%' }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ title, value, icon: Icon, trend, description }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <Badge 
                  variant={trend.startsWith('+') ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {trend}
                </Badge>
                <span className="text-xs text-gray-500 ml-2">vs last period</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  const TrendChart = ({ data, title }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => d.messages))
            const height = (item.messages / maxValue) * 100
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs font-medium mt-1">{item.messages}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const KeywordCard = ({ keyword, count, sentiment }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          sentiment === 'positive' ? 'bg-green-500' :
          sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
        <span className="font-medium">{keyword}</span>
      </div>
      <Badge variant="outline">{count} mentions</Badge>
    </div>
  )

  const ConversationMetric = ({ metric, value, trend }) => (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-600">{metric}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Badge 
          variant={trend.startsWith('+') ? 'default' : 'secondary'}
          className="text-xs"
        >
          {trend}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instagram Analytics</h1>
          <p className="text-gray-600">Track performance and engagement metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Messages"
          value={analytics.totalMessages.toLocaleString()}
          icon={MessageSquare}
          trend="+15%"
          description="Messages sent and received"
        />
        <MetricCard
          title="Active Conversations"
          value={analytics.totalConversations}
          icon={Users}
          trend="+8%"
          description="Unique conversations"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analytics.responseTime} min`}
          icon={Clock}
          trend="-12%"
          description="Time to first response"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analytics.engagementRate}%`}
          icon={TrendingUp}
          trend="+5%"
          description="Customer engagement level"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart 
          data={analytics.messageTrends} 
          title="Message Volume Trends" 
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Keywords</CardTitle>
            <p className="text-sm text-gray-500">Most mentioned topics in conversations</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topKeywords.map((item, index) => (
              <KeywordCard key={index} {...item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation Performance</CardTitle>
          <p className="text-sm text-gray-500">Key metrics for customer service quality</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.conversationMetrics.map((metric, index) => (
              <ConversationMetric key={index} {...metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Insights & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Positive Trends</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Response time improved by 12% this week</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Customer satisfaction increased to 4.8/5</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Automation usage up 23% reducing manual work</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-orange-600">Areas for Improvement</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Consider expanding automation for common queries</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Monitor negative sentiment around "issue" keyword</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Peak hours show higher volume - consider staffing</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Detailed Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="h-6 w-6 mb-2" />
              <span>Real-time Monitor</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Target className="h-6 w-6 mb-2" />
              <span>Set Goals</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstagramAnalytics
