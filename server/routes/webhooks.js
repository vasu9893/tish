const express = require('express');
const router = express.Router();
const webhookProcessor = require('../services/webhookProcessor');
const WebhookEvent = require('../models/WebhookEvent');
const WebhookSubscription = require('../models/WebhookSubscription');
const InstagramUser = require('../models/InstagramUser');
const authMiddleware = require('../middleware/authMiddleware');
const metaApi = require('../utils/metaApi');

// Webhook verification endpoint (GET request from Meta)
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔐 Instagram webhook verification request:', {
    mode,
    token,
    challenge: challenge ? 'present' : 'missing',
    expectedToken: process.env.META_VERIFY_TOKEN || 'instantchat_webhook_2024_secure_token',
    timestamp: new Date().toISOString()
  });

  // Verify token should match your app's verify token
  const verifyToken = process.env.META_VERIFY_TOKEN || 'instantchat_webhook_2024_secure_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Instagram webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Instagram webhook verification failed:', {
      mode,
      token,
      expectedToken: verifyToken,
      tokenMatch: token === verifyToken,
      modeMatch: mode === 'subscribe'
    });
    res.status(403).send('Forbidden');
  }
});

// Webhook event endpoint (POST request from Meta)
router.post('/instagram', async (req, res) => {
  try {
    console.log('📥 Instagram webhook event received:', {
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
      signature: req.headers['x-hub-signature-256'] ? 'present' : 'missing',
      bodyType: typeof req.body,
      bodyLength: req.body ? req.body.length : 0,
      timestamp: new Date().toISOString()
    });

    // Parse the raw body to JSON for processing
    let parsedBody;
    try {
      if (Buffer.isBuffer(req.body)) {
        parsedBody = JSON.parse(req.body.toString('utf8'));
        console.log('📋 Parsed webhook payload keys:', Object.keys(parsedBody));
      } else {
        parsedBody = req.body;
        console.log('📋 Webhook body already parsed, keys:', parsedBody ? Object.keys(parsedBody) : []);
      }
      
      // Log the full payload structure for debugging
      console.log('📋 Full webhook payload:', JSON.stringify(parsedBody, null, 2));
      
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }

    // Process the webhook with raw body for signature verification
    const result = await webhookProcessor.processWebhook(
      parsedBody,
      req.headers,
      req.query,
      req.body, // Pass raw body for signature verification
      null // userId will be looked up by the processor
    );

    if (result.success) {
      console.log('✅ Webhook processed successfully:', {
        eventsProcessed: result.eventsProcessed,
        processingTime: result.processingTime
      });
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        eventsProcessed: result.eventsProcessed,
        processingTime: result.processingTime
      });
    } else {
      console.error('❌ Webhook processing failed:', result.error);
      
      res.status(400).json({
        success: false,
        error: result.error,
        processingTime: result.processingTime
      });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get recent webhook events (temporarily without auth for testing)
router.get('/events', async (req, res) => {
  try {
    const userId = req.user?.id; // Optional since we removed auth temporarily
    const { 
      eventType, 
      accountId, 
      status, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate
    } = req.query;

    // Build query - include userId for user-specific events, but also allow global events
    const query = {};
    
    // For now, let's show all events (not filtered by userId) to see the 9 stored events
    // TODO: Implement proper user-event association
    if (eventType) query.eventType = eventType;
    if (accountId) query.accountId = accountId;
    if (status) query.processedStatus = status;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get events
    const events = await WebhookEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-payload -webhookMetadata');

    // Get total count
    const total = await WebhookEvent.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + events.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching webhook events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook events',
      details: error.message
    });
  }
});

