const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()

// Basic CORS
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'InstantChat API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// Instagram status endpoint (simplified)
app.get('/api/instagram/status', (req, res) => {
  res.json({
    success: true,
    connected: false,
    message: 'Instagram not connected'
  })
})

// Instagram conversations endpoint (simplified)
app.get('/api/instagram/conversations', (req, res) => {
  res.json({
    success: true,
    data: {
      conversations: [],
      total: 0,
      limit: 50,
      offset: 0
    }
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`)
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
