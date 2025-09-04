const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const jwt = require('jsonwebtoken') // Added for Socket.IO authentication

// Initialize queue system (temporarily disabled for debugging)
// const { serverAdapter: bullBoardAdapter } = require('./config/bullBoard')
// const { checkQueueHealth } = require('./config/bullBoard')
// require('./config/workers') // Initialize workers

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()
const server = http.createServer(app)

// Get client URL from environment or use default
const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'

// Initialize socket.io with proper CORS for production
const io = socketIo(server, {
  cors: {
    origin: [clientUrl, "https://instantchat.in"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
})

// Track connected clients for heartbeat monitoring
const connectedClients = new Map()

// Connect to MongoDB
connectDB()

// Enhanced CORS middleware for production
app.use(cors({
  origin: true, // Allow all origins temporarily to fix CORS issues
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],
  preflightContinue: false,
  optionsSuccessStatus: 200
}))

// Recreate io with relaxed CORS if needed
io.engine.opts.cors = io.engine.opts.cors || {}
io.engine.opts.cors.origin = true // Allow all origins temporarily
io.engine.opts.cors.credentials = true
io.engine.opts.cors.methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
io.engine.opts.cors.allowedHeaders = ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"]

// Raw body parsing for webhook signature verification (POST requests only)
app.use('/api/webhooks/instagram', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/auth/instagram', require('./routes/auth.instagram')) // Instagram-first auth routes
app.use('/api/user', require('./routes/user'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/instagram', require('./routes/instagram'))
app.use('/api/flow', require('./routes/flow'))
app.use('/webhook', require('./routes/webhook'))

// Webhook Management System
app.use('/api/webhooks', require('./routes/webhooks'))

// Initialize webhook processor with Socket.IO
const webhookProcessor = require('./services/webhookProcessor')
webhookProcessor.setSocketIO(io)
console.log('🔌 Webhook processor connected to Socket.IO for real-time broadcasting')

// Bull Board admin dashboard (temporarily disabled)
// app.use('/admin/queues', bullBoardAdapter.getRouter())

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id)
  
  // Track client connection
  socket.connectedAt = Date.now()
  socket.lastHeartbeat = Date.now()
  
  // Handle user authentication
  socket.on('authenticate', (data) => {
    try {
      // Verify JWT token
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'fallback_secret')
      socket.userId = decoded.user.id
      socket.username = decoded.user.username
      socket.authenticated = true
      
      // Join user-specific room
      socket.join(`user_${socket.userId}`)
      
      // Add to connected clients tracking
      connectedClients.set(socket.userId, {
        socket: socket,
        authenticated: true,
        lastHeartbeat: Date.now(),
        connectedAt: socket.connectedAt
      })
      
      console.log(`✅ User authenticated: ${socket.username} (${socket.userId})`)
      socket.emit('authenticated', { success: true, user: decoded.user })
      
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message)
      socket.emit('authenticated', { success: false, error: 'Authentication failed' })
    }
  })
  
  // Handle Instagram connection status updates
  socket.on('instagram_status_update', (data) => {
    console.log('📱 Instagram status update:', data)
    // Broadcast to all connected clients
    io.emit('instagram_status_changed', data)
  })
  
  // Handle webhook event notifications
  socket.on('webhook_event_received', (data) => {
    console.log('🔔 Webhook event received:', data)
    // Broadcast to specific user
    if (socket.userId) {
      io.to(`user_${socket.userId}`).emit('new_webhook_event', data)
    }
  })
  
  // Handle heartbeat
  socket.on('heartbeat', () => {
    if (socket.userId && connectedClients.has(socket.userId)) {
      const clientInfo = connectedClients.get(socket.userId)
      clientInfo.lastHeartbeat = Date.now()
      connectedClients.set(socket.userId, clientInfo)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
    
    // Remove from connected clients tracking
    if (socket.userId && connectedClients.has(socket.userId)) {
      connectedClients.delete(socket.userId)
      console.log(`🗑️ Removed client ${socket.userId} from tracking`)
    }
  })
})