// Health check endpoint for webhook system
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      service: 'InstantChat Webhook Management System',
      version: '2.0.0',
      uptime: process.uptime(),
      checks: {}
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
      healthStatus.status = 'unhealthy';
    }

    // Check webhook processor
    try {
      const processorStats = webhookProcessor.getStats();
      healthStatus.checks.processor = {
        status: 'healthy',
        message: 'Webhook processor is running',
        stats: processorStats
      };
    } catch (error) {
      healthStatus.checks.processor = {
        status: 'unhealthy',
        message: `Processor check failed: ${error.message}`,
        error: error.message
      };
      healthStatus.status = 'unhealthy';
    }

    // Check Meta API configuration
    try {
      const { config: webhookConfig } = require('../config/webhooks');
      if (webhookConfig.meta.appId && webhookConfig.meta.appSecret) {
        healthStatus.checks.metaConfig = {
          status: 'healthy',
          message: 'Meta API configuration is valid'
        };
      } else {
        healthStatus.checks.metaConfig = {
          status: 'warning',
          message: 'Meta API configuration is incomplete'
        };
      }
    } catch (error) {
      healthStatus.checks.metaConfig = {
        status: 'unhealthy',
        message: `Meta config check failed: ${error.message}`,
        error: error.message
      };
      healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      service: 'InstantChat Webhook Management System',
      error: error.message
    });
  }
});

// Test webhook endpoint for debugging
router.post('/instagram/test', authMiddleware, async (req, res) => {
  try {
    const { eventType, accountId, senderId, content, userInfo } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!eventType || !accountId || !senderId) {
      return res.status(400).json({
        success: false,
        error: 'eventType, accountId, and senderId are required'
      });
    }

    // Create test webhook event
    const testEvent = {
      eventType,
      accountId,
      senderId,
      recipientId: accountId,
      content: content || { text: 'Test webhook event' },
      userInfo: userInfo || {
        username: 'test_user',
        fullName: 'Test User',
        profilePicture: null,
        verified: false
      }
    };

    // Process test event
    const result = await webhookProcessor.processEvent(testEvent, {
      hubMode: 'test',
      hubVerifyToken: 'test',
      hubTimestamp: Date.now().toString(),
      hubSignature: 'test_signature'
    });

    res.json({
      success: true,
      message: 'Test webhook event processed',
      result
    });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process test webhook',
      details: error.message
    });
  }
});

// Get webhook events (with filtering and pagination) - REMOVED DUPLICATE ROUTE
// This route was duplicating the one above and causing conflicts

// Get webhook event by ID
router.get('/events/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await WebhookEvent.findOne({ eventId });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Webhook event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('❌ Get webhook event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook event',
      details: error.message
    });
  }
});

// Retry failed webhook event
router.post('/events/:eventId/retry', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await WebhookEvent.findOne({ eventId });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Webhook event not found'
      });
    }

    if (event.processedStatus !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Event is not in failed status'
      });
    }

    // Retry the event
    await event.retry();
    
    // Add to processing queue
    webhookProcessor.addToQueue(event);

    res.json({
      success: true,
      message: 'Event queued for retry',
      eventId: event.eventId
    });

  } catch (error) {
    console.error('❌ Retry webhook event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry webhook event',
      details: error.message
    });
  }
});

// Get webhook subscriptions for user
router.get('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await WebhookSubscription.getByUser(userId);

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('❌ Get webhook subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook subscriptions',
      details: error.message
    });
  }
});

