import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = {}
    
    // Use environment variable for API URL or fallback to localhost
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  }

  connect(token) {
    if (this.socket) {
      return this.socket
    }

    this.socket = io(this.apiUrl, {
      auth: { token },
      transports: ['polling'],
      path: '/socket.io',
      upgrade: false,
      rememberUpgrade: false
    })

    this.socket.on('connect', () => {
      console.log('✅ Connected to InstantChat server')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from InstantChat server')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      this.isConnected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected. Cannot emit event:', event)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
      // Store listener for cleanup
      if (!this.listeners[event]) {
        this.listeners[event] = []
      }
      this.listeners[event].push(callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
      // Remove from stored listeners
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }
}

export default new SocketService()