// ===== WEBHOOK BROADCASTING FUNCTIONS =====

// Function to broadcast webhook events to subscribed clients
function broadcastWebhookEvent(eventData) {
  const eventMessage = {
    id: eventData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: eventData.eventType || eventData.type || 'unknown',
    sender: {
      id: eventData.sender?.id || eventData.from?.id || eventData.senderId || 'unknown',
      username: eventData.sender?.username || eventData.from?.username || eventData.senderId || 'Unknown User'
    },
    content: {
      text: eventData.message?.text || eventData.comment?.text || eventData.content || 'No content available'
    },
    timestamp: eventData.timestamp || eventData.created_time || new Date().toISOString(),
    accountId: eventData.accountId || eventData.instagramAccountId || 'unknown',
    payload: eventData // Store full payload for details view
  }
  
  console.log('📤 Broadcasting webhook event:', {
    eventType: eventMessage.eventType,
    sender: eventMessage.sender.username,
    content: eventMessage.content.text.substring(0, 50) + '...'
  })
  
  let broadcastCount = 0
  
  connectedClients.forEach((clientInfo, userId) => {
    if (clientInfo.authenticated && 
        clientInfo.subscriptions.has(eventMessage.eventType) &&
        clientInfo.socket.connected) {
      
      try {
        clientInfo.socket.emit('webhook_event', eventMessage)
        broadcastCount++
        console.log(`📤 Sent webhook event to client: ${userId}`)
      } catch (error) {
        console.error(`❌ Failed to send to client ${userId}:`, error)
      }
    }
  })
  
  console.log(`📊 Webhook event broadcasted to ${broadcastCount} clients`)
  
  // Also emit to general room for any other listeners
  io.emit('webhook_event', eventMessage)
}

// Function to broadcast general notifications
function broadcastNotification(notificationData) {
  const notificationMessage = {
    id: notificationData.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: notificationData.eventType || 'notification',
    userInfo: {
      username: notificationData.username || notificationData.sender || 'System'
    },
    senderId: notificationData.senderId || 'system',
    content: {
      text: notificationData.message || notificationData.content || 'No content available'
    },
    timestamp: notificationData.timestamp || new Date().toISOString(),
    status: notificationData.status || 'new',
    payload: notificationData
  }
  
  console.log('📢 Broadcasting notification:', {
    eventType: notificationMessage.eventType,
    sender: notificationMessage.userInfo.username,
    content: notificationMessage.content.text.substring(0, 50) + '...'
  })
  
  // Broadcast to all connected clients
  io.emit('notification', notificationMessage)
}

// ===== HEARTBEAT MONITORING =====

// Periodic heartbeat check to clean up stale connections
setInterval(() => {
  const now = Date.now()
  const staleClients = []
  
  connectedClients.forEach((clientInfo, userId) => {
    if (now - clientInfo.lastHeartbeat > 60000) { // 1 minute timeout
      console.log(`⏰ Client ${userId} heartbeat timeout, marking for cleanup`)
      staleClients.push(userId)
    }
  })
  
  // Clean up stale clients
  staleClients.forEach(userId => {
    const clientInfo = connectedClients.get(userId)
    if (clientInfo && clientInfo.socket.connected) {
      console.log(`🔌 Closing stale connection for client: ${userId}`)
      clientInfo.socket.disconnect(true)
    }
    connectedClients.delete(userId)
  })
  
  if (staleClients.length > 0) {
    console.log(`🧹 Cleaned up ${staleClients.length} stale connections`)
  }
}, 30000) // Check every 30 seconds

// ===== UTILITY FUNCTIONS =====

