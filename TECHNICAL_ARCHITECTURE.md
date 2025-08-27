# 🏗️ InstantChat Technical Architecture

**Complete technical architecture and system design documentation.**

## 📋 System Overview

### **Architecture Pattern**
InstantChat follows a **Microservices-inspired Monolithic Architecture** with:
- **Frontend**: Single-page React application
- **Backend**: Node.js/Express API server
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live updates
- **External APIs**: Meta Instagram API integration

### **Technology Stack**
```
Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui
Backend: Node.js + Express + Socket.io + Mongoose
Database: MongoDB Atlas (Cloud)
Authentication: JWT + bcrypt
Real-time: Socket.io + WebSockets
External APIs: Meta Graph API + Instagram Basic Display
Deployment: Railway (Backend) + Netlify (Frontend)
```

## 🏛️ System Architecture

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • API Routes    │    │ • Users         │
│ • Flow Builder  │    │ • Webhooks      │    │ • Messages      │
│ • Chat Interface│    │ • Socket.io     │    │ • Flows         │
│ • Settings      │    │ • Flow Engine   │    │ • Instagram     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Real-time     │    │   File Storage  │
│   Services      │    │   Communication │    │                 │
│                 │    │                 │    │                 │
│ • Meta API      │    │ • WebSockets    │    │ • Avatar Images │
│ • Instagram     │    │ • Socket.io     │    │ • Flow Assets   │
│ • OAuth 2.0     │    │ • Event Emitter │    │ • Attachments   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Component Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  App.jsx ──► Router ──► Pages ──► Components ──► UI      │
│     │           │         │          │          │         │
│     │           │         │          │          │         │
│  State      Routes    Views      Reusable    Design      │
│  Management           (Pages)    Components   System     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  server.js ──► Middleware ──► Routes ──► Controllers      │
│      │            │            │            │             │
│      │            │            │            │             │
│   Express     Auth/JWT    API Endpoints   Business       │
│   Server      Validation   & Webhooks     Logic          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Models ──► Mongoose ──► MongoDB ──► Flow Engine          │
│    │          │           │           │                   │
│    │          │           │           │                   │
│  Schemas   ODM Layer   Database    Automation             │
│  & Types                (Atlas)     Engine                │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Frontend Architecture

### **Component Structure**
```
src/
├── components/           # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   └── ...
│   ├── flow/           # Flow Builder components
│   │   ├── MessageNode.jsx
│   │   ├── ConditionNode.jsx
│   │   └── ActionNode.jsx
│   └── layout/         # Layout components
│       ├── Header.jsx
│       └── Sidebar.jsx
├── pages/              # Main application pages
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── FlowBuilder.jsx
│   ├── Chats.jsx
│   └── Settings.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   ├── useSocket.js
│   └── useInstagram.js
├── utils/              # Utility functions
│   ├── api.js
│   ├── auth.js
│   └── helpers.js
├── lib/                # Third-party configurations
│   ├── socket.js
│   └── reactflow.js
└── App.jsx             # Main application component
```

### **State Management**
- **Local State**: React hooks (`useState`, `useReducer`)
- **Context API**: Authentication and user data
- **Local Storage**: JWT tokens and user preferences
- **Socket.io**: Real-time communication state

### **Routing Strategy**
```javascript
// React Router v6 configuration
const routes = [
  {
    path: '/',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>
  },
  {
    path: '/signup',
    element: <PublicRoute><Signup /></PublicRoute>
  },
  {
    path: '/flow-builder',
    element: <ProtectedRoute><FlowBuilder /></ProtectedRoute>
  },
  {
    path: '/connect-instagram',
    element: <ProtectedRoute><ConnectInstagram /></ProtectedRoute>
  }
]
```

### **Component Communication**
```
┌─────────────┐    Props    ┌─────────────┐    Context    ┌─────────────┐
│   Parent    │ ──────────► │   Child     │ ──────────►   │   Global    │
│ Component   │             │ Component   │               │   State     │
└─────────────┘             └─────────────┘               └─────────────┘
       │                           │                              │
       │                           │                              │
       ▼                           ▼                              ▼
┌─────────────┐    Events   ┌─────────────┐    Hooks      ┌─────────────┐
│   State     │ ◄────────── │   Callbacks │ ◄──────────── │   Custom    │
│  Updates    │             │   & Events  │               │   Hooks     │
└─────────────┘             └─────────────┘               └─────────────┘
```