// Create webhook subscription
router.post('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      subscribedFields, 
      webhookConfig,
      processingConfig,
      notifications 
    } = req.body;

    // Validate required fields
    if (!subscribedFields || !webhookConfig) {
      return res.status(400).json({
        success: false,
        error: 'subscribedFields and webhookConfig are required'
      });
    }

    // Find connected Instagram account for this user
    const instagramUser = await InstagramUser.findOne({ 
      userId,
      isConnected: true
    });

    if (!instagramUser) {
      return res.status(400).json({
        success: false,
        error: 'No connected Instagram account found. Please connect your Instagram account first.'
      });
    }

    const instagramAccountId = instagramUser.instagramUserId;

    // Check if subscription already exists
    const existingSubscription = await WebhookSubscription.findOne({
      instagramAccountId,
      userId
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.subscribedFields = subscribedFields;
      existingSubscription.webhookConfig = webhookConfig;
      existingSubscription.processingConfig = processingConfig || existingSubscription.processingConfig;
      existingSubscription.notifications = notifications || existingSubscription.notifications;
      existingSubscription.updatedAt = new Date();
      
      await existingSubscription.save();
      
      console.log('✅ Updated existing webhook subscription:', existingSubscription.subscriptionId);
      
      return res.status(200).json({
        success: true,
        message: 'Webhook subscription updated successfully',
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const subscription = new WebhookSubscription({
      subscriptionId: `sub_${instagramAccountId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      instagramAccountId,
      userId,
      subscribedFields,
      webhookConfig,
      processingConfig: processingConfig || {},
      notifications: notifications || {}
    });

    await subscription.save();

    console.log('✅ Created new webhook subscription:', subscription.subscriptionId);

    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      data: subscription
    });

  } catch (error) {
    console.error('❌ Create webhook subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook subscription',
      details: error.message
    });
  }
});

// Update webhook subscription
router.put('/subscriptions/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const subscription = await WebhookSubscription.findOne({
      subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Webhook subscription not found'
      });
    }

    // Update subscription
    Object.assign(subscription, updateData);
    await subscription.save();

    res.json({
      success: true,
      message: 'Webhook subscription updated successfully',
      data: subscription
    });

  } catch (error) {
    console.error('❌ Update webhook subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook subscription',
      details: error.message
    });
  }
});

// Delete webhook subscription
router.delete('/subscriptions/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    const subscription = await WebhookSubscription.findOne({
      subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Webhook subscription not found'
      });
    }

    // Unsubscribe from Meta webhook (if needed)
    try {
      await this.unsubscribeFromMetaWebhook(subscription);
    } catch (metaError) {
      console.warn('⚠️ Failed to unsubscribe from Meta webhook:', metaError);
      // Continue with local deletion
    }

    await subscription.remove();

    res.json({
      success: true,
      message: 'Webhook subscription deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete webhook subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook subscription',
      details: error.message
    });
  }
});

// Test webhook field subscription
router.post('/test-field', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { instagramAccountId, field } = req.body;

    if (!instagramAccountId || !field) {
      return res.status(400).json({
        success: false,
        error: 'Instagram account ID and field are required'
      });
    }

    // Get Instagram user to get access token
    const InstagramUser = require('../models/InstagramUser');
    const instagramUser = await InstagramUser.findOne({ 
      instagramAccountId,
      userId 
    });

    if (!instagramUser) {
      return res.status(404).json({
        success: false,
        error: 'Instagram account not found'
      });
    }

    // Test the field subscription
    const result = await webhookMetaApi.testWebhookField(
      instagramAccountId,
      instagramUser.instagramAccessToken,
      field
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully tested webhook field: ${field}`,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to test webhook field: ${result.error}`,
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Test webhook field error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test webhook field',
      details: error.message
    });
  }
});

// Get supported webhook fields for an Instagram account
router.get('/supported-fields/:instagramAccountId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { instagramAccountId } = req.params;

    // Get Instagram user to get access token
    const InstagramUser = require('../models/InstagramUser');
    const instagramUser = await InstagramUser.findOne({ 
      instagramAccountId,
      userId 
    });

    if (!instagramUser) {
      return res.status(404).json({
        success: false,
        error: 'Instagram account not found'
      });
    }

    // Get supported fields based on account permissions
    const result = await webhookMetaApi.getSupportedWebhookFields(
      instagramAccountId,
      instagramUser.instagramAccessToken
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to get supported fields: ${result.error}`
      });
    }

  } catch (error) {
    console.error('❌ Get supported fields error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported webhook fields',
      details: error.message
    });
  }
});

