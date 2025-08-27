# 📚 InstantChat API Documentation

**Complete API reference for the InstantChat Instagram automation platform.**

## 🔐 Authentication

All API endpoints require authentication via JWT tokens in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

## 📋 Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://your-domain.com`

## 🔑 Authentication Endpoints

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user@example.com",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Register User
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "newuser",
    "email": "newuser@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Verify Token
```http
GET /api/auth/verify
```

**Headers:**
```http
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user@example.com",
    "email": "user@example.com"
  }
}
```

## 👤 User Management Endpoints

### Get User Profile
```http
GET /api/user/profile
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user@example.com",
    "email": "user@example.com",
    "fullName": "John Doe",
    "bio": "Instagram automation expert",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile
```http
PATCH /api/user/profile
```

**Request Body:**
```json
{
  "fullName": "John Smith",
  "bio": "Updated bio information"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user@example.com",
    "email": "user@example.com",
    "fullName": "John Smith",
    "bio": "Updated bio information"
  }
}
```

### Upload Avatar
```http
POST /api/user/avatar
```

**Request Body:** `FormData`
```javascript
const formData = new FormData()
formData.append('avatar', file)
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://example.com/avatars/new-avatar.jpg"
}
```

### Enable Two-Factor Authentication
```http
POST /api/user/2fa/enable
```

**Response:**
```json
{
  "success": true,
  "message": "2FA setup initiated",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

### Get Notification Settings
```http
GET /api/user/notifications/settings
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "emailNotifications": true,
    "pushNotifications": false,
    "loginAlerts": true,
    "messageAlerts": true
  }
}
```

### Delete Account
```http
DELETE /api/user/delete
```

**Request Body:**
```json
{
  "password": "current_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## 📱 Instagram Integration Endpoints

### Check Instagram Connection Status
```http
GET /api/instagram/status
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "username": "instagram_user",
  "lastSync": "2024-01-01T12:00:00.000Z",
  "pageId": "123456789"
}
```

### Disconnect Instagram Account
```http
POST /api/instagram/disconnect
```

**Response:**
```json
{
  "success": true,
  "message": "Instagram account disconnected successfully"
}
```

### Get Instagram Account Details
```http
GET /api/instagram/account
```

**Response:**
```json
{
  "success": true,
  "account": {
    "username": "instagram_user",
    "fullName": "Instagram User",
    "followers": 1500,
    "following": 800,
    "posts": 45,
    "isBusinessAccount": true,
    "connectedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Send Instagram Message
```http
POST /api/instagram/send-message
```

**Request Body:**
```json
{
  "recipientId": "123456789",
  "message": "Hello! How can I help you today?"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "mid_123456789",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🤖 Flow Management Endpoints

### Save Automation Flow
```http
POST /api/flow/save
```

**Request Body:**
```json
{
  "name": "Customer Support Flow",
  "description": "Automated responses for common questions",
  "nodes": [
    {
      "id": "start_1",
      "type": "startNode",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start" }
    },
    {
      "id": "message_1",
      "type": "messageNode",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Welcome Message",
        "content": "Hello! How can I help you today?"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "start_1",
      "target": "message_1",
      "type": "default"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Flow saved successfully",
  "flowId": "507f1f77bcf86cd799439013"
}
```

### Load Flow by Name
```http
GET /api/flow/get/:name
```

**Response:**
```json
{
  "success": true,
  "flow": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Customer Support Flow",
    "description": "Automated responses for common questions",
    "nodes": [...],
    "edges": [...],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get User's Flows
```http
GET /api/flow/user
```

**Response:**
```json
{
  "success": true,
  "flows": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Customer Support Flow",
      "description": "Automated responses for common questions",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Delete Flow
```http
DELETE /api/flow/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Flow deleted successfully"
}
```

### Toggle Flow Status
```http
PATCH /api/flow/:id/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Flow status updated",
  "isActive": false
}
```

### Test Flow Execution
```http
POST /api/flow/:id/test
```

**Request Body:**
```json
{
  "input": "Hello, I need help with my order"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "executed": true,
    "output": "Hello! How can I help you today?",
    "stepsExecuted": 2,
    "executionTime": "45ms"
  }
}
```

## 💬 Message Management Endpoints

### Get Instagram Conversations
```http
GET /api/messages/instagram
```

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_123",
      "instagramUserId": "123456789",
      "username": "customer1",
      "fullName": "John Customer",
      "lastMessage": "Hello, I have a question",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "unreadCount": 1,
      "avatar": "https://example.com/avatar1.jpg"
    }
  ]
}
```

### Get Chat Messages
```http
GET /api/messages/instagram/:conversationId
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "sender": "customer1",
      "content": "Hello, I have a question",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "isFromUser": false,
      "isInstagram": true
    },
    {
      "id": "msg_124",
      "sender": "you",
      "content": "Hello! How can I help you?",
      "timestamp": "2024-01-01T12:01:00.000Z",
      "isFromUser": true,
      "isInstagram": false
    }
  ]
}
```

## 🔗 Webhook Endpoints

### Instagram Webhook Verification
```http
GET /api/webhook/instagram
```

**Query Parameters:**
- `hub.mode`: subscribe
- `hub.challenge`: challenge string
- `hub.verify_token`: your verification token

**Response:**
```
challenge_string
```

### Instagram Webhook Events
```http
POST /api/webhook/instagram
```

**Request Body:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "123456789",
      "time": 1640995200,
      "messaging": [
        {
          "sender": { "id": "123456789" },
          "recipient": { "id": "987654321" },
          "timestamp": 1640995200,
          "message": {
            "mid": "mid_123456789",
            "text": "Hello, I need help"
          }
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## 📊 Error Responses

All endpoints return consistent error formats:

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "username": "Username is required",
    "email": "Invalid email format"
  }
}
```

### Authentication Error
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Flow with id '123' not found"
}
```

### Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong on our end"
}
```

## 🔒 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute per user
- **Webhook endpoints**: 1000 requests per minute

## 📝 Request Headers

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Optional Headers
```http
Accept: application/json
User-Agent: InstantChat-Client/1.0.0
```

## 🧪 Testing Examples

### cURL Examples

**Login:**
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'
```

**Get Profile (with token):**
```bash
curl -X GET "http://localhost:5000/api/user/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Send Instagram Message:**
```bash
curl -X POST "http://localhost:5000/api/instagram/send-message" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"123456789","message":"Hello!"}'
```

### JavaScript Examples

**Login:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'test@example.com',
    password: 'password123'
  })
})

const data = await response.json()
localStorage.setItem('token', data.token)
```

