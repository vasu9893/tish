# 🚀 InstantChat - Instagram Automation Platform

**A complete SaaS platform for Instagram automation, bot flow building, and customer engagement management.**

## ✨ Features

### 🔐 **Authentication & User Management**
- **Secure Login/Signup**: JWT-based authentication with localStorage persistence
- **User Profiles**: Editable profiles with avatar upload support
- **Security Features**: Two-factor authentication (2FA) and login notifications
- **Account Management**: Profile updates, avatar changes, and account deletion

### 📱 **Instagram Integration (v2.0)**
- **Instagram Graph API**: Real-time access to Instagram conversations and messages
- **Facebook OAuth**: Secure authentication through Facebook's OAuth system
- **Advanced Permissions**: `instagram_manage_messages` and `instagram_basic` scopes
- **Real-time Conversations**: Live access to DM threads and message history
- **Message Details**: Full message content, timestamps, and sender information
- **API Limitations**: Handles Instagram's 20-message limit per conversation
- **Error Handling**: Robust error handling for API responses and rate limiting

### 🤖 **Bot Flow Builder**
- **Visual Flow Editor**: Drag-and-drop interface using React Flow
- **Node Types**: Message, Condition, and Action nodes for complex workflows
- **Flow Management**: Save, load, and manage multiple automation flows
- **Real-time Execution**: Automated responses based on incoming messages

### 💬 **Chat Management**
- **Conversation Overview**: View all Instagram conversations in one place
- **Message History**: Complete chat history with real-time updates
- **Smart Notifications**: Unread message counts and conversation status
- **Quick Actions**: Send messages directly from the dashboard

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Tailwind CSS**: Beautiful, consistent styling with custom color schemes
- **shadcn/ui Components**: Professional UI components built on Radix UI
- **Dark/Light Mode Ready**: Prepared for theme switching

## 🏗️ Architecture

### **Frontend (React + Vite)**
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── flow/           # React Flow custom nodes
│   ├── pages/              # Main application pages
│   ├── utils/              # Utility functions and API helpers
│   └── lib/                # Third-party library configurations
```

### **Backend (Node.js + Express)**
```
server/
├── models/                  # MongoDB schemas
├── routes/                  # API endpoint handlers
├── middleware/              # Authentication and validation
├── engine/                  # Bot flow execution engine
└── utils/                   # Helper utilities
```

### **Database (MongoDB Atlas)**
- **User Management**: User accounts, profiles, and authentication
- **Instagram Data**: Connection details and message history
- **Flow Storage**: Bot automation workflows and configurations
- **Message History**: Complete conversation records

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ and npm
- MongoDB Atlas account
- Meta Developer account with Instagram Business Login setup

### **1. Clone and Setup**
```bash
git clone <repository-url>
cd instantchat

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Fill in your configuration
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
META_VERIFY_TOKEN=your_webhook_verify_token
```

### **3. Start Development**
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### **4. Access Application**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api

## 📚 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify` - Verify JWT token

### **User Management**
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `POST /api/user/avatar` - Upload avatar
- `POST /api/user/2fa/enable` - Enable 2FA
- `DELETE /api/user/delete` - Delete account

### **Instagram Integration (v2.0)**
- `GET /api/instagram/status` - Check connection status
- `GET /api/instagram/conversations` - Get real-time conversations from Instagram Graph API
- `GET /api/instagram/conversations/:id/messages` - Get messages from specific conversation
- `POST /api/instagram/send-message` - Send message
- `POST /api/instagram/disconnect` - Disconnect account
- `GET /api/instagram/account` - Get account details

### **Flow Management**
- `POST /api/flow/save` - Save automation flow
- `GET /api/flow/get/:name` - Load flow by name
- `GET /api/flow/user` - Get user's flows
- `DELETE /api/flow/:id` - Delete flow
- `POST /api/flow/:id/test` - Test flow execution

### **Message Management**
- `GET /api/messages/instagram` - Get conversations
- `GET /api/messages/instagram/:id` - Get chat messages