// Validate Instagram access token
router.post('/validate-token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Validate the token with Meta
    const result = await webhookMetaApi.validateAccessToken(accessToken);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Token validation failed: ${result.error}`,
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate access token',
      details: error.message
    });
  }
});

// Create comprehensive webhook test suite
router.post('/testing/create-suite', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId, senderId, senderUsername } = req.body;

    if (!accountId || !senderId || !senderUsername) {
      return res.status(400).json({
        success: false,
        error: 'accountId, senderId, and senderUsername are required'
      });
    }

    const webhookTester = require('../utils/webhookTester');
    const testSuite = webhookTester.createTestSuite(accountId, senderId, senderUsername);
    
    // Store the test suite
    webhookTester.testEvents.set(testSuite.id, testSuite);

    res.json({
      success: true,
      message: 'Test suite created successfully',
      data: {
        suiteId: testSuite.id,
        totalTests: testSuite.tests.length,
        tests: testSuite.tests.map(t => ({
          name: t.name,
          type: t.type
        }))
      }
    });

  } catch (error) {
    console.error('❌ Create test suite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test suite',
      details: error.message
    });
  }
});

// Execute webhook test suite
router.post('/testing/execute-suite/:suiteId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { suiteId } = req.params;

    const webhookTester = require('../utils/webhookTester');
    const testSuite = webhookTester.getTestSuite(suiteId);

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found'
      });
    }

    // Execute the test suite
    const results = await webhookTester.executeTestSuite(
      testSuite,
      `${webhookConfig.webhookUrls.instagram}`
    );

    res.json({
      success: true,
      message: 'Test suite executed successfully',
      data: results
    });

  } catch (error) {
    console.error('❌ Execute test suite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute test suite',
      details: error.message
    });
  }
});

// Get test suite details
router.get('/testing/suite/:suiteId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { suiteId } = req.params;

    const webhookTester = require('../utils/webhookTester');
    const testSuite = webhookTester.getTestSuite(suiteId);
    const testResults = webhookTester.getTestResults(suiteId);

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found'
      });
    }

    res.json({
      success: true,
      data: {
        suite: testSuite,
        results: testResults
      }
    });

  } catch (error) {
    console.error('❌ Get test suite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test suite',
      details: error.message
    });
  }
});

// Get all test suites
router.get('/testing/suites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookTester = require('../utils/webhookTester');
    
    const testSuites = webhookTester.getAllTestSuites();
    const testResults = webhookTester.getAllTestResults();

    res.json({
      success: true,
      data: {
        suites: testSuites,
        results: testResults
      }
    });

  } catch (error) {
    console.error('❌ Get test suites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test suites',
      details: error.message
    });
  }
});

// Clean up old test data
router.post('/testing/cleanup', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookTester = require('../utils/webhookTester');
    
    webhookTester.cleanupOldData();

    res.json({
      success: true,
      message: 'Old test data cleaned up successfully'
    });

  } catch (error) {
    console.error('❌ Cleanup test data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup test data',
      details: error.message
    });
  }
});

// Get webhook monitoring dashboard data
router.get('/monitoring/dashboard', authMiddleware, async (req, res) => {
  try {
    const webhookMonitor = require('../services/webhookMonitor');
    const dashboardData = await webhookMonitor.getDashboardData();

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Get monitoring dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring dashboard data',
      details: error.message
    });
  }
});

// Get webhook system status
router.get('/monitoring/status', authMiddleware, async (req, res) => {
  try {
    const webhookMonitor = require('../services/webhookMonitor');
    const systemStatus = webhookMonitor.getSystemStatus();

    res.json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    console.error('❌ Get system status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      details: error.message
    });
  }
});

// Get webhook error analysis
router.get('/monitoring/errors', authMiddleware, async (req, res) => {
  try {
    const webhookMonitor = require('../services/webhookMonitor');
    const errorAnalysis = webhookMonitor.getErrorAnalysis();

    res.json({
      success: true,
      data: errorAnalysis
    });

  } catch (error) {
    console.error('❌ Get error analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error analysis',
      details: error.message
    });
  }
});

// Perform manual health check
router.post('/monitoring/health-check', authMiddleware, async (req, res) => {
  try {
    const webhookMonitor = require('../services/webhookMonitor');
    const healthStatus = await webhookMonitor.performHealthCheck();

    res.json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    console.error('❌ Manual health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform health check',
      details: error.message
    });
  }
});

// Get webhook processing statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get processor stats
    const processorStats = webhookProcessor.getStats();

    // Get database stats
    const totalEvents = await WebhookEvent.countDocuments();
    const pendingEvents = await WebhookEvent.countDocuments({ processedStatus: 'pending' });
    const failedEvents = await WebhookEvent.countDocuments({ processedStatus: 'failed' });
    const completedEvents = await WebhookEvent.countDocuments({ processedStatus: 'completed' });

    // Get event type distribution
    const eventTypeStats = await WebhookEvent.aggregate([
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

    // Get recent activity
    const recentEvents = await WebhookEvent.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('eventType timestamp processedStatus');

    res.json({
      success: true,
      data: {
        processor: processorStats,
        database: {
          total: totalEvents,
          pending: pendingEvents,
          failed: failedEvents,
          completed: completedEvents
        },
        eventTypes: eventTypeStats,
        recentActivity: recentEvents
      }
    });

  } catch (error) {
    console.error('❌ Get webhook stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook statistics',
      details: error.message
    });
  }
});

// Meta Graph API integration for webhook subscriptions
const webhookMetaApi = require('../utils/webhookMetaApi');

// Subscribe to Meta webhook
async function subscribeToMetaWebhook(subscription, instagramUser) {
  try {
    console.log('🔗 Subscribing to Meta webhook for account:', instagramUser.instagramAccountId);
    
    // Get the fields to subscribe to
    const fields = subscription.subscribedFields.map(f => f.field);
    
    // Subscribe using Meta API
    const result = await webhookMetaApi.subscribeToWebhook(
      instagramUser.instagramAccountId,
      instagramUser.instagramAccessToken,
      fields
    );
    
    if (result.success) {
      subscription.metaSubscription.status = 'active';
      subscription.metaSubscription.lastVerified = new Date();
      subscription.metaSubscription.subscriptionId = `meta_${Date.now()}`;
      await subscription.save();
      
      console.log('✅ Successfully subscribed to Meta webhook fields:', fields);
    } else {
      throw new Error(`Meta API error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to subscribe to Meta webhook:', error);
    subscription.metaSubscription.status = 'failed';
    subscription.metaSubscription.lastVerified = new Date();
    await subscription.save();
    throw error;
  }
}

// Unsubscribe from Meta webhook
async function unsubscribeFromMetaWebhook(subscription) {
  try {
    console.log('🔗 Unsubscribing from Meta webhook for account:', subscription.instagramAccountId);
    
    // Get the Instagram user to get access token
    const InstagramUser = require('../models/InstagramUser');
    const instagramUser = await InstagramUser.findOne({ 
      instagramAccountId: subscription.instagramAccountId 
    });
    
    if (!instagramUser) {
      throw new Error('Instagram user not found for unsubscription');
    }
    
    // Unsubscribe using Meta API
    const result = await webhookMetaApi.unsubscribeFromWebhook(
      subscription.instagramAccountId,
      instagramUser.instagramAccessToken
    );
    
    if (result.success) {
      subscription.metaSubscription.status = 'inactive';
      subscription.metaSubscription.lastVerified = new Date();
      await subscription.save();
      
      console.log('✅ Successfully unsubscribed from Meta webhook fields');
    } else {
      throw new Error(`Meta API error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to unsubscribe from Meta webhook:', error);
    throw error;
  }
}

module.exports = router;
