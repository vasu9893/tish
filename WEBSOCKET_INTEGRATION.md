# 🔌 WebSocket Backend Integration Guide

## Overview

This document outlines how to implement the WebSocket backend endpoint for the InstantChat notification system. The frontend is now configured to connect to a real WebSocket server instead of mock mode.

## Backend Requirements

### **WebSocket Endpoint**
- **Path**: `/ws/notifications`
- **Protocol**: WebSocket (WS/WSS)
- **Authentication**: JWT token validation
- **Message Format**: JSON

### **Connection Flow**

1. **Client Connection**: Frontend connects to `/ws/notifications`
2. **Authentication**: Client sends JWT token immediately after connection
3. **Subscription**: Client subscribes to specific Instagram webhook events
4. **Real-time Updates**: Server pushes webhook events as they arrive

## Message Types

### **Client → Server Messages**

#### **Authentication**
```json
{
  "type": "authenticate",
  "token": "jwt_token_here",
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Subscribe to Events**
```json
{
  "type": "subscribe",
  "eventTypes": ["comments", "messages", "mentions", "live_comments"],
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Unsubscribe from Events**
```json
{
  "type": "unsubscribe",
  "eventTypes": ["comments"],
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Get Subscriptions**
```json
{
  "type": "get_subscriptions",
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Test Connection**
```json
{
  "type": "test_connection",
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Heartbeat**
```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000,
  "clientId": "instantchat-frontend"
}
```

### **Server → Client Messages**

#### **Authentication Response**
```json
{
  "type": "auth_success",
  "message": "Authentication successful",
  "userId": "user_id_here",
  "timestamp": 1640995200000
}
```

#### **Authentication Failed**
```json
{
  "type": "auth_failed",
  "reason": "Invalid token",
  "timestamp": 1640995200000
}
```

#### **Webhook Event**
```json
{
  "type": "webhook_event",
  "payload": {
    "id": "event_123",
    "eventType": "comments",
    "sender": {
      "id": "sender_id",
      "username": "user123"
    },
    "content": "Great post!",
    "timestamp": "2024-01-01T12:00:00Z",
    "accountId": "instagram_account_id"
  }
}
```

#### **Heartbeat Response**
```json
{
  "type": "heartbeat_response",
  "timestamp": 1640995200000,
  "serverTime": "2024-01-01T12:00:00Z"
}
```

#### **Connection Info**
```json
{
  "type": "connection_info",
  "status": "connected",
  "subscriptions": ["comments", "messages"],
  "timestamp": 1640995200000
}
```

## Backend Implementation (Node.js/Express)

### **1. Install WebSocket Dependencies**
```bash
npm install ws jsonwebtoken
```

### **2. WebSocket Server Setup**
```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: process.env.WS_PORT || 8080,
  path: '/ws/notifications'
});

// Store connected clients
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let clientInfo = {
    ws,
    userId: null,
    authenticated: false,
    subscriptions: new Set(),
    lastHeartbeat: Date.now()
  };
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message, clientInfo);
    } catch (error) {
      console.error('❌ Failed to parse message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('🔌 Client disconnected:', clientInfo.userId);
    if (clientInfo.userId) {
      clients.delete(clientInfo.userId);
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});
```

### **3. Message Handler**
```javascript
function handleMessage(ws, message, clientInfo) {
  console.log('📨 Received message:', message.type);
  
  switch (message.type) {
    case 'authenticate':
      handleAuthentication(ws, message, clientInfo);
      break;
      
    case 'subscribe':
      handleSubscription(ws, message, clientInfo);
      break;
      
    case 'unsubscribe':
      handleUnsubscription(ws, message, clientInfo);
      break;
      
    case 'get_subscriptions':
      handleGetSubscriptions(ws, clientInfo);
      break;
      
    case 'test_connection':
      handleTestConnection(ws, clientInfo);
      break;
      
    case 'heartbeat':
      handleHeartbeat(ws, message, clientInfo);
      break;
      
    default:
      console.log('📨 Unknown message type:', message.type);
  }
}
```

### **4. Authentication Handler**
```javascript
function handleAuthentication(ws, message, clientInfo) {
  try {
    const decoded = jwt.verify(message.token, process.env.JWT_SECRET);
    
    if (decoded.userId === message.userId) {
      clientInfo.userId = message.userId;
      clientInfo.authenticated = true;
      clients.set(message.userId, clientInfo);
      
      // Send success response
      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Authentication successful',
        userId: message.userId,
        timestamp: Date.now()
      }));
      
      console.log('✅ Client authenticated:', message.userId);
    } else {
      throw new Error('User ID mismatch');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    ws.send(JSON.stringify({
      type: 'auth_failed',
      reason: 'Invalid token',
      timestamp: Date.now()
    }));
    
    ws.close(1008, 'Authentication failed');
  }
}
```

### **5. Subscription Handler**
```javascript
function handleSubscription(ws, message, clientInfo) {
  if (!clientInfo.authenticated) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Add event types to subscriptions
  message.eventTypes.forEach(eventType => {
    clientInfo.subscriptions.add(eventType);
  });
  
  console.log('📝 Client subscribed to:', Array.from(clientInfo.subscriptions));
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'subscription_confirmed',
    eventTypes: Array.from(clientInfo.subscriptions),
    timestamp: Date.now()
  }));
}
```

### **6. Webhook Event Broadcasting**
```javascript
// Function to broadcast webhook events to subscribed clients
function broadcastWebhookEvent(eventData) {
  const eventMessage = {
    type: 'webhook_event',
    payload: eventData,
    timestamp: Date.now()
  };
  
  clients.forEach((clientInfo, userId) => {
    if (clientInfo.authenticated && 
        clientInfo.subscriptions.has(eventData.eventType) &&
        clientInfo.ws.readyState === WebSocket.OPEN) {
      
      try {
        clientInfo.ws.send(JSON.stringify(eventMessage));
        console.log(`📤 Sent webhook event to client: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to send to client ${userId}:`, error);
      }
    }
  });
}
```

### **7. Heartbeat Handler**
```javascript
function handleHeartbeat(ws, message, clientInfo) {
  clientInfo.lastHeartbeat = Date.now();
  
  // Send heartbeat response
  ws.send(JSON.stringify({
    type: 'heartbeat_response',
    timestamp: Date.now(),
    serverTime: new Date().toISOString()
  }));
}

