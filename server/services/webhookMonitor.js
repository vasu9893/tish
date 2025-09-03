const WebhookEvent = require('../models/WebhookEvent');
const WebhookSubscription = require('../models/WebhookSubscription');
const { config: webhookConfig } = require('../config/webhooks');

class WebhookMonitor {
  constructor() {
    this.healthChecks = new Map();
    this.performanceMetrics = new Map();
    this.errorTracking = new Map();
    this.startTime = new Date();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start the monitoring system
   */
  startMonitoring() {
    console.log('🔍 Starting Webhook Monitor...');
    
    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Performance metrics every minute
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60 * 1000);

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      console.log('🏥 Performing webhook health check...');
      
      const healthStatus = {
        timestamp: new Date(),
        overall: 'healthy',
        checks: {},
        recommendations: []
      };

      // Check database connectivity
      try {
        const eventCount = await WebhookEvent.countDocuments();
        healthStatus.checks.database = {
          status: 'healthy',
          message: `Connected to database. ${eventCount} events stored.`
        };
      } catch (error) {
        healthStatus.checks.database = {
          status: 'unhealthy',
          message: `Database connection failed: ${error.message}`,
          error: error.message
        };
        healthStatus.overall = 'unhealthy';
        healthStatus.recommendations.push('Check database connection and credentials');
      }

      // Check webhook endpoint accessibility
      try {
        const response = await fetch(`${webhookConfig.webhookUrls.instagram}/health`);
        if (response.ok) {
          healthStatus.checks.endpoint = {
            status: 'healthy',
            message: 'Webhook endpoint is accessible'
          };
        } else {
          healthStatus.checks.endpoint = {
            status: 'warning',
            message: `Webhook endpoint returned status: ${response.status}`
          };
        }
      } catch (error) {
        healthStatus.checks.endpoint = {
          status: 'unhealthy',
          message: `Webhook endpoint is not accessible: ${error.message}`,
          error: error.message
        };
        healthStatus.overall = 'unhealthy';
        healthStatus.recommendations.push('Check webhook endpoint configuration and network access');
      }

      // Check subscription status
      try {
        const activeSubscriptions = await WebhookSubscription.countDocuments({
          'metaSubscription.status': 'active'
        });
        const totalSubscriptions = await WebhookSubscription.countDocuments();
        
        healthStatus.checks.subscriptions = {
          status: activeSubscriptions > 0 ? 'healthy' : 'warning',
          message: `${activeSubscriptions}/${totalSubscriptions} subscriptions are active`,
          active: activeSubscriptions,
          total: totalSubscriptions
        };

        if (activeSubscriptions === 0 && totalSubscriptions > 0) {
          healthStatus.recommendations.push('No active webhook subscriptions. Check Meta API integration.');
        }
      } catch (error) {
        healthStatus.checks.subscriptions = {
          status: 'unhealthy',
          message: `Failed to check subscriptions: ${error.message}`,
          error: error.message
        };
        healthStatus.overall = 'unhealthy';
      }

      // Check recent event processing
      try {
        const recentEvents = await WebhookEvent.find({
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).sort({ timestamp: -1 }).limit(100);

        const failedEvents = recentEvents.filter(e => e.processedStatus === 'failed');
        const successRate = recentEvents.length > 0 ? 
          ((recentEvents.length - failedEvents.length) / recentEvents.length * 100).toFixed(2) : 100;

        healthStatus.checks.eventProcessing = {
          status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'warning' : 'unhealthy',
          message: `Event processing success rate: ${successRate}%`,
          totalEvents: recentEvents.length,
          failedEvents: failedEvents.length,
          successRate: parseFloat(successRate)
        };

        if (successRate < 95) {
          healthStatus.recommendations.push(`Event processing success rate is ${successRate}%. Investigate failed events.`);
        }
      } catch (error) {
        healthStatus.checks.eventProcessing = {
          status: 'unhealthy',
          message: `Failed to check event processing: ${error.message}`,
          error: error.message
        };
        healthStatus.overall = 'unhealthy';
      }

      // Check Meta API connectivity
      try {
        const { webhookMetaApi } = require('../utils/webhookMetaApi');
        const testResult = await webhookMetaApi.validateAccessToken('test_token');
        
        healthStatus.checks.metaApi = {
          status: 'healthy',
          message: 'Meta API connectivity confirmed'
        };
      } catch (error) {
        healthStatus.checks.metaApi = {
          status: 'warning',
          message: `Meta API connectivity issue: ${error.message}`,
          error: error.message
        };
        healthStatus.recommendations.push('Check Meta API credentials and rate limits');
      }

      // Store health status
      this.healthChecks.set(healthStatus.timestamp, healthStatus);

      // Log health status
      console.log('🏥 Webhook Health Check Result:', {
        overall: healthStatus.overall,
        checks: Object.keys(healthStatus.checks).length,
        recommendations: healthStatus.recommendations.length
      });

      return healthStatus;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        timestamp: new Date(),
        overall: 'unhealthy',
        error: error.message,
        checks: {},
        recommendations: ['Health check system failure. Check logs for details.']
      };
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        eventStats: {},
        subscriptionStats: {},
        performanceStats: {}
      };

