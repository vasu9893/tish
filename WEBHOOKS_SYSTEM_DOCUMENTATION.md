# Webhooks Management System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [Frontend Components](#frontend-components)
7. [Testing & Monitoring](#testing--monitoring)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Deployment](#deployment)

## Overview

The Webhooks Management System is a comprehensive solution for handling Instagram webhook events in the InstantChat application. It provides real-time event processing, subscription management, comprehensive testing capabilities, and advanced monitoring.

### Key Features

- **Meta API Integration**: Full integration with Instagram Graph API
- **Event Processing**: Support for all Instagram webhook event types
- **Security**: X-Hub-Signature-256 validation and payload verification
- **Testing**: Comprehensive test suite creation and execution
- **Monitoring**: Real-time system health checks and performance metrics
- **Scalability**: Batching, retry mechanisms, and deduplication
- **Dashboard**: Complete webhook management interface

### Supported Event Types

| Event Type | Description | Requirements |
|------------|-------------|--------------|
| `comments` | Post comments | `instagram_business_basic` + `instagram_business_manage_comments` |
| `live_comments` | Live stream comments | `instagram_business_basic` + `instagram_business_manage_comments` |
| `messages` | Direct messages | `instagram_business_basic` + `instagram_business_manage_messages` |
| `mentions` | Account mentions | `instagram_basic` + `instagram_manage_comments` |
| `message_reactions` | Message reactions | `instagram_business_basic` + `instagram_business_manage_messages` |
| `message_postbacks` | Message postbacks | `instagram_business_basic` + `instagram_business_manage_messages` |
| `message_referrals` | Message referrals | `instagram_business_basic` + `instagram_business_manage_messages` |
| `message_seen` | Message read receipts | `instagram_business_basic` + `instagram_business_manage_messages` |

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Meta/Instagram│    │  Webhook Routes  │    │  Webhook       │
│   Webhook       │───▶│  (/api/webhooks) │───▶│  Processor     │
│   Events        │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Webhook Events │    │  Processing     │
                       │  Database       │    │  Queue          │
                       │  (MongoDB)      │    │  (In-Memory)    │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Webhook        │    │  Monitoring     │
                       │  Subscriptions  │    │  Service        │
                       │  Database       │    │  (Health Checks)│
                       └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Webhook Reception**: Meta sends webhook events to `/api/webhooks/instagram`
2. **Signature Validation**: System validates `X-Hub-Signature-256` header
3. **Event Processing**: Events are parsed and stored in MongoDB
4. **Business Logic**: Events are processed according to business rules
5. **Queue Management**: Failed events are queued for retry
6. **Monitoring**: System health and performance are tracked

## Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- HTTPS endpoint with valid SSL certificate
- Meta App with Instagram Basic permissions

### Backend Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Configure webhook settings
WEBHOOK_BATCH_SIZE=100
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
META_VERIFY_TOKEN=your_secure_token_here
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

3. **Database Setup**
```bash
# MongoDB collections will be created automatically
# Ensure MongoDB connection string is configured
```

4. **Start Server**
```bash
npm start
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd client
npm install
```

2. **Configure API Endpoints**
```bash
# Update API base URL in client/src/utils/api.js
```

3. **Start Development Server**
```bash
npm run dev
```

## Configuration

### Webhook Configuration (`server/config/webhooks.js`)

```javascript
module.exports = {
  meta: {
    appId: process.env.INSTAGRAM_APP_ID,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    verifyToken: process.env.META_VERIFY_TOKEN,
    graphApiVersion: 'v23.0',
    baseUrl: 'https://graph.instagram.com'
  },
  processing: {
    batchSize: parseInt(process.env.WEBHOOK_BATCH_SIZE) || 100,
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000,
    maxQueueSize: 1000,
    enableDeduplication: true
  },
  security: {
    enableSignatureVerification: true,
    enableMTLS: process.env.WEBHOOK_ENABLE_MTLS === 'true',
    mtlsRootCertPath: process.env.WEBHOOK_MTLS_ROOT_CERT_PATH
  }
};
```

### Meta App Configuration

1. **App Dashboard Setup**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create or configure your app
   - Add Instagram Basic Display product
   - Configure webhook URL: `https://yourdomain.com/api/webhooks/instagram`
   - Set verify token (must match `META_VERIFY_TOKEN`)

2. **Instagram Permissions**
   - Request `instagram_basic` permission
   - Request `instagram_manage_comments` permission
   - Request `instagram_manage_messages` permission

## API Reference

### Webhook Endpoints

#### `GET /api/webhooks/instagram`
**Webhook Verification Endpoint**
- **Purpose**: Handles Meta's webhook verification challenge
- **Parameters**: 
  - `hub.mode`: Always "subscribe"
  - `hub.challenge`: Challenge string to return
  - `hub.verify_token`: Token to verify
- **Response**: Challenge string if verification successful

#### `POST /api/webhooks/instagram`
**Webhook Event Reception**
- **Purpose**: Receives Instagram webhook events from Meta
- **Headers**: 
  - `X-Hub-Signature-256`: SHA256 signature for validation
  - `Content-Type`: application/json
- **Body**: Instagram webhook event payload
- **Response**: 200 OK

#### `GET /api/webhooks/health`
**System Health Check**
- **Purpose**: Check webhook system health
- **Response**: Health status with component checks

### Management Endpoints

#### `GET /api/webhooks/events`
**List Webhook Events**
- **Parameters**:
  - `eventType`: Filter by event type
  - `status`: Filter by processing status
  - `limit`: Number of events to return (default: 50)
  - `offset`: Pagination offset (default: 0)
- **Response**: List of webhook events

#### `POST /api/webhooks/subscriptions`
**Create Webhook Subscription**
- **Body**:
  ```json
  {
    "instagramAccountId": "string",
    "subscribedFields": ["comments", "messages"],
    "webhookConfig": {
      "url": "string",
      "verifyToken": "string"
    }
  }
  ```

#### `GET /api/webhooks/monitoring/dashboard`
**Get Monitoring Dashboard Data**
- **Response**: Comprehensive system metrics and health data

### Testing Endpoints

#### `POST /api/webhooks/testing/create-suite`
**Create Test Suite**
- **Body**:
  ```json
  {
    "accountId": "string",
    "senderId": "string",
    "senderUsername": "string"
  }
  ```

#### `POST /api/webhooks/testing/execute-suite/:suiteId`
**Execute Test Suite**
- **Parameters**: `suiteId` - ID of test suite to execute
- **Response**: Test execution results

## Frontend Components

### WebhookManagement
Main webhook management page with overview, dashboard, testing, monitoring, and notifications tabs.

### WebhookDashboard
Subscription management interface for creating and managing webhook subscriptions.

### WebhookTestingPanel
Comprehensive testing interface for creating and executing webhook test suites.

### WebhookMonitoringDashboard
Real-time monitoring dashboard with system health, performance metrics, and error analysis.

### WebhookNotifications
Real-time notification system for incoming webhook events.

## Testing & Monitoring

### Test Suite Creation

1. **Navigate to Testing Tab**
2. **Fill in Test Parameters**:
   - Instagram Account ID
   - Sender User ID
   - Sender Username
3. **Create Test Suite**: Generates comprehensive test covering all event types
4. **Execute Tests**: Run individual tests or entire suites

### Monitoring Features

- **Real-time Health Checks**: System status every 5 minutes
- **Performance Metrics**: Event processing statistics
- **Error Tracking**: Comprehensive error analysis and recommendations
- **Auto-refresh**: Configurable dashboard updates

### Health Check Components

- Database connectivity
- Webhook endpoint accessibility
- Subscription status
- Event processing success rate
- Meta API connectivity

## Security

### Webhook Validation

1. **Signature Verification**: SHA256 HMAC validation using app secret
2. **Token Verification**: Verify token matching for subscription requests
3. **HTTPS Only**: All webhook endpoints require HTTPS
4. **Rate Limiting**: Built-in rate limiting for API endpoints

### Data Protection

- **Encryption**: All sensitive data encrypted at rest
- **Access Control**: JWT-based authentication for management endpoints
- **Audit Logging**: Complete audit trail for all operations
- **Input Validation**: Comprehensive input sanitization

## Troubleshooting

### Common Issues

#### Webhook Verification Fails
- **Cause**: Verify token mismatch
- **Solution**: Ensure `META_VERIFY_TOKEN` matches Meta App Dashboard

#### Events Not Received
- **Cause**: Webhook URL not accessible
- **Solution**: Check HTTPS configuration and firewall settings

#### Signature Validation Errors
- **Cause**: App secret mismatch
- **Solution**: Verify `INSTAGRAM_APP_SECRET` is correct

#### Database Connection Issues
- **Cause**: MongoDB connection string or credentials
- **Solution**: Check MongoDB connection and authentication

### Debug Endpoints

- `/api/webhooks/health`: System health status
- `/api/webhooks/monitoring/status`: Current system status
- `/api/webhooks/monitoring/errors`: Error analysis and recommendations

### Log Analysis

Check server logs for:
- Webhook reception events
- Processing errors
- Database connection issues
- Meta API errors

## Deployment

### Production Requirements

1. **HTTPS Certificate**: Valid SSL certificate required
2. **Domain**: Publicly accessible domain name
3. **Database**: Production MongoDB instance
4. **Environment Variables**: All required environment variables set
5. **Monitoring**: Application monitoring and alerting

### Deployment Steps

1. **Build Frontend**
```bash
cd client
npm run build
```

2. **Configure Production Environment**
```bash
# Set production environment variables
NODE_ENV=production
```

3. **Start Production Server**
```bash
npm start
```

4. **Verify Webhook Endpoint**
```bash
curl -X GET "https://yourdomain.com/api/webhooks/health"
```

### Scaling Considerations

- **Load Balancing**: Multiple server instances behind load balancer
- **Database**: MongoDB replica set for high availability
- **Caching**: Redis for session and cache management
- **Monitoring**: Application performance monitoring (APM)

## Support & Resources

### Documentation
- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Instagram Graph API Reference](https://developers.facebook.com/docs/instagram-api)

### Community
- [Meta Developer Community](https://developers.facebook.com/community/)
- [GitHub Issues](https://github.com/your-repo/issues)

### Contact
For technical support and questions:
- Email: support@instantchat.com
- Documentation: docs.instantchat.com
- Status Page: status.instantchat.com

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Compatibility**: Node.js 18+, MongoDB 5.0+, React 18+
