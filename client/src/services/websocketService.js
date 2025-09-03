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
    this.backendUrl = null;
  }

  connect(url = null) {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
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
        // Convert HTTP/HTTPS to WS/WSS
        this.backendUrl = envBackendUrl.replace(/^http/, 'ws') + '/ws/notifications';
      } else {
        // Fallback to current host with WebSocket path
        this.backendUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications`;
      }
    }
    
    try {
      console.log('🔌 Connecting to WebSocket:', this.backendUrl);
      this.socket = new WebSocket(this.backendUrl);
      
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
      console.log('✅ WebSocket connected to backend');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      useNotificationStore.getState().setConnectionStatus(true);
      
      // Send authentication immediately after connection
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
        
      case 'webhook_event':
        // Handle webhook events from Instagram
        this.handleWebhookEvent(data.payload);
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
        
      case 'connection_info':
        console.log('📊 WebSocket connection info:', data);
        break;
        
      default:
        console.log('📨 Unknown message type:', data.type);
    }
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
      console.log('🔐 Sending authentication token to WebSocket');
      this.send({
        type: 'authenticate',
        token: token,
        userId: localStorage.getItem('userId'),
        timestamp: Date.now()
      });
    } else {
      console.warn('⚠️ No authentication token found for WebSocket');
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
      this.send({ 
        type: 'heartbeat', 
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

  // Subscribe to specific webhook events
  subscribeToEvents(eventTypes = []) {
    this.send({
      type: 'subscribe',
      eventTypes: eventTypes,
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Unsubscribe from specific webhook events
  unsubscribeFromEvents(eventTypes = []) {
    this.send({
      type: 'unsubscribe',
      eventTypes: eventTypes,
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Request current webhook subscriptions
  getSubscriptions() {
    this.send({
      type: 'get_subscriptions',
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
  }

  // Test webhook connection
  testConnection() {
    this.send({
      type: 'test_connection',
      userId: localStorage.getItem('userId'),
      timestamp: Date.now()
    });
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

  getBackendUrl() {
    return this.backendUrl;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
