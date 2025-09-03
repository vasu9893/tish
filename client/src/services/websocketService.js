import useNotificationStore from '../stores/notificationStore';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
  }

  connect(url = null) {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    
    // Use provided URL or default to backend WebSocket endpoint
    const wsUrl = url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications`;
    
    try {
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      this.socket = new WebSocket(wsUrl);
      
      this.setupEventHandlers();
      this.startConnectionTimeout();
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.handleConnectionError();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      useNotificationStore.getState().setConnectionStatus(true);
      
      // Send authentication if needed
      this.authenticate();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      useNotificationStore.getState().setConnectionStatus(false);
      
      if (!event.wasClean) {
        this.handleReconnection();
      }
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  handleMessage(data) {
    console.log('📨 WebSocket message received:', data);
    
    switch (data.type) {
      case 'notification':
        // Add new notification to store
        useNotificationStore.getState().addNotification(data.payload);
        break;
        
      case 'notification_update':
        // Update existing notification
        // TODO: Implement notification update logic
        break;
        
      case 'heartbeat':
        // Respond to heartbeat
        this.send({ type: 'heartbeat_response', timestamp: Date.now() });
        break;
        
      case 'auth_success':
        console.log('✅ WebSocket authentication successful');
        break;
        
      case 'auth_failed':
        console.error('❌ WebSocket authentication failed:', data.reason);
        this.reconnect();
        break;
        
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  authenticate() {
    const token = localStorage.getItem('token');
    if (token) {
      this.send({
        type: 'authenticate',
        token: token
      });
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', data);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat', timestamp: Date.now() });
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ WebSocket connection timeout');
        this.handleConnectionError();
      }
    }, 10000); // 10 second timeout
  }

  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  handleConnectionError() {
    this.isConnecting = false;
    this.clearConnectionTimeout();
    this.handleReconnection();
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  reconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.connect();
  }

  disconnect() {
    this.isConnecting = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnection
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'User initiated disconnect');
      this.socket = null;
    }
    
    useNotificationStore.getState().setConnectionStatus(false);
  }

  // Mock mode for development/testing
  startMockMode() {
    console.log('🧪 Starting WebSocket mock mode');
    
    // Simulate connection
    setTimeout(() => {
      useNotificationStore.getState().setConnectionStatus(true);
    }, 1000);
    
    // Simulate incoming notifications
    this.mockInterval = setInterval(() => {
      const mockNotifications = [
        {
          type: 'notification',
          payload: {
            eventType: 'comments',
            userInfo: { username: 'mock_user_' + Math.floor(Math.random() * 1000) },
            content: { text: 'This is a mock comment for testing purposes.' },
            timestamp: new Date().toISOString(),
            eventId: 'mock_' + Date.now()
          }
        },
        {
          type: 'notification',
          payload: {
            eventType: 'messages',
            userInfo: { username: 'mock_dm_' + Math.floor(Math.random() * 1000) },
            content: { text: 'Mock direct message for testing the notification system.' },
            timestamp: new Date().toISOString(),
            eventId: 'mock_' + (Date.now() + 1)
          }
        },
        {
          type: 'notification',
          payload: {
            eventType: 'mentions',
            userInfo: { username: 'mock_mention_' + Math.floor(Math.random() * 1000) },
            content: { text: 'Mock mention notification to test the UI.' },
            timestamp: new Date().toISOString(),
            eventId: 'mock_' + (Date.now() + 2)
          }
        }
      ];
      
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      this.handleMessage(randomNotification);
    }, 5000); // Every 5 seconds
  }

  stopMockMode() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    useNotificationStore.getState().setConnectionStatus(false);
    console.log('🛑 WebSocket mock mode stopped');
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
