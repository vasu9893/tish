# 🚀 InstantChat - Instagram Automation Platform

**Complete SaaS platform for Instagram business automation with real-time webhook notifications, flow builder, and engagement management using Instagram API with Instagram Login.**

## ✨ Features

### 🔐 **Secure Authentication**
- **Real JWT authentication** with secure user management
- **User registration & login** with password hashing
- **Protected API endpoints** with middleware validation
- **Session management** with token expiration

### 📱 **Instagram Integration (Instagram Login)**
- **Instagram API with Instagram Login** - Official Meta approach
- **Business Login for Instagram** - No Facebook Page required
- **OAuth 2.0 authentication** for Instagram Business/Creator accounts
- **Real-time webhook handling** for Instagram events
- **Event monitoring** for comments, mentions, and engagement
- **Permission management** for Instagram features

### 🤖 **Automation & Workflows**
- **Visual Flow Builder** for creating automation workflows
- **Trigger-based automation** (comments received, mentions, etc.)
- **Action nodes** (send response, delay, conditional logic)
- **Workflow templates** for common use cases

### 🔔 **Real-time Notifications**
- **Webhook event monitoring** for Instagram activity
- **Real-time notifications** via Socket.IO
- **Event filtering** and categorization
- **Automation response tracking**
- **Business intelligence dashboard**

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
- Webhook event history
- Workflow and automation data

### **External APIs**
- **Instagram API** with Instagram Login integration
- **Instagram Graph API v21.0** for data access
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

### **3. Instagram App Setup**
1. **Create Meta Developer Account** at [developers.facebook.com](https://developers.facebook.com/)
2. **Create Instagram App** with "Instagram API setup with Instagram login"
3. **Configure OAuth** redirect URIs and webhook endpoints
4. **Set permissions** for your use case
5. **Submit for App Review** to get advanced access

### **4. Start Development**
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:server  # Backend on port 5000
npm run dev:client  # Frontend on port 3000
```

### **5. Create Account & Connect**
1. **Sign up** at http://localhost:3000/signup
2. **Login** with your credentials
3. **Connect Instagram** via Instagram Login OAuth
4. **Monitor webhook events** in the notifications dashboard
5. **Build automation flows** using the Flow Builder

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

### **Why Instagram Login?**
Based on [Meta's official documentation](https://developers.facebook.com/docs/instagram-platform/overview), InstantChat uses **Instagram API with Instagram Login** because:

- ✅ **No Facebook Page requirement** - Works with Instagram-only accounts
- ✅ **Professional account support** - Business and Creator accounts
- ✅ **Full API access** - Comments, mentions, insights, and more
- ✅ **Webhook integration** - Real-time event notifications
- ✅ **Official approach** - Recommended by Meta for business apps

### **Setup Requirements**
1. **Meta Developer Account** with Instagram app
2. **Instagram Professional Account** (Business or Creator)
3. **App permissions** for required features
4. **Webhook verification** token configured

### **Connection Process**
1. **Instagram Login OAuth** initiates Instagram authentication
2. **Permission request** for event monitoring
3. **Webhook setup** for real-time events
4. **Connection storage** in database
5. **Event monitoring** via webhook notifications

### **Webhook Events**
- **Comments** on posts and stories
- **Mentions** and tags
- **Live comments** during broadcasts
- **Message reactions** and interactions
- **Automation flow** executions
- **Webhook processing** status

## 🛠️ Development

### **API Endpoints**
```bash
# Authentication
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me         # Get current user
POST /api/auth/verify     # Verify JWT token

# Instagram (Instagram Login)
GET  /api/instagram/auth  # Check connection status
GET  /api/instagram/connect # Start Instagram Login OAuth
GET  /api/instagram/callback # OAuth callback
POST /api/instagram/webhook # Webhook endpoint
POST /api/instagram/refresh-token # Refresh access token

# Notifications
GET  /api/notifications   # Get webhook event history
POST /api/notifications/mark-read # Mark events as read
```

### **Database Models**
- **User** - Authentication and profile data
- **InstagramConnection** - OAuth tokens and permissions
- **WebhookEvent** - Instagram webhook events
- **Notification** - User notification preferences
- **Workflow** - Automation flow definitions

### **Real-time Events**
- **User authentication** via Socket.IO
- **Webhook event** notifications
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

- **INSTAGRAM_SETUP.md** - Complete Instagram setup guide
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
- **OAuth 2.0** for Instagram authentication

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
- **Instagram Setup** - Follow INSTAGRAM_SETUP.md
- **Issues** - Create GitHub issue
- **Discussions** - Use GitHub discussions
- **Email** - Contact the development team

---

**Built with ❤️ for modern business automation using Instagram API with Instagram Login**