**Authenticated Request:**
```javascript
const token = localStorage.getItem('token')
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## 📚 SDK Libraries

### JavaScript/TypeScript
```bash
npm install instantchat-sdk
```

```javascript
import { InstantChatClient } from 'instantchat-sdk'

const client = new InstantChatClient({
  baseUrl: 'https://api.instantchat.com',
  token: 'your_jwt_token'
})

// Send message
await client.instagram.sendMessage({
  recipientId: '123456789',
  message: 'Hello!'
})

// Get conversations
const conversations = await client.messages.getConversations()
```

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('https://api.instantchat.com', {
  auth: { token: 'your_jwt_token' }
})
```

### Events

**Message Received:**
```javascript
socket.on('message', (data) => {
  console.log('New message:', data)
})
```

**Flow Executed:**
```javascript
socket.on('flow_executed', (data) => {
  console.log('Flow executed:', data)
})
```

**Instagram Connected:**
```javascript
socket.on('instagram_connected', (data) => {
  console.log('Instagram connected:', data)
})
```

## 📱 Mobile API

### Endpoints
- `POST /api/mobile/push-token` - Register push notification token
- `GET /api/mobile/notifications` - Get user notifications
- `POST /api/mobile/notifications/read` - Mark notifications as read

### Mobile Headers
```http
X-Platform: ios|android
X-App-Version: 1.0.0
X-Device-ID: device_unique_id
```

---

**For more information, visit our [Developer Portal](https://developers.instantchat.com)**
