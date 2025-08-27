# 🗄️ InstantChat Database Schema Documentation

**Complete MongoDB schema reference for the InstantChat platform.**

## 📊 Database Overview

**Database Name**: `instantchat`  
**Connection**: MongoDB Atlas (Cloud)  
**ORM**: Mongoose (Node.js)  
**Collections**: 4 main collections with optimized indexes

## 🔐 User Collection

**Collection**: `users`  
**Purpose**: Store user accounts, profiles, and authentication data

### Schema Definition
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  username: String,                  // Unique username (required)
  email: String,                     // Unique email (required)
  password: String,                  // Hashed password (required)
  fullName: String,                  // User's full name
  bio: String,                       // User biography
  avatarUrl: String,                 // Profile picture URL
  isOnline: Boolean,                 // Online status
  lastSeen: Date,                    // Last activity timestamp
  createdAt: Date,                   // Account creation date
  updatedAt: Date,                   // Last update timestamp
  isActive: Boolean,                 // Account status
  emailVerified: Boolean,            // Email verification status
  twoFactorEnabled: Boolean,         // 2FA status
  twoFactorSecret: String,           // 2FA secret key
  notificationSettings: {            // Notification preferences
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    loginAlerts: Boolean,
    messageAlerts: Boolean
  }
}
```

### Indexes
```javascript
// Unique indexes
{ username: 1 }                      // Unique username constraint
{ email: 1 }                         // Unique email constraint

// Performance indexes
{ createdAt: -1 }                    // Sort by creation date
{ isActive: 1, isOnline: 1 }        // Filter active online users
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "john_doe",
  "email": "john@example.com",
  "password": "$2b$10$hashed_password_string",
  "fullName": "John Doe",
  "bio": "Instagram automation expert",
  "avatarUrl": "https://example.com/avatars/john.jpg",
  "isOnline": true,
  "lastSeen": ISODate("2024-01-01T12:00:00.000Z"),
  "createdAt": ISODate("2024-01-01T00:00:00.000Z"),
  "updatedAt": ISODate("2024-01-01T12:00:00.000Z"),
  "isActive": true,
  "emailVerified": true,
  "twoFactorEnabled": false,
  "notificationSettings": {
    "emailNotifications": true,
    "pushNotifications": false,
    "loginAlerts": true,
    "messageAlerts": true
  }
}
```

## 📱 InstagramUser Collection

**Collection**: `instagramusers`  
**Purpose**: Store Instagram account connections and metadata

### Schema Definition
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  userId: ObjectId,                  // Reference to User collection
  instagramUserId: String,           // Instagram user ID (required)
  username: String,                  // Instagram username (required)
  fullName: String,                  // Instagram display name
  accessToken: String,               // Meta OAuth access token
  refreshToken: String,              // Meta OAuth refresh token
  pageId: String,                    // Instagram page ID
  pageAccessToken: String,           // Page access token
  followers: Number,                 // Follower count
  following: Number,                 // Following count
  posts: Number,                     // Post count
  isBusinessAccount: Boolean,        // Business account status
  isVerified: Boolean,               // Verification status
  profilePicture: String,            // Profile picture URL
  bio: String,                       // Instagram bio
  website: String,                   // Website URL
  connectedAt: Date,                 // Connection timestamp
  lastSync: Date,                    // Last data sync
  isActive: Boolean,                 // Connection status
  permissions: [String],             // Granted permissions
  webhookSubscribed: Boolean,        // Webhook subscription status
  webhookUrl: String,                // Webhook endpoint URL
  metadata: Object                   // Additional Instagram data
}
```

### Indexes
```javascript
// Unique indexes
{ userId: 1 }                        // One Instagram account per user
{ instagramUserId: 1 }               // Unique Instagram user

// Performance indexes
{ isActive: 1, lastSync: -1 }        // Filter active connections
{ connectedAt: -1 }                  // Sort by connection date
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "instagramUserId": "123456789",
  "username": "john_doe_ig",
  "fullName": "John Doe",
  "accessToken": "EAABwzLixnjYBO...",
  "pageId": "987654321",
  "pageAccessToken": "EAABwzLixnjYBO...",
  "followers": 1500,
  "following": 800,
  "posts": 45,
  "isBusinessAccount": true,
  "isVerified": false,
  "profilePicture": "https://example.com/ig_profile.jpg",
  "bio": "Digital marketing expert",
  "website": "https://johndoe.com",
  "connectedAt": ISODate("2024-01-01T00:00:00.000Z"),
  "lastSync": ISODate("2024-01-01T12:00:00.000Z"),
  "isActive": true,
  "permissions": ["instagram_basic", "instagram_content_publish"],
  "webhookSubscribed": true,
  "webhookUrl": "https://api.instantchat.com/webhook/instagram"
}
```

## 💬 Message Collection

**Collection**: `messages`  
**Purpose**: Store all chat messages and conversation history

