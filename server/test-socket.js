const { io } = require('socket.io-client');

// Use production URLs instead of localhost
const BACKEND_URL = 'https://tish-production.up.railway.app';
const CLIENT_URL = 'https://instantchat.in';

// Test Socket.IO connection and webhook events
async function testSocketIO() {
  console.log('🧪 Testing Socket.IO connection and webhook events...');
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
  
  // Connect to Socket.IO server
  const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling']
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
    
    // Test authentication
    socket.emit('authenticate', {
      token: 'test_token',
      userId: 'test_user_123',
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });
  
  // Authentication events
  socket.on('auth_success', (data) => {
    console.log('✅ Authentication successful:', data);
    
    // Subscribe to webhook events
    socket.emit('subscribe', {
      eventTypes: ['comments', 'messages', 'mentions', 'live_comments'],
      userId: 'test_user_123',
      timestamp: Date.now()
    });
  });
  
  socket.on('auth_failed', (data) => {
    console.error('❌ Authentication failed:', data);
  });
  
  // Subscription events
  socket.on('subscription_confirmed', (data) => {
    console.log('📝 Subscription confirmed:', data);
    
    // Test webhook event
    testWebhookEvent();
  });
  
  // Webhook events
  socket.on('webhook_event', (data) => {
    console.log('📨 Webhook event received:', {
      id: data.id,
      eventType: data.eventType,
      sender: data.sender.username,
      content: data.content.text.substring(0, 50) + '...',
      timestamp: data.timestamp
    });
  });
  
  // Heartbeat events
  socket.on('heartbeat_response', (data) => {
    console.log('💓 Heartbeat response:', data);
  });
  
  // Start heartbeat
  setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat', {
        timestamp: Date.now(),
        clientId: 'test-client'
      });
    }
  }, 30000);
  
  // Test webhook event after 5 seconds
  setTimeout(() => {
    testWebhookEvent();
  }, 5000);
}

// Test webhook event via API
async function testWebhookEvent() {
  try {
    console.log('🧪 Testing webhook event via API...');
    
    const response = await fetch(`${BACKEND_URL}/api/test/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType: 'comments',
        sender: {
          id: 'test_sender_456',
          username: 'testuser456'
        },
        content: 'This is a test comment from the test script!',
        accountId: 'test_instagram_account_789'
      })
    });
    
    const result = await response.json();
    console.log('✅ Test webhook API response:', result);
    
  } catch (error) {
    console.error('❌ Test webhook API error:', error);
  }
}

// Test notification event via API
async function testNotification() {
  try {
    console.log('🧪 Testing notification event via API...');
    
    const response = await fetch(`${BACKEND_URL}/api/test/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'This is a test notification from the test script!',
        eventType: 'notification',
        username: 'TestSystem'
      })
    });
    
    const result = await response.json();
    console.log('✅ Test notification API response:', result);
    
  } catch (error) {
    console.error('❌ Test notification API error:', error);
  }
}

// Test connection stats
async function testConnectionStats() {
  try {
    console.log('🧪 Testing connection stats...');
    
    const response = await fetch(`${BACKEND_URL}/api/socket/stats`);
    const result = await response.json();
    console.log('✅ Connection stats:', result);
    
  } catch (error) {
    console.error('❌ Connection stats error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Socket.IO and Webhook tests...\n');
  console.log(`🎯 Testing against production backend: ${BACKEND_URL}\n`);
  
  // Test Socket.IO connection
  await testSocketIO();
  
  // Wait for connection to establish
  setTimeout(async () => {
    // Test webhook event
    await testWebhookEvent();
    
    // Test notification
    await testNotification();
    
    // Test connection stats
    await testConnectionStats();
    
    console.log('\n✅ All tests completed!');
    console.log('💡 Check the server console for webhook broadcasting logs');
    
    // Keep connection alive for a bit to see events
    setTimeout(() => {
      console.log('🔌 Closing test connection...');
      process.exit(0);
    }, 10000);
    
  }, 3000);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🔌 Test terminated by user');
  process.exit(0);
});

// Run the tests
runTests().catch(console.error);
