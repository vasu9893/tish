#!/usr/bin/env node

// Simple server debug script
console.log('🔍 Starting server debug...');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('- INSTAGRAM_APP_SECRET:', process.env.INSTAGRAM_APP_SECRET ? 'SET' : 'NOT SET');

// Check if required modules can be loaded
console.log('\n📦 Testing module imports...');

try {
  console.log('✅ Loading express...');
  const express = require('express');
  
  console.log('✅ Loading mongoose...');
  const mongoose = require('mongoose');
  
  console.log('✅ Loading socket.io...');
  const socketIo = require('socket.io');
  
  console.log('✅ Loading dotenv...');
  const dotenv = require('dotenv');
  
  console.log('✅ Loading cors...');
  const cors = require('cors');
  
  console.log('✅ Loading jsonwebtoken...');
  const jwt = require('jsonwebtoken');
  
  console.log('✅ All modules loaded successfully!');
  
} catch (error) {
  console.error('❌ Module import failed:', error.message);
  process.exit(1);
}

// Test database connection
console.log('\n🗄️ Testing database connection...');
try {
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');
  
  dotenv.config();
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set!');
    process.exit(1);
  }
  
  console.log('🔌 Attempting to connect to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('✅ Database connected successfully!');
    mongoose.connection.close();
    console.log('✅ Database connection test passed!');
  }).catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Database test failed:', error.message);
  process.exit(1);
}

// Test server creation
console.log('\n🚀 Testing server creation...');
try {
  const express = require('express');
  const http = require('http');
  const socketIo = require('socket.io');
  const cors = require('cors');
  
  const app = express();
  const server = http.createServer(app);
  
  // Test Socket.IO initialization
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  console.log('✅ Express app created successfully!');
  console.log('✅ HTTP server created successfully!');
  console.log('✅ Socket.IO initialized successfully!');
  
  // Test basic route
  app.get('/test', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  console.log('✅ Basic route added successfully!');
  
  // Test server startup
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`✅ Server started successfully on port ${PORT}!`);
    console.log('✅ All tests passed!');
    
    // Close server after test
    setTimeout(() => {
      server.close(() => {
        console.log('✅ Server closed successfully!');
        process.exit(0);
      });
    }, 1000);
  });
  
} catch (error) {
  console.error('❌ Server creation failed:', error.message);
  process.exit(1);
}