### Schema Definition
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  sender: String,                    // Sender username/ID
  content: String,                   // Message content (required)
  userId: ObjectId,                  // Reference to User collection
  timestamp: Date,                   // Message timestamp (required)
  room: String,                      // Chat room identifier
  messageType: String,               // Message type (text, image, etc.)
  isEdited: Boolean,                 // Edit status
  editedAt: Date,                    // Edit timestamp
  isDeleted: Boolean,                // Deletion status
  deletedAt: Date,                   // Deletion timestamp
  reactions: [{                      // Message reactions
    userId: ObjectId,
    reaction: String,
    timestamp: Date
  }],
  // Instagram-specific fields
  source: String,                    // Message source (instagram, web, etc.)
  instagramSenderId: String,         // Instagram sender ID
  instagramMessageId: String,        // Instagram message ID
  instagramThreadId: String,         // Instagram thread ID
  isFromInstagram: Boolean,          // Instagram message flag
  isToInstagram: Boolean,            // Outgoing Instagram flag
  // Metadata
  metadata: Object,                  // Additional message data
  attachments: [{                    // File attachments
    type: String,                    // File type
    url: String,                     // File URL
    filename: String,                // Original filename
    size: Number                     // File size in bytes
  }]
}
```

### Indexes
```javascript
// Performance indexes
{ userId: 1, timestamp: -1 }         // User message history
{ room: 1, timestamp: -1 }           // Room message history
{ instagramThreadId: 1, timestamp: -1 } // Instagram conversation
{ source: 1, timestamp: -1 }         // Source-based filtering
{ isDeleted: 1 }                     // Filter deleted messages
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "sender": "customer_123",
  "content": "Hello! I have a question about your product",
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "timestamp": ISODate("2024-01-01T12:00:00.000Z"),
  "room": "instagram",
  "messageType": "text",
  "isEdited": false,
  "isDeleted": false,
  "source": "instagram",
  "instagramSenderId": "123456789",
  "instagramMessageId": "mid_123456789",
  "instgramThreadId": "thread_123",
  "isFromInstagram": true,
  "isToInstagram": false,
  "metadata": {
    "platform": "instagram",
    "messageType": "direct_message"
  }
}
```

## 🤖 Flow Collection

**Collection**: `flows`  
**Purpose**: Store automation workflow definitions and configurations

### Schema Definition
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  userId: ObjectId,                  // Reference to User collection
  name: String,                      // Flow name (required)
  description: String,               // Flow description
  flowJson: Object,                  // React Flow JSON data (required)
  isActive: Boolean,                 // Flow execution status
  isPublic: Boolean,                 // Public sharing status
  tags: [String],                    // Flow categorization tags
  category: String,                  // Flow category
  version: String,                   // Flow version
  executionCount: Number,            // Total executions
  lastExecuted: Date,                // Last execution timestamp
  averageExecutionTime: Number,      // Average execution time (ms)
  successRate: Number,               // Success rate percentage
  // Flow metadata
  metadata: {
    nodeCount: Number,               // Total nodes in flow
    edgeCount: Number,               // Total edges in flow
    complexity: String,              // Flow complexity (simple, medium, complex)
    estimatedExecutionTime: Number,  // Estimated execution time
    variables: [String],             // Used variables
    triggers: [String]               // Trigger conditions
  },
  // Execution settings
  settings: {
    maxExecutionTime: Number,        // Maximum execution time (ms)
    maxRetries: Number,              // Maximum retry attempts
    timeoutAction: String,           // Action on timeout
    errorHandling: String,           // Error handling strategy
    logging: Boolean                 // Enable execution logging
  },
  // Statistics
  statistics: {
    totalExecutions: Number,         // Total executions
    successfulExecutions: Number,    // Successful executions
    failedExecutions: Number,        // Failed executions
    averageResponseTime: Number,     // Average response time
    peakUsage: {                     // Peak usage data
      date: Date,
      executions: Number
    }
  },
  createdAt: Date,                   // Creation timestamp
  updatedAt: Date,                   // Last update timestamp
  createdBy: ObjectId,               // Creator user ID
  lastModifiedBy: ObjectId           // Last modifier user ID
}
```