## ⚙️ Backend Architecture

### **Server Structure**
```
server/
├── server.js              # Main server entry point
├── config/                # Configuration files
│   ├── database.js       # MongoDB connection
│   └── socket.js         # Socket.io setup
├── middleware/            # Express middleware
│   ├── auth.js           # JWT authentication
│   ├── cors.js           # CORS configuration
│   ├── validation.js     # Input validation
│   └── rateLimit.js      # Rate limiting
├── routes/                # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── user.js           # User management
│   ├── instagram.js      # Instagram integration
│   ├── flow.js           # Flow management
│   ├── messages.js       # Message handling
│   └── webhook.js        # Webhook endpoints
├── models/                # Database models
│   ├── User.js           # User schema
│   ├── Message.js        # Message schema
│   ├── Flow.js           # Flow schema
│   └── InstagramUser.js  # Instagram connection
├── engine/                # Flow execution engine
│   └── flowEngine.js     # Flow processing logic
├── utils/                 # Utility functions
│   ├── instagram.js      # Instagram API helpers
│   ├── validation.js     # Data validation
│   └── helpers.js        # General utilities
└── scripts/               # Utility scripts
    └── healthcheck.js    # Health monitoring
```

### **API Design Pattern**
```javascript
// RESTful API structure
const apiRoutes = {
  // Authentication
  'POST /api/auth/login': 'User login',
  'POST /api/auth/signup': 'User registration',
  'GET /api/auth/verify': 'Verify JWT token',
  
  // User management
  'GET /api/user/profile': 'Get user profile',
  'PATCH /api/user/profile': 'Update user profile',
  'POST /api/user/avatar': 'Upload avatar',
  'DELETE /api/user/delete': 'Delete account',
  
  // Instagram integration
  'GET /api/instagram/status': 'Check connection status',
  'POST /api/instagram/disconnect': 'Disconnect account',
  'GET /api/instagram/account': 'Get account details',
  'POST /api/instagram/send-message': 'Send message',
  
  // Flow management
  'POST /api/flow/save': 'Save automation flow',
  'GET /api/flow/get/:name': 'Load flow by name',
  'GET /api/flow/user': 'Get user\'s flows',
  'DELETE /api/flow/:id': 'Delete flow',
  
  // Message handling
  'GET /api/messages/instagram': 'Get conversations',
  'GET /api/messages/instagram/:id': 'Get chat messages',
  
  // Webhooks
  'GET /api/webhook/instagram': 'Webhook verification',
  'POST /api/webhook/instagram': 'Webhook events'
}
```

### **Middleware Chain**
```javascript
// Express middleware execution order
app.use(helmet())                    // Security headers
app.use(cors(corsOptions))           // CORS configuration
app.use(express.json())              // JSON body parsing
app.use(express.urlencoded())        // URL-encoded parsing
app.use(rateLimit(rateLimitConfig))  // Rate limiting
app.use('/api', apiRoutes)           // API routes
app.use('/webhook', webhookRoutes)   // Webhook routes
app.use(errorHandler)                // Error handling
```

## 🗄️ Database Architecture

### **Data Model Relationships**
```
User (1) ──► InstagramUser (1)
  │
  ├── Messages (N)
  │   ├── Source: Instagram
  │   ├── Source: Web
  │   └── Source: API
  │
  └── Flows (N)
      ├── Active Flows
      ├── Draft Flows
      └── Archived Flows
```

### **Schema Design Principles**
1. **Normalization**: Balance between normalization and performance
2. **Indexing**: Strategic indexes for common queries
3. **Embedding**: Embed related data when appropriate
4. **References**: Use ObjectId references for large datasets

### **Data Access Patterns**
```javascript
// Common query patterns
const patterns = {
  // User authentication
  'userByEmail': 'Find user by email for login',
  'userById': 'Find user by ID for profile',
  
  // Instagram integration
  'instagramByUserId': 'Find Instagram connection by user',
  'instagramByInstagramId': 'Find user by Instagram ID',
  
  // Message handling
  'conversationsByUser': 'Get all conversations for user',
  'messagesByThread': 'Get messages in specific thread',
  'unreadCountByUser': 'Count unread messages',
  
  // Flow management
  'activeFlowsByUser': 'Get user\'s active flows',
  'flowByNameAndUser': 'Find specific flow by name',
  'flowsByCategory': 'Get flows by category'
}
```

