import useNotificationStore from '../stores/notificationStore';
import { io } from 'socket.io-client';

class SocketIOService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
    this.backendUrl = null;
  }

  connect(url = null) {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    
    // Use provided URL or construct from environment/current location
    if (url) {
      this.backendUrl = url;
    } else {
      // Get backend URL from environment or construct from current location
      const envBackendUrl = import.meta.env.VITE_API_URL;
      if (envBackendUrl) {
        // Use the same URL for Socket.IO (it will handle WS/WSS automatically)
        this.backendUrl = envBackendUrl;
      } else {
        // Fallback to current host
        this.backendUrl = window.location.origin;
      }
    }
    
    try {
      console.log('🔌 Connecting to Socket.IO:', this.backendUrl);
      
      // Create Socket.IO connection with configuration
      this.socket = io(this.backendUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        forceNew: true
      });
      
      this.setupEventHandlers();
      this.startConnectionTimeout();
      
    } catch (error) {
      console.error('❌ Socket.IO connection failed:', error);
      this.handleConnectionError();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected to backend');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      useNotificationStore.getState().setConnectionStatus(true);
      
      // Send authentication immediately after connection
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      useNotificationStore.getState().setConnectionStatus(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.handleConnectionError();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      useNotificationStore.getState().setConnectionStatus(true);
      
      // Re-authenticate after reconnection
      this.authenticate();
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed after max attempts');
      this.reconnectAttempts = this.maxReconnectAttempts;
    });

    // Custom event handlers
    this.socket.on('notification', (data) => {
      console.log('📨 Notification received:', data);
      this.handleNotification(data);
    });

    this.socket.on('webhook_event', (data) => {
      console.log('📨 Webhook event received:', data);
      this.handleWebhookEvent(data);
    });

    this.socket.on('auth_success', (data) => {
      console.log('✅ Socket.IO authentication successful:', data);
    });

    this.socket.on('auth_failed', (data) => {
      console.error('❌ Socket.IO authentication failed:', data);
      this.reconnect();
    });

    this.socket.on('subscription_confirmed', (data) => {
      console.log('📝 Subscription confirmed:', data);
    });

    this.socket.on('heartbeat_response', (data) => {
      console.log('💓 Heartbeat response:', data);
    });

    this.socket.on('connection_info', (data) => {
      console.log('📊 Connection info:', data);
    });
  }

  handleNotification(data) {
    // Add notification to store
    useNotificationStore.getState().addNotification(data);
  }

  handleWebhookEvent(payload) {
    // Transform webhook event to notification format
    const notification = {
      eventId: payload.id || payload.eventId,
      eventType: payload.eventType || payload.type,
      userInfo: {
        username: payload.sender?.username || payload.from?.username || payload.senderId
      },
      senderId: payload.sender?.id || payload.from?.id || payload.senderId,
      content: {
        text: payload.message?.text || payload.comment?.text || payload.content || 'No content available'
      },
      timestamp: payload.timestamp || payload.created_time || new Date().toISOString(),
      accountId: payload.accountId || payload.instagramAccountId,
      payload: payload // Store full payload for details view
    };

    // Add to notification store
    useNotificationStore.getState().addNotification(notification);
  }

  authenticate() {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔐 Sending authentication token to Socket.IO');
      this.socket.emit('authenticate', {
        token: token,
        userId: localStorage.getItem('userId'),
        timestamp: Date.now()
      });
    } else {
      console.warn('⚠️ No authentication token found for Socket.IO');
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit(event, data);
      } catch (error) {
        console.error('❌ Failed to emit Socket.IO event:', error);
      }
    } else {
      console.warn('⚠️ Socket.IO not connected, event not sent:', event, data);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', { 
        timestamp: Date.now(),
        clientId: 'instantchat-frontend'
      });
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
      if (!this.socket?.connected) {
        console.warn('⚠️ Socket.IO connection timeout');
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
      this.socket.disconnect();
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
      this.socket.disconnect();
      this.socket = null;
    }
    
    useNotificationStore.getState().setConnectionStatus(false);
  }

  // Subscribe to specific webhook events
  subscribeToEvents(eventTypes = []) {
    this.emit('subscribe', {
      eventTypes: eventTypes,
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Unsubscribe from specific webhook events
  unsubscribeFromEvents(eventTypes = []) {
    this.emit('unsubscribe', {
      eventTypes: eventTypes,
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Request current webhook subscriptions
  getSubscriptions() {
    this.emit('get_subscriptions', {
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Test socket connection
  testConnection() {
    this.emit('test_connection', {
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    
    if (this.socket.connected) return 'connected';
    if (this.socket.connecting) return 'connecting';
    return 'disconnected';
  }

  getBackendUrl() {
    return this.backendUrl;
  }

  // Get Socket.IO specific info
  getSocketInfo() {
    if (!this.socket) return null;
    
    return {
      id: this.socket.id,
      connected: this.socket.connected,
      disconnected: this.socket.disconnected
    };
  }
}

// Create singleton instance
const socketIOService = new SocketIOService();

export default socketIOService;