// Function to get connection statistics
function getConnectionStats() {
  const totalClients = connectedClients.size
  const authenticatedClients = Array.from(connectedClients.values()).filter(client => client.authenticated).length
  const totalSubscriptions = Array.from(connectedClients.values()).reduce((total, client) => {
    return total + client.subscriptions.size
  }, 0)
  
  return {
    totalClients,
    authenticatedClients,
    totalSubscriptions,
    timestamp: new Date().toISOString()
  }
}

// Function to test webhook broadcasting (for development/testing)
function testWebhookBroadcasting() {
  const testEvent = {
    id: `test_${Date.now()}`,
    eventType: 'comments',
    sender: {
      id: 'test_sender_123',
      username: 'testuser'
    },
    content: 'This is a test comment for testing webhook broadcasting',
    timestamp: new Date().toISOString(),
    accountId: 'test_instagram_account'
  }
  
  console.log('🧪 Testing webhook broadcasting with test event')
  broadcastWebhookEvent(testEvent)
}

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'InstantChat API is running!',
    environment: process.env.NODE_ENV || 'development',
    clientUrl: clientUrl,
    timestamp: new Date().toISOString()
  })
})

// Test webhook broadcasting endpoint
app.post('/api/test/webhook', (req, res) => {
  try {
    const { eventType, sender, content, accountId } = req.body
    
    const testEvent = {
      id: `test_${Date.now()}`,
      eventType: eventType || 'comments',
      sender: {
        id: sender?.id || 'test_sender_123',
        username: sender?.username || 'testuser'
      },
      content: content || 'This is a test webhook event for testing the notification system',
      timestamp: new Date().toISOString(),
      accountId: accountId || 'test_instagram_account'
    }
    
    console.log('🧪 Test webhook endpoint called:', testEvent)
    
    // Broadcast the test event
    broadcastWebhookEvent(testEvent)
    
    res.json({
      success: true,
      message: 'Test webhook event broadcasted successfully',
      event: testEvent,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test webhook error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Get Socket.IO connection statistics
app.get('/api/socket/stats', (req, res) => {
  try {
    const stats = getConnectionStats()
    
    res.json({
      success: true,
      data: stats,
      message: 'Socket.IO connection statistics retrieved successfully'
    })
    
  } catch (error) {
    console.error('❌ Socket stats error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Test notification broadcasting endpoint
app.post('/api/test/notification', (req, res) => {
  try {
    const { message, eventType, username } = req.body
    
    const testNotification = {
      id: `notif_${Date.now()}`,
      eventType: eventType || 'notification',
      username: username || 'System',
      message: message || 'This is a test notification for testing the notification system',
      timestamp: new Date().toISOString(),
      status: 'new'
    }
    
    console.log('🧪 Test notification endpoint called:', testNotification)
    
    // Broadcast the test notification
    broadcastNotification(testNotification)
    
    res.json({
      success: true,
      message: 'Test notification broadcasted successfully',
      notification: testNotification,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test notification error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Queue system health check (temporarily disabled)
// app.get('/api/health/queues', async (req, res) => {
//   try {
//     const health = await checkQueueHealth()
//     res.json({
//       success: true,
//       timestamp: new Date().toISOString(),
//       queues: health
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       timestamp: new Date().toISOString()
//     })
//   }
// })

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

const PORT = process.env.PORT || 5000

// Start server unless running on Vercel (which imports the app as a handler)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📱 Client URL: ${clientUrl}`)
    console.log(`🔧 CORS enabled for: ${clientUrl}`)
    console.log(`📊 Queue system temporarily disabled for debugging`)
  })
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed')
  })
  
  // Close Socket.io
  io.close(() => {
    console.log('✅ Socket.io closed')
  })
  
  // Close database connection
  const mongoose = require('mongoose')
  await mongoose.connection.close()
  console.log('✅ Database connection closed')
  
  process.exit(0)
})

// Export for Vercel
module.exports = app

// Export Socket.IO instance for use in other modules
server.getIO = () => io