// Periodic heartbeat check
setInterval(() => {
  const now = Date.now();
  clients.forEach((clientInfo, userId) => {
    if (now - clientInfo.lastHeartbeat > 60000) { // 1 minute timeout
      console.log(`⏰ Client ${userId} heartbeat timeout, closing connection`);
      clientInfo.ws.close(1000, 'Heartbeat timeout');
      clients.delete(userId);
    }
  });
}, 30000); // Check every 30 seconds
```

## Integration with Instagram Webhooks

### **1. Webhook Receiver**
```javascript
// In your webhook route handler
app.post('/api/webhooks/instagram', (req, res) => {
  // Verify webhook signature
  if (!verifyWebhookSignature(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const webhookData = req.body;
  
  // Process webhook data
  processWebhookEvent(webhookData);
  
  // Broadcast to WebSocket clients
  broadcastWebhookEvent({
    id: webhookData.id,
    eventType: webhookData.eventType,
    sender: {
      id: webhookData.sender?.id,
      username: webhookData.sender?.username
    },
    content: webhookData.message?.text || webhookData.comment?.text,
    timestamp: webhookData.timestamp,
    accountId: webhookData.accountId
  });
  
  res.status(200).send('OK');
});
```

### **2. Event Processing**
```javascript
function processWebhookEvent(webhookData) {
  // Store in database
  // Update counters
  // Trigger any business logic
  
  console.log('📥 Processed webhook event:', webhookData.eventType);
}
```

## Environment Variables

```bash
# WebSocket Configuration
WS_PORT=8080
JWT_SECRET=your_jwt_secret_here

# Instagram Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_verify_token
INSTAGRAM_APP_SECRET=your_app_secret
```

## Testing

### **1. Test WebSocket Connection**
```bash
# Using wscat
npm install -g wscat
wscat -c ws://localhost:8080/ws/notifications
```

### **2. Send Test Message**
```json
{
  "type": "authenticate",
  "token": "your_jwt_token",
  "userId": "test_user",
  "timestamp": 1640995200000
}
```

### **3. Subscribe to Events**
```json
{
  "type": "subscribe",
  "eventTypes": ["comments", "messages"],
  "userId": "test_user",
  "timestamp": 1640995200000
}
```

## Security Considerations

1. **JWT Validation**: Verify tokens on every connection
2. **Rate Limiting**: Prevent spam connections
3. **Input Validation**: Sanitize all incoming messages
4. **Connection Limits**: Limit concurrent connections per user
5. **Heartbeat Monitoring**: Detect and close stale connections

## Performance Optimization

1. **Connection Pooling**: Reuse WebSocket connections
2. **Message Batching**: Batch multiple events when possible
3. **Selective Broadcasting**: Only send to subscribed clients
4. **Memory Management**: Clean up disconnected clients promptly

## Monitoring

1. **Connection Counts**: Track active connections
2. **Message Rates**: Monitor message throughput
3. **Error Rates**: Track authentication and processing errors
4. **Latency**: Measure message delivery times

## Troubleshooting

### **Common Issues**

1. **Connection Refused**: Check WebSocket server is running
2. **Authentication Failed**: Verify JWT token and secret
3. **No Events Received**: Check webhook subscriptions
4. **High Memory Usage**: Monitor client cleanup

### **Debug Commands**
```javascript
// Log all connected clients
console.log('Connected clients:', Array.from(clients.keys()));

// Log client subscriptions
clients.forEach((clientInfo, userId) => {
  console.log(`Client ${userId}:`, Array.from(clientInfo.subscriptions));
});
```

## Next Steps

1. **Implement Backend**: Use the code examples above
2. **Test Connection**: Verify WebSocket connectivity
3. **Configure Webhooks**: Set up Instagram webhook endpoints
4. **Monitor Performance**: Track system metrics
5. **Scale Up**: Add load balancing if needed

The frontend is now ready to receive real-time notifications from your backend WebSocket server! 🚀
