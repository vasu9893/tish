# 🔌 Socket.IO Backend Integration Guide

## Overview

This document outlines how to integrate the InstantChat notification system with your existing Socket.IO server. The frontend is now configured to connect to Socket.IO instead of raw WebSocket.

## Backend Requirements

### **Socket.IO Endpoint**
- **Path**: `/socket.io` (default Socket.IO path)
- **Protocol**: Socket.IO (handles WS/WSS automatically)
- **Authentication**: JWT token validation
- **Message Format**: JSON events

### **Connection Flow**

1. **Client Connection**: Frontend connects to Socket.IO server
2. **Authentication**: Client emits `authenticate` event with JWT token
3. **Subscription**: Client emits `subscribe` event for Instagram webhook events
4. **Real-time Updates**: Server emits events as webhooks arrive

## Event Types

### **Client → Server Events**

#### **Authentication**
```javascript
// Client emits
socket.emit('authenticate', {
  token: 'jwt_token_here',
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Subscribe to Events**
```javascript
// Client emits
socket.emit('subscribe', {
  eventTypes: ['comments', 'messages', 'mentions', 'live_comments'],
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Unsubscribe from Events**
```javascript
// Client emits
socket.emit('unsubscribe', {
  eventTypes: ['comments'],
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Get Subscriptions**
```javascript
// Client emits
socket.emit('get_subscriptions', {
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Test Connection**
```javascript
// Client emits
socket.emit('test_connection', {
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Heartbeat**
```javascript
// Client emits
socket.emit('heartbeat', {
  timestamp: Date.now(),
  clientId: 'instantchat-frontend'
});
```

### **Server → Client Events**

#### **Authentication Response**
```javascript
// Server emits
socket.emit('auth_success', {
  message: 'Authentication successful',
  userId: 'user_id_here',
  timestamp: Date.now()
});
```

#### **Authentication Failed**
```javascript
// Server emits
socket.emit('auth_failed', {
  reason: 'Invalid token',
  timestamp: Date.now()
});
```

#### **Webhook Event**
```javascript
// Server emits
socket.emit('webhook_event', {
  id: 'event_123',
  eventType: 'comments',
  sender: {
    id: 'sender_id',
    username: 'user123'
  },
  content: 'Great post!',
  timestamp: '2024-01-01T12:00:00Z',
  accountId: 'instagram_account_id'
});
```

#### **Heartbeat Response**
```javascript
// Server emits
socket.emit('heartbeat_response', {
  timestamp: Date.now(),
  serverTime: new Date().toISOString()
});
```

#### **Subscription Confirmed**
```javascript
// Server emits
socket.emit('subscription_confirmed', {
  eventTypes: ['comments', 'messages'],
  timestamp: Date.now()
});
```

#### **Connection Info**
```javascript
// Server emits
socket.emit('connection_info', {
  status: 'connected',
  subscriptions: ['comments', 'messages'],
  timestamp: Date.now()
});
```

## Backend Implementation (Node.js/Express + Socket.IO)

### **1. Install Socket.IO Dependencies**
```bash
npm install socket.io jsonwebtoken
```

### **2. Socket.IO Server Setup**
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  path: '/socket.io'
});

// Store connected clients
const clients = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('🔌 New Socket.IO connection:', socket.id);
  
  let clientInfo = {
    socket,
    userId: null,
    authenticated: false,
    subscriptions: new Set(),
    lastHeartbeat: Date.now()
  };
  
  // Handle authentication
  socket.on('authenticate', (data) => {
    handleAuthentication(socket, data, clientInfo);
  });
  
  // Handle subscription
  socket.on('subscribe', (data) => {
    handleSubscription(socket, data, clientInfo);
  });
  
  // Handle unsubscription
  socket.on('unsubscribe', (data) => {
    handleUnsubscription(socket, data, clientInfo);
  });
  
  // Handle get subscriptions
  socket.on('get_subscriptions', (data) => {
    handleGetSubscriptions(socket, clientInfo);
  });
  
  // Handle test connection
  socket.on('test_connection', (data) => {
    handleTestConnection(socket, clientInfo);
  });
  
  // Handle heartbeat
  socket.on('heartbeat', (data) => {
    handleHeartbeat(socket, data, clientInfo);
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    if (clientInfo.userId) {
      clients.delete(clientInfo.userId);
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('❌ Socket.IO error:', error);
  });
});
```

### **3. Authentication Handler**
```javascript
function handleAuthentication(socket, data, clientInfo) {
  try {
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
    
    if (decoded.userId === data.userId) {
      clientInfo.userId = data.userId;
      clientInfo.authenticated = true;
      clients.set(data.userId, clientInfo);
      
      // Send success response
      socket.emit('auth_success', {
        message: 'Authentication successful',
        userId: data.userId,
        timestamp: Date.now()
      });
      
      console.log('✅ Client authenticated:', data.userId, 'Socket:', socket.id);
    } else {
      throw new Error('User ID mismatch');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    socket.emit('auth_failed', {
      reason: 'Invalid token',
      timestamp: Date.now()
    });
    
    socket.disconnect(true);
  }
}
```

### **4. Subscription Handler**
```javascript
function handleSubscription(socket, data, clientInfo) {
  if (!clientInfo.authenticated) {
    socket.emit('error', {
      message: 'Not authenticated',
      timestamp: Date.now()
    });
    return;
  }
  
  // Add event types to subscriptions
  data.eventTypes.forEach(eventType => {
    clientInfo.subscriptions.add(eventType);
  });
  
  console.log('📝 Client subscribed to:', Array.from(clientInfo.subscriptions));
  
  // Send confirmation
  socket.emit('subscription_confirmed', {
    eventTypes: Array.from(clientInfo.subscriptions),
    timestamp: Date.now()
  });
}
```

### **5. Webhook Event Broadcasting**
```javascript
// Function to broadcast webhook events to subscribed clients
function broadcastWebhookEvent(eventData) {
  const eventMessage = {
    id: eventData.id,
    eventType: eventData.eventType,
    sender: {
      id: eventData.sender?.id,
      username: eventData.sender?.username
    },
    content: eventData.message?.text || eventData.comment?.text,
    timestamp: eventData.timestamp,
    accountId: eventData.accountId
  };
  
  clients.forEach((clientInfo, userId) => {
    if (clientInfo.authenticated && 
        clientInfo.subscriptions.has(eventData.eventType) &&
        clientInfo.socket.connected) {
      
      try {
        clientInfo.socket.emit('webhook_event', eventMessage);
        console.log(`📤 Sent webhook event to client: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to send to client ${userId}:`, error);
      }
    }
  });
}
```

### **6. Heartbeat Handler**
```javascript
function handleHeartbeat(socket, data, clientInfo) {
  clientInfo.lastHeartbeat = Date.now();
  
  // Send heartbeat response
  socket.emit('heartbeat_response', {
    timestamp: Date.now(),
    serverTime: new Date().toISOString()
  });
}

// Periodic heartbeat check
setInterval(() => {
  const now = Date.now();
  clients.forEach((clientInfo, userId) => {
    if (now - clientInfo.lastHeartbeat > 60000) { // 1 minute timeout
      console.log(`⏰ Client ${userId} heartbeat timeout, closing connection`);
      clientInfo.socket.disconnect(true);
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
  
  // Broadcast to Socket.IO clients
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
# Socket.IO Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_here

# Client Configuration
CLIENT_URL=http://localhost:3000

# Instagram Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_verify_token
INSTAGRAM_APP_SECRET=your_app_secret
```

## Testing

### **1. Test Socket.IO Connection**
```bash
# Using socket.io-client in Node.js
npm install socket.io-client
```

```javascript
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  
  // Test authentication
  socket.emit('authenticate', {
    token: 'your_jwt_token',
    userId: 'test_user',
    timestamp: Date.now()
  });
});

socket.on('auth_success', (data) => {
  console.log('Authentication successful:', data);
  
  // Test subscription
  socket.emit('subscribe', {
    eventTypes: ['comments', 'messages'],
    userId: 'test_user',
    timestamp: Date.now()
  });
});

socket.on('webhook_event', (data) => {
  console.log('Webhook event received:', data);
});
```

### **2. Test Webhook Broadcasting**
```javascript
// In your backend, test broadcasting
setTimeout(() => {
  broadcastWebhookEvent({
    id: 'test_123',
    eventType: 'comments',
    sender: {
      id: 'sender_123',
      username: 'testuser'
    },
    content: 'This is a test comment',
    timestamp: new Date().toISOString(),
    accountId: 'instagram_123'
  });
}, 5000);
```

## Security Considerations

1. **JWT Validation**: Verify tokens on every connection
2. **Rate Limiting**: Prevent spam connections
3. **Input Validation**: Sanitize all incoming data
4. **Connection Limits**: Limit concurrent connections per user
5. **Heartbeat Monitoring**: Detect and close stale connections
6. **CORS Configuration**: Restrict origins to trusted domains

## Performance Optimization

1. **Connection Pooling**: Reuse Socket.IO connections
2. **Event Batching**: Batch multiple events when possible
3. **Selective Broadcasting**: Only send to subscribed clients
4. **Memory Management**: Clean up disconnected clients promptly
5. **Redis Adapter**: Use Redis for horizontal scaling

## Monitoring

1. **Connection Counts**: Track active connections
2. **Event Rates**: Monitor event throughput
3. **Error Rates**: Track authentication and processing errors
4. **Latency**: Measure event delivery times
5. **Memory Usage**: Monitor server memory consumption

## Troubleshooting

### **Common Issues**

1. **Connection Refused**: Check Socket.IO server is running
2. **Authentication Failed**: Verify JWT token and secret
3. **No Events Received**: Check event subscriptions
4. **High Memory Usage**: Monitor client cleanup
5. **CORS Errors**: Check CORS configuration

### **Debug Commands**
```javascript
// Log all connected clients
console.log('Connected clients:', Array.from(clients.keys()));

// Log client subscriptions
clients.forEach((clientInfo, userId) => {
  console.log(`Client ${userId}:`, Array.from(clientInfo.subscriptions));
});

// Log Socket.IO server info
console.log('Socket.IO server info:', {
  engine: io.engine.clientsCount,
  sockets: io.sockets.sockets.size
});
```

## Next Steps

1. **Integrate with Existing Server**: Add Socket.IO to your current Express server
2. **Test Connection**: Verify Socket.IO connectivity
3. **Configure Webhooks**: Set up Instagram webhook endpoints
4. **Monitor Performance**: Track system metrics
5. **Scale Up**: Add Redis adapter for horizontal scaling

## Frontend Integration

The frontend is now fully configured to work with Socket.IO:

- ✅ **Socket.IO Client**: Uses `socket.io-client` library
- ✅ **Event Handling**: Listens for Socket.IO events
- ✅ **Authentication**: Sends JWT token via `authenticate` event
- ✅ **Subscription**: Subscribes to webhook events
- ✅ **Real-time Updates**: Receives instant notifications
- ✅ **Connection Management**: Handles reconnection automatically

The frontend will automatically connect to your Socket.IO server and start receiving real-time Instagram webhook notifications! 🚀