### Indexes
```javascript
// Performance indexes
{ userId: 1, isActive: 1 }           // User's active flows
{ name: 1, userId: 1 }              // Flow name lookup
{ category: 1, isPublic: 1 }        // Public flows by category
{ tags: 1 }                         // Tag-based search
{ createdAt: -1 }                   // Sort by creation date
{ executionCount: -1 }              // Sort by popularity
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Customer Support Flow",
  "description": "Automated responses for common customer questions",
  "flowJson": {
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
  },
  "isActive": true,
  "isPublic": false,
  "tags": ["customer-support", "automation", "welcome"],
  "category": "customer-service",
  "version": "1.0.0",
  "executionCount": 150,
  "lastExecuted": ISODate("2024-01-01T12:00:00.000Z"),
  "averageExecutionTime": 45,
  "successRate": 98.5,
  "metadata": {
    "nodeCount": 2,
    "edgeCount": 1,
    "complexity": "simple",
    "estimatedExecutionTime": 50,
    "variables": ["user_name", "timestamp"],
    "triggers": ["message_received"]
  },
  "settings": {
    "maxExecutionTime": 5000,
    "maxRetries": 3,
    "timeoutAction": "abort",
    "errorHandling": "continue",
    "logging": true
  },
  "statistics": {
    "totalExecutions": 150,
    "successfulExecutions": 148,
    "failedExecutions": 2,
    "averageResponseTime": 45,
    "peakUsage": {
      "date": ISODate("2024-01-01T10:00:00.000Z"),
      "executions": 25
    }
  },
  "createdAt": ISODate("2024-01-01T00:00:00.000Z"),
  "updatedAt": ISODate("2024-01-01T12:00:00.000Z"),
  "createdBy": ObjectId("507f1f77bcf86cd799439011"),
  "lastModifiedBy": ObjectId("507f1f77bcf86cd799439011")
}
```

## 🔗 Collection Relationships

### One-to-Many Relationships
```
User (1) → InstagramUser (1)
User (1) → Messages (N)
User (1) → Flows (N)
```

### Foreign Key References
```javascript
// In InstagramUser
userId: ObjectId → users._id

// In Message
userId: ObjectId → users._id

// In Flow
userId: ObjectId → users._id
createdBy: ObjectId → users._id
lastModifiedBy: ObjectId → users._id
```

## 📊 Database Operations

### Common Queries

**Get User with Instagram Connection:**
```javascript
const user = await User.findById(userId)
  .populate('instagramUser')
  .exec()
```

**Get User's Active Flows:**
```javascript
const flows = await Flow.find({
  userId: userId,
  isActive: true
}).sort({ createdAt: -1 })
```

**Get Instagram Conversations:**
```javascript
const conversations = await Message.aggregate([
  { $match: { source: 'instagram', userId: ObjectId(userId) } },
  { $group: {
    _id: '$instagramThreadId',
    lastMessage: { $last: '$content' },
    lastTimestamp: { $last: '$timestamp' },
    unreadCount: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
  }},
  { $sort: { lastTimestamp: -1 } }
])
```

**Get Flow Execution Statistics:**
```javascript
const stats = await Flow.aggregate([
  { $match: { userId: ObjectId(userId) } },
  { $group: {
    _id: null,
    totalFlows: { $sum: 1 },
    activeFlows: { $sum: { $cond: ['$isActive', 1, 0] } },
    totalExecutions: { $sum: '$executionCount' },
    averageSuccessRate: { $avg: '$successRate' }
  }}
])
```

## 🚀 Performance Optimization

### Indexing Strategy
1. **Primary Indexes**: Unique constraints and foreign keys
2. **Query Indexes**: Frequently used filter combinations
3. **Sort Indexes**: Common sorting fields
4. **Compound Indexes**: Multi-field queries

### Connection Pooling
```javascript
// MongoDB connection options
const options = {
  maxPoolSize: 10,                   // Maximum connections
  minPoolSize: 2,                    // Minimum connections
  maxIdleTimeMS: 30000,             // Max idle time
  serverSelectionTimeoutMS: 5000,   // Server selection timeout
  socketTimeoutMS: 45000,            // Socket timeout
  bufferMaxEntries: 0                // Disable buffering
}
```

### Data Archiving
- **Active Data**: Last 90 days (hot storage)
- **Archive Data**: 90+ days old (cold storage)
- **Cleanup Jobs**: Monthly data cleanup and optimization

## 🔒 Security Considerations

### Data Encryption
- **At Rest**: MongoDB Atlas encryption
- **In Transit**: TLS 1.3 encryption
- **Sensitive Fields**: Hashed passwords, encrypted tokens

### Access Control
- **Database Users**: Read/write permissions only
- **IP Whitelisting**: Production IP restrictions
- **Connection String**: Environment variable protection

### Data Privacy
- **PII Handling**: Minimal personal data storage
- **Data Retention**: Configurable retention policies
- **GDPR Compliance**: Data export and deletion capabilities

## 📈 Monitoring and Maintenance

### Health Checks
```javascript
// Database connection health
const health = await mongoose.connection.db.admin().ping()
console.log('Database health:', health.ok === 1 ? 'OK' : 'FAILED')

// Collection statistics
const stats = await mongoose.connection.db.stats()
console.log('Database size:', stats.dataSize, 'bytes')
```

### Performance Monitoring
- **Query Performance**: Slow query logging
- **Index Usage**: Index hit/miss ratios
- **Connection Pool**: Active connection monitoring
- **Storage Usage**: Collection size tracking

### Backup Strategy
- **Automated Backups**: Daily MongoDB Atlas backups
- **Point-in-Time Recovery**: 7-day recovery window
- **Cross-Region Replication**: Disaster recovery protection

---

**For database administration, contact: admin@instantchat.com**