## 🔄 Real-time Architecture

### **Socket.io Implementation**
```javascript
// Socket.io server setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
})

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (verifyToken(token)) {
    socket.userId = decodeToken(token).userId
    next()
  } else {
    next(new Error('Authentication failed'))
  }
})

// Event handlers
io.on('connection', (socket) => {
  socket.join(`user_${socket.userId}`)
  
  socket.on('send_message', handleSendMessage)
  socket.on('typing', handleTyping)
  socket.on('disconnect', handleDisconnect)
})
```

### **Event Flow**
```
1. Client connects → Socket.io authentication
2. User joins room → User-specific channel
3. Message sent → Server processes → Database storage
4. Broadcast → All relevant clients receive update
5. Real-time UI → Frontend updates immediately
```

## 🤖 Flow Engine Architecture

### **Flow Execution Model**
```javascript
class FlowEngine {
  constructor() {
    this.maxExecutionSteps = 100
    this.executionHistory = []
  }
  
  async runAutomation(userId, incomingMessage) {
    // 1. Load user's active flows
    // 2. Find matching flow triggers
    // 3. Execute flow step by step
    // 4. Handle conditions and branching
    // 5. Execute actions and send responses
    // 6. Log execution results
  }
  
  executeNode(node, context) {
    switch (node.type) {
      case 'messageNode':
        return this.executeMessageNode(node, context)
      case 'conditionNode':
        return this.executeConditionNode(node, context)
      case 'actionNode':
        return this.executeActionNode(node, context)
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }
}
```

### **Node Types and Execution**
```javascript
// Message Node
executeMessageNode(node, context) {
  const message = this.interpolateVariables(node.data.content, context)
  return this.sendInstagramMessage(context.recipientId, message)
}

// Condition Node
executeConditionNode(node, context) {
  const message = context.incomingMessage.toLowerCase()
  const keyword = node.data.keyword.toLowerCase()
  return message.includes(keyword)
}

// Action Node
executeActionNode(node, context) {
  switch (node.data.action) {
    case 'tag_customer':
      return this.tagCustomer(context.userId, node.data.tag)
    case 'set_variable':
      return this.setVariable(context.userId, node.data.variable, node.data.value)
    case 'api_call':
      return this.executeApiCall(node.data.endpoint, context)
  }
}
```

## 🔐 Security Architecture

### **Authentication Flow**
```
1. User Login → Username/Password validation
2. JWT Generation → Secure token with expiration
3. Token Storage → localStorage (frontend)
4. API Requests → Authorization header with token
5. Token Validation → Middleware verification
6. User Context → Attached to request object
```

### **Security Measures**
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Short expiration, secure signing
- **CORS Protection**: Restricted origin access
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Sanitization and validation
- **HTTPS Enforcement**: SSL/TLS encryption
- **SQL Injection**: Mongoose parameterized queries

### **Data Protection**
```javascript
// Data encryption strategy
const security = {
  // At rest
  database: 'MongoDB Atlas encryption',
  files: 'File system encryption',
  
  // In transit
  api: 'HTTPS/TLS 1.3',
  websockets: 'WSS (WebSocket Secure)',
  
  // Application level
  passwords: 'bcrypt hashing',
  tokens: 'JWT with expiration',
  sensitive: 'Environment variable protection'
}
```

## 📊 Performance Architecture

### **Optimization Strategies**
1. **Database Indexing**: Strategic indexes for common queries
2. **Connection Pooling**: MongoDB connection management
3. **Caching**: Redis for frequently accessed data
4. **CDN**: Static asset distribution
5. **Lazy Loading**: Component and data loading
6. **Code Splitting**: Bundle optimization

### **Monitoring and Metrics**
```javascript
// Performance monitoring
const metrics = {
  // Response times
  apiLatency: 'Average API response time',
  databaseQuery: 'Database query performance',
  flowExecution: 'Flow execution time',
  
  // Throughput
  requestsPerSecond: 'API request rate',
  concurrentUsers: 'Active user count',
  messageVolume: 'Messages processed per minute',
  
  // Resource usage
  cpuUsage: 'Server CPU utilization',
  memoryUsage: 'Memory consumption',
  databaseConnections: 'Active database connections'
}
```

