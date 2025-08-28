const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

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
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'

// Initialize socket.io with proper CORS for production
const io = socketIo(server, {
  cors: {
    origin: [clientUrl, "http://localhost:3000", "https://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
})

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
app.use('/api/user', require('./routes/user'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/instagram', require('./routes/instagram'))
app.use('/api/flow', require('./routes/flow'))
app.use('/webhook', require('./routes/webhook'))

// Bull Board admin dashboard (temporarily disabled)
// app.use('/admin/queues', bullBoardAdapter.getRouter())

// Socket.io connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    return next(new Error('Authentication error'))
  }
  
  // For MVP, we'll accept any token
  // In production, verify JWT here
  socket.userId = 'user_' + Date.now()
  next()
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Join default room
  socket.join('general')
  
  // Handle message sending
  socket.on('sendMessage', async (messageData) => {
    try {
      // Save message to database
      const Message = require('./models/Message')
      const newMessage = new Message({
        sender: messageData.sender,
        content: messageData.content,
        userId: messageData.userId,
        timestamp: new Date(),
        source: messageData.source || 'local',
        room: messageData.room || 'general'
      })
      
      await newMessage.save()
      
      // Broadcast message to all clients with source info
      io.emit('message', {
        id: newMessage._id.toString(),
        sender: newMessage.sender,
        content: newMessage.content,
        userId: newMessage.userId,
        timestamp: newMessage.timestamp,
        source: newMessage.source,
        room: newMessage.room,
        isFromInstagram: newMessage.isFromInstagram,
        isToInstagram: newMessage.isToInstagram
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  })
  
  // Handle message history request
  socket.on('getMessageHistory', async () => {
    try {
      const Message = require('./models/Message')
      const messages = await Message.find()
        .sort({ timestamp: 1 })
        .limit(50)
      
      socket.emit('messageHistory', messages.map(msg => ({
        id: msg._id.toString(),
        sender: msg.sender,
        content: msg.content,
        userId: msg.userId,
        timestamp: msg.timestamp,
        source: msg.source || 'local',
        room: msg.room || 'general',
        isFromInstagram: msg.isFromInstagram || false,
        isToInstagram: msg.isToInstagram || false
      })))
    } catch (error) {
      console.error('Error fetching message history:', error)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'InstantChat API is running!',
    environment: process.env.NODE_ENV || 'development',
    clientUrl: clientUrl,
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: 'InstantChat API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Railway-specific health check
app.get('/railway-health', (req, res) => {
  res.status(200).send('OK')
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