## 🔧 Configuration

### **Meta App Setup (Instagram Graph API)**
1. Create app in [Meta Developer Console](https://developers.facebook.com/)
2. Add Instagram Graph API product
3. Configure Facebook OAuth redirect URIs
4. Set webhook verification token
5. Add required permissions: `instagram_manage_messages`, `instagram_basic`
6. Configure Instagram Business Login for your app

### **MongoDB Atlas**
1. Create cluster in MongoDB Atlas
2. Set up database user with read/write permissions
3. Configure IP whitelist (or use 0.0.0.0/0 for development)
4. Get connection string and add to environment

### **Environment Variables**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/instantchat

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Meta/Instagram (v2.0)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=instantchat_webhook_2024_secure_token
META_GRAPH_URL=https://graph.facebook.com/v21.0

# Client Configuration
CLIENT_URL=http://localhost:5173
```

## 🚀 Deployment

### **Frontend (Netlify)**
```bash
cd client
npm run build
# Deploy dist/ folder to Netlify
```

### **Backend (Railway)**
```bash
cd server
# Connect GitHub repository to Railway
# Railway will auto-deploy on push
```

### **Database (MongoDB Atlas)**
- Use MongoDB Atlas cloud database
- Configure connection string in deployment environment
- Set up proper IP whitelisting for production

## 🧪 Testing

### **Health Check**
```bash
cd server
npm run healthcheck
```

### **API Testing**
```bash
# Test Instagram webhook
curl -X GET "https://your-domain.com/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_token"

# Test authentication
curl -X POST "https://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 📱 Usage Guide

### **1. Getting Started**
1. **Sign Up**: Create your account with email and password
2. **Connect Instagram**: Link your Instagram account via OAuth
3. **Build Flows**: Create automation workflows using the Flow Builder
4. **Monitor Conversations**: View and respond to Instagram messages

### **2. Building Automation Flows**
1. **Add Nodes**: Drag Message, Condition, or Action nodes to canvas
2. **Configure Logic**: Set up conditions and responses
3. **Connect Flow**: Link nodes to create workflow paths
4. **Test & Save**: Test your flow and save for production use

### **3. Managing Conversations**
1. **View All Chats**: See all Instagram conversations in one dashboard
2. **Quick Responses**: Send messages directly from the interface
3. **Automation**: Let your bot flows handle routine responses
4. **Analytics**: Track engagement and response metrics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Protection**: Secure password handling with bcrypt
- **API Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Sanitized user inputs
- **HTTPS Enforcement**: Secure connections in production

## 🚧 Development Roadmap

### **Phase 1** ✅ **COMPLETED**
- Basic authentication system
- User management
- Real-time chat interface

### **Phase 2** ✅ **COMPLETED**
- Instagram OAuth integration
- Webhook handling
- Direct message sending

### **Phase 3** ✅ **COMPLETED**
- Bot flow builder
- Visual workflow editor
- Flow storage and management

### **Phase 4** ✅ **COMPLETED**
- Automation engine
- Real API integration
- Production-ready deployment

### **Phase 5** ✅ **COMPLETED**
- Instagram Graph API integration
- Real-time conversation access
- Facebook OAuth implementation
- Advanced message handling

### **Future Enhancements**
- **Analytics Dashboard**: Message metrics and engagement analytics
- **Multi-Platform Support**: WhatsApp, Facebook Messenger integration
- **Advanced AI**: Natural language processing for smarter responses
- **Team Collaboration**: Multi-user access and role management
- **API Marketplace**: Third-party integrations and plugins

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions on GitHub
- **Email**: Contact support@instantchat.com

## 🙏 Acknowledgments

- **React Flow**: For the visual flow builder
- **shadcn/ui**: For beautiful UI components
- **Tailwind CSS**: For utility-first styling
- **Meta Platform**: For Instagram API access

---

**Built with ❤️ for modern Instagram automation**