## 🚀 Deployment Architecture

### **Infrastructure Setup**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Netlify)     │    │   (Railway)     │    │  (MongoDB)      │
│                 │    │                 │    │                 │
│ • Global CDN    │    │ • Auto-scaling  │    │ • Cloud hosting │
│ • SSL/TLS       │    │ • Load balancing │    │ • Backup system │
│ • Build pipeline│    │ • Health checks │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Environment Management**
```javascript
// Environment configuration
const environments = {
  development: {
    database: 'mongodb://localhost:27017/instantchat',
    cors: ['http://localhost:5173'],
    logging: 'debug'
  },
  
  staging: {
    database: process.env.MONGO_URI_STAGING,
    cors: ['https://staging.instantchat.com'],
    logging: 'info'
  },
  
  production: {
    database: process.env.MONGO_URI_PROD,
    cors: ['https://instantchat.com'],
    logging: 'error'
  }
}
```

## 🔄 CI/CD Pipeline

### **Deployment Flow**
```
1. Code Commit → GitHub repository
2. Automated Tests → Jest test suite
3. Build Process → Frontend build, backend validation
4. Deployment → Railway (backend), Netlify (frontend)
5. Health Checks → Automated monitoring
6. Rollback → Quick deployment reversal
```

### **Quality Gates**
- **Code Quality**: ESLint, Prettier
- **Testing**: Unit tests, integration tests
- **Security**: Dependency scanning, vulnerability checks
- **Performance**: Bundle size, load time monitoring
- **Compliance**: GDPR, accessibility standards

## 📈 Scalability Considerations

### **Horizontal Scaling**
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: Distribute data across clusters
- **CDN Distribution**: Global content delivery
- **Microservices**: Break down into smaller services

### **Vertical Scaling**
- **Resource Upgrades**: CPU, memory, storage
- **Performance Tuning**: Database optimization
- **Caching Layers**: Redis, in-memory caching
- **Connection Pooling**: Database connection management

### **Future Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Service Mesh  │    │   Event Bus     │
│                 │    │                 │    │                 │
│ • Routing       │    │ • Service       │    │ • Message       │
│ • Rate Limiting │    │   Discovery     │    │   Queuing       │
│ • Authentication│    │ • Load Balancing│    │ • Event         │
│ • Monitoring    │    │ • Circuit       │    │   Streaming     │
│                 │    │   Breaking      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 Testing Architecture

### **Testing Strategy**
```javascript
// Testing pyramid
const testingStrategy = {
  unit: {
    coverage: '80%+',
    tools: 'Jest, React Testing Library',
    scope: 'Individual components and functions'
  },
  
  integration: {
    coverage: '60%+',
    tools: 'Supertest, MongoDB Memory Server',
    scope: 'API endpoints and database operations'
  },
  
  e2e: {
    coverage: '40%+',
    tools: 'Playwright, Cypress',
    scope: 'Complete user workflows'
  }
}
```

### **Test Infrastructure**
- **Mock Services**: Instagram API simulation
- **Test Database**: Isolated MongoDB instance
- **CI/CD Integration**: Automated test execution
- **Coverage Reporting**: Code coverage metrics

## 📚 Documentation Architecture

### **Documentation Structure**
```
docs/
├── README.md                    # Project overview
├── API_DOCUMENTATION.md         # API reference
├── DATABASE_SCHEMA.md           # Database design
├── DEPLOYMENT_GUIDE.md          # Deployment instructions
├── USER_GUIDE.md               # End-user documentation
├── TECHNICAL_ARCHITECTURE.md    # This document
├── CONTRIBUTING.md              # Development guidelines
└── CHANGELOG.md                # Version history
```

### **Documentation Standards**
- **Markdown Format**: Consistent formatting
- **Code Examples**: Working code snippets
- **Diagrams**: Architecture and flow diagrams
- **Version Control**: Documentation with code
- **Auto-generation**: API docs from code

---

**For technical questions, contact: engineering@instantchat.com**
