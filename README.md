# 🚀 InstantChat - Instagram Automation Platform

**Complete SaaS platform for Instagram business messaging automation with real-time chat, flow builder, and webhook management.**

## ✨ Features

### 🔐 **Secure Authentication**
- **Real JWT authentication** with secure user management
- **User registration & login** with password hashing
- **Protected API endpoints** with middleware validation
- **Session management** with token expiration

### 📱 **Instagram Integration**
- **Meta Graph API v21.0** integration
- **OAuth 2.0 authentication** for Instagram Business accounts
- **Real-time message handling** via webhooks
- **Conversation management** with user context
- **Permission management** for Instagram features

### 🤖 **Automation & Workflows**
- **Visual Flow Builder** for creating automation workflows
- **Trigger-based automation** (message received, time-based, etc.)
- **Action nodes** (send message, delay, conditional logic)
- **Workflow templates** for common use cases

### 💬 **Real-time Communication**
- **Socket.IO integration** for instant messaging
- **Live chat interface** with real-time updates
- **Message history** and conversation threading
- **Multi-user support** with authentication

### 🔧 **Developer Tools**
- **Webhook management** for Instagram events
- **API documentation** with examples
- **Debug endpoints** for troubleshooting
- **Health monitoring** and status checks

## 🏗️ Architecture

### **Frontend (React + Vite)**
- Modern React with hooks and context
- Tailwind CSS for styling
- Socket.IO client for real-time features
- Responsive design for all devices

### **Backend (Node.js + Express)**
- RESTful API with Express.js
- JWT authentication middleware
- MongoDB with Mongoose ODM
- Socket.IO server for real-time features

### **Database (MongoDB)**
- User management and authentication
- Instagram connection storage
- Message history and conversations
- Workflow and automation data

### **External APIs**
- **Meta Graph API** for Instagram integration
- **Webhook handling** for real-time events
- **OAuth 2.0** for secure authentication

## 🚀 Quick Start

### **1. Clone & Install**
```bash
git clone <repository-url>
cd instantchat

# Install dependencies
npm run install:all
```

### **2. Environment Setup**
```bash
# Copy environment template
cp env.example .env

# Edit with your credentials
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/instantchat
JWT_SECRET=your_super_secret_jwt_key
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

### **3. Start Development**
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:server  # Backend on port 5000
npm run dev:client  # Frontend on port 3000
```

### **4. Create Account & Connect**
1. **Sign up** at http://localhost:3000/signup
2. **Login** with your credentials
3. **Connect Instagram** via OAuth
4. **Build automation flows** using the Flow Builder

## 🔐 Authentication System

### **User Management**
- **Secure registration** with validation
- **Password hashing** using bcrypt
- **JWT token generation** for sessions
- **Token verification** on protected routes

### **Security Features**
- **Input validation** and sanitization
- **Password strength** requirements
- **Email uniqueness** checking
- **JWT expiration** handling
- **Protected middleware** for routes

## 📱 Instagram Integration

### **Setup Requirements**
1. **Meta Developer Account** with Instagram Basic Display app
2. **Instagram Business Account** connected to Facebook Page
3. **App permissions** for `instagram_manage_messages`
4. **Webhook verification** token configured

### **Connection Process**
1. **OAuth flow** initiates Instagram login
2. **Permission request** for message management
3. **Webhook setup** for real-time events
4. **Connection storage** in database
5. **Real-time messaging** via Graph API

### **Webhook Handling**
- **Message received** events
- **User interaction** tracking
- **Automation triggers** based on events
- **Real-time notifications** via Socket.IO

## 🛠️ Development

### **API Endpoints**
```bash
# Authentication
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me         # Get current user
POST /api/auth/verify     # Verify JWT token

# Instagram
GET  /api/instagram/auth  # Check connection status
POST /api/instagram/connect # Start OAuth flow
GET  /api/instagram/callback # OAuth callback
POST /api/instagram/webhook # Webhook endpoint

# Messages
GET  /api/messages        # Get conversation history
POST /api/messages        # Send message
GET  /api/conversations   # List conversations
```

### **Database Models**
- **User** - Authentication and profile data
- **InstagramConnection** - OAuth tokens and permissions
- **Conversation** - Chat threads and metadata
- **Message** - Individual messages with content
- **Workflow** - Automation flow definitions

### **Real-time Events**
- **User authentication** via Socket.IO
- **Message delivery** notifications
- **Workflow execution** updates
- **Connection status** changes

## 🚀 Deployment

### **Frontend (Netlify/Vercel)**
```bash
cd client
npm run build
# Deploy dist/ folder
```

### **Backend (Railway/Heroku)**
```bash
cd server
# Connect repository for auto-deploy
# Set environment variables
```

### **Database (MongoDB Atlas)**
- **Cloud-hosted** MongoDB cluster
- **Connection string** in environment
- **IP whitelist** for production servers
- **SSL connections** enabled

## 🧪 Testing

### **Health Check**
```bash
curl https://your-domain.com/api/health
```

### **Authentication Test**
```bash
# Register user
curl -X POST "https://your-domain.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST "https://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'
```

### **Instagram Webhook Test**
```bash
curl -X GET "https://your-domain.com/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_token"
```

## 📚 Documentation

- **API_DOCUMENTATION.md** - Complete API reference
- **INSTALL.md** - Installation and setup guide
- **Code comments** - Inline documentation
- **Environment variables** - Configuration guide

## 🔒 Security

- **JWT authentication** with secure tokens
- **Password hashing** using bcrypt
- **Input validation** and sanitization
- **Protected routes** with middleware
- **Environment variable** protection
- **HTTPS enforcement** in production

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation** - Check the docs folder
- **Issues** - Create GitHub issue
- **Discussions** - Use GitHub discussions
- **Email** - Contact the development team

---

**Built with ❤️ for modern business communication**