      // Event statistics
      const totalEvents = await WebhookEvent.countDocuments();
      const pendingEvents = await WebhookEvent.countDocuments({ processedStatus: 'pending' });
      const failedEvents = await WebhookEvent.countDocuments({ processedStatus: 'failed' });
      const completedEvents = await WebhookEvent.countDocuments({ processedStatus: 'completed' });

      metrics.eventStats = {
        total: totalEvents,
        pending: pendingEvents,
        failed: failedEvents,
        completed: completedEvents,
        successRate: totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(2) : 100
      };

      // Subscription statistics
      const totalSubscriptions = await WebhookSubscription.countDocuments();
      const activeSubscriptions = await WebhookSubscription.countDocuments({ 'metaSubscription.status': 'active' });
      const failedSubscriptions = await WebhookSubscription.countDocuments({ 'metaSubscription.status': 'failed' });

      metrics.subscriptionStats = {
        total: totalSubscriptions,
        active: activeSubscriptions,
        failed: failedSubscriptions,
        activeRate: totalSubscriptions > 0 ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(2) : 0
      };

      // Performance statistics (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentEvents = await WebhookEvent.find({
        timestamp: { $gte: oneHourAgo }
      });

      const processingTimes = recentEvents
        .filter(e => e.processingAttempts > 0)
        .map(e => e.processingAttempts);

      metrics.performanceStats = {
        eventsLastHour: recentEvents.length,
        averageProcessingAttempts: processingTimes.length > 0 ? 
          (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(2) : 0,
        maxProcessingAttempts: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
      };

      // Store metrics
      this.performanceMetrics.set(metrics.timestamp, metrics);

      // Keep only last 100 metrics
      if (this.performanceMetrics.size > 100) {
        const oldestKey = Array.from(this.performanceMetrics.keys())[0];
        this.performanceMetrics.delete(oldestKey);
      }

      return metrics;

    } catch (error) {
      console.error('❌ Failed to collect performance metrics:', error);
      return null;
    }
  }

  /**
   * Track error for analysis
   */
  trackError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      context,
      count: 1
    };

    const errorKey = `${error.message}_${JSON.stringify(context)}`;
    
    if (this.errorTracking.has(errorKey)) {
      this.errorTracking.get(errorKey).count++;
      this.errorTracking.get(errorKey).lastOccurrence = new Date();
    } else {
      this.errorTracking.set(errorKey, errorInfo);
    }

    // Keep only last 1000 errors
    if (this.errorTracking.size > 1000) {
      const oldestKey = Array.from(this.errorTracking.keys())[0];
      this.errorTracking.delete(oldestKey);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData() {
    try {
      const healthStatus = await this.performHealthCheck();
      const performanceMetrics = this.collectPerformanceMetrics();
      
      // Get recent events for dashboard
      const recentEvents = await WebhookEvent.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .select('eventType timestamp processedStatus senderId recipientId');

      // Get event type distribution
      const eventTypeDistribution = await WebhookEvent.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get subscription overview
      const subscriptionOverview = await WebhookSubscription.aggregate([
        {
          $group: {
            _id: '$metaSubscription.status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        health: healthStatus,
        performance: await performanceMetrics,
        recentEvents,
        eventTypeDistribution,
        subscriptionOverview,
        systemInfo: {
          uptime: Date.now() - this.startTime.getTime(),
          startTime: this.startTime,
          totalHealthChecks: this.healthChecks.size,
          totalPerformanceMetrics: this.performanceMetrics.size,
          totalErrors: this.errorTracking.size
        }
      };

    } catch (error) {
      console.error('❌ Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis() {
    const errors = Array.from(this.errorTracking.values());
    
    // Group errors by type
    const errorGroups = errors.reduce((groups, error) => {
      const type = error.message.split(':')[0] || 'Unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(error);
      return groups;
    }, {});

    // Calculate error statistics
    const errorStats = Object.entries(errorGroups).map(([type, typeErrors]) => ({
      type,
      count: typeErrors.length,
      totalOccurrences: typeErrors.reduce((sum, e) => sum + e.count, 0),
      firstOccurrence: typeErrors[0]?.timestamp,
      lastOccurrence: typeErrors[typeErrors.length - 1]?.timestamp,
      examples: typeErrors.slice(0, 3).map(e => ({
        message: e.message,
        context: e.context,
        count: e.count
      }))
    }));

    return {
      totalErrors: errors.length,
      totalOccurrences: errors.reduce((sum, e) => sum + e.count, 0),
      errorGroups: errorStats,
      recommendations: this.generateErrorRecommendations(errorStats)
    };
  }

  /**
   * Generate recommendations based on error analysis
   */
  generateErrorRecommendations(errorStats) {
    const recommendations = [];

    // Check for high-frequency errors
    const highFrequencyErrors = errorStats.filter(e => e.totalOccurrences > 10);
    if (highFrequencyErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `High-frequency errors detected: ${highFrequencyErrors.map(e => e.type).join(', ')}`,
        action: 'Investigate and fix these recurring errors immediately'
      });
    }

    // Check for recent errors
    const recentErrors = errorStats.filter(e => {
      const lastOccurrence = new Date(e.lastOccurrence);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return lastOccurrence > oneHourAgo;
    });

    if (recentErrors.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: `Recent errors detected: ${recentErrors.map(e => e.type).join(', ')}`,
        action: 'Monitor these errors and implement fixes if they persist'
      });
    }

    // Check for database-related errors
    const dbErrors = errorStats.filter(e => 
      e.type.includes('Database') || e.type.includes('MongoDB') || e.type.includes('Connection')
    );

    if (dbErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Database-related errors detected',
        action: 'Check database connectivity, credentials, and performance'
      });
    }

    return recommendations;
  }

  /**
   * Cleanup old monitoring data
   */
  cleanupOldData() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Cleanup old health checks
    for (const [timestamp, data] of this.healthChecks.entries()) {
      if (timestamp < oneWeekAgo) {
        this.healthChecks.delete(timestamp);
      }
    }

    // Cleanup old performance metrics
    for (const [timestamp, data] of this.performanceMetrics.entries()) {
      if (timestamp < oneWeekAgo) {
        this.performanceMetrics.delete(timestamp);
      }
    }

    // Cleanup old errors (keep last 100)
    if (this.errorTracking.size > 100) {
      const sortedErrors = Array.from(this.errorTracking.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 100);
      
      this.errorTracking.clear();
      sortedErrors.forEach(([key, value]) => {
        this.errorTracking.set(key, value);
      });
    }

    console.log('🧹 Cleaned up old monitoring data');
  }

  /**
   * Get system status summary
   */
  getSystemStatus() {
    const latestHealth = Array.from(this.healthChecks.values()).pop();
    const latestMetrics = Array.from(this.performanceMetrics.values()).pop();
    
    return {
      status: latestHealth?.overall || 'unknown',
      uptime: Date.now() - this.startTime.getTime(),
      lastHealthCheck: latestHealth?.timestamp || null,
      lastMetricsCollection: latestMetrics?.timestamp || null,
      activeSubscriptions: latestMetrics?.subscriptionStats?.active || 0,
      eventSuccessRate: latestMetrics?.eventStats?.successRate || 0,
      totalErrors: this.errorTracking.size
    };
  }
}

module.exports = new WebhookMonitor();
