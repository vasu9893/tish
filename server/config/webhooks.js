const dotenv = require('dotenv');
dotenv.config();

const webhookConfig = {
  // Meta App Configuration
  meta: {
    appId: process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID,
    appSecret: process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET,
    verifyToken: process.env.META_VERIFY_TOKEN || 'instantchat_webhook_2024_secure_token',
    graphApiVersion: 'v23.0',
    baseUrl: 'https://graph.instagram.com'
  },

  // Webhook Processing Configuration
  processing: {
    batchSize: parseInt(process.env.WEBHOOK_BATCH_SIZE) || 100,
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000,
    maxQueueSize: 1000,
    enableDeduplication: true
  },

  // Security Configuration
  security: {
    enableSignatureVerification: true,
    enableMTLS: process.env.WEBHOOK_ENABLE_MTLS === 'true',
    mtlsRootCertPath: process.env.WEBHOOK_MTLS_ROOT_CERT_PATH,
    allowedOrigins: [
      'https://www.facebook.com',
      'https://graph.facebook.com',
      'https://webhook.facebook.com'
    ]
  },

  // Webhook URLs
  urls: {
    base: process.env.WEBHOOK_BASE_URL || 'https://tish-production.up.railway.app/api/webhooks',
    instagram: process.env.WEBHOOK_INSTAGRAM_URL || 'https://tish-production.up.railway.app/api/webhooks/instagram',
    development: 'http://localhost:5000/api/webhooks/instagram'
  },

  // Supported Instagram Webhook Fields
  supportedFields: [
    'comments',
    'live_comments',
    'messages',
    'message_reactions',
    'message_postbacks',
    'message_referrals',
    'message_seen',
    'mentions',
    'messaging_handover',
    'messaging_optins',
    'messaging_policy_enforcement',
    'response_feedback',
    'standby',
    'story_insights'
  ],

  // Required Permissions for each field
  fieldPermissions: {
    comments: ['instagram_business_basic', 'instagram_business_manage_comments'],
    live_comments: ['instagram_business_basic', 'instagram_business_manage_comments'],
    messages: ['instagram_business_basic', 'instagram_business_manage_messages'],
    message_reactions: ['instagram_business_basic', 'instagram_business_manage_messages'],
    message_postbacks: ['instagram_business_basic', 'instagram_business_manage_messages'],
    message_referrals: ['instagram_business_basic', 'instagram_business_manage_messages'],
    message_seen: ['instagram_business_basic', 'instagram_business_manage_messages'],
    mentions: ['instagram_business_basic', 'instagram_manage_comments'],
    messaging_handover: ['instagram_business_basic', 'instagram_business_manage_messages'],
    messaging_optins: ['instagram_business_basic', 'instagram_business_manage_messages'],
    messaging_policy_enforcement: ['instagram_basic', 'instagram_manage_messages'],
    response_feedback: ['instagram_basic', 'instagram_manage_comments'],
    standby: ['instagram_business_basic', 'instagram_business_manage_messages'],
    story_insights: ['instagram_basic', 'instagram_manage_insights']
  },

  // Webhook Event Types
  eventTypes: {
    comments: {
      description: 'Comments on posts and stories',
      requiresAdvancedAccess: true,
      webhookField: 'comments'
    },
    live_comments: {
      description: 'Real-time comments during live broadcasts',
      requiresAdvancedAccess: true,
      webhookField: 'live_comments'
    },
    messages: {
      description: 'Direct messages and conversations',
      requiresAdvancedAccess: false,
      webhookField: 'messages'
    },
    message_reactions: {
      description: 'Reactions to messages (like, love, etc.)',
      requiresAdvancedAccess: false,
      webhookField: 'message_reactions'
    },
    message_postbacks: {
      description: 'Button interactions and quick replies',
      requiresAdvancedAccess: false,
      webhookField: 'messaging_postbacks'
    },
    message_referrals: {
      description: 'Referral traffic and sources',
      requiresAdvancedAccess: false,
      webhookField: 'messaging_referral'
    },
    message_seen: {
      description: 'Read receipts and engagement tracking',
      requiresAdvancedAccess: false,
      webhookField: 'messaging_seen'
    },
    mentions: {
      description: 'User mentions in posts, stories, and comments',
      requiresAdvancedAccess: false,
      webhookField: 'mentions'
    }
  },

  // Rate Limiting
  rateLimiting: {
    maxRequestsPerMinute: 1000,
    maxRequestsPerHour: 10000,
    burstSize: 100
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableRequestLogging: true,
    enableResponseLogging: false,
    enableErrorLogging: true,
    logWebhookPayloads: process.env.NODE_ENV !== 'production'
  },

  // Testing Configuration
  testing: {
    enableMockEvents: process.env.NODE_ENV !== 'production',
    mockEventInterval: 10000, // 10 seconds
    mockEventProbability: 0.3 // 30% chance
  }
};

// Validation function
const validateConfig = () => {
  const errors = [];

  if (!webhookConfig.meta.appId) {
    errors.push('INSTAGRAM_APP_ID is required');
  }

  if (!webhookConfig.meta.appSecret) {
    errors.push('INSTAGRAM_APP_SECRET is required');
  }

  if (!webhookConfig.meta.verifyToken) {
    errors.push('META_VERIFY_TOKEN is required');
  }

  if (webhookConfig.security.enableMTLS && !webhookConfig.security.mtlsRootCertPath) {
    errors.push('WEBHOOK_MTLS_ROOT_CERT_PATH is required when mTLS is enabled');
  }

  if (errors.length > 0) {
    console.error('❌ Webhook configuration errors:', errors);
    throw new Error(`Webhook configuration validation failed: ${errors.join(', ')}`);
  }

  console.log('✅ Webhook configuration validated successfully');
  return true;
};

// Get configuration for specific field
const getFieldConfig = (fieldName) => {
  return {
    field: fieldName,
    permissions: webhookConfig.fieldPermissions[fieldName] || [],
    eventType: webhookConfig.eventTypes[fieldName] || null,
    requiresAdvancedAccess: webhookConfig.eventTypes[fieldName]?.requiresAdvancedAccess || false
  };
};

// Get all supported fields for a permission level
const getFieldsByPermission = (permission) => {
  return Object.entries(webhookConfig.fieldPermissions)
    .filter(([field, permissions]) => permissions.includes(permission))
    .map(([field]) => field);
};

module.exports = {
  config: webhookConfig,
  validateConfig,
  getFieldConfig,
  getFieldsByPermission
};
