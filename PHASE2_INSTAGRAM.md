# 🚀 InstantChat Phase 2: Instagram Integration

## 📋 Overview

Phase 2 adds **Instagram Direct Message integration** to InstantChat, allowing users to:
- **Connect Instagram Business Accounts** via Meta OAuth
- **Receive Instagram DMs** in real-time through webhooks
- **Send replies to Instagram users** directly from InstantChat
- **Unified chat experience** for both local and Instagram messages

## 🏗️ Architecture

### Backend Components
- **`/api/instagram`** - Instagram OAuth and messaging routes
- **`/webhook/instagram`** - Instagram webhook handler for incoming messages
- **`metaApi.js`** - Meta Graph API helper for Instagram operations
- **`InstagramUser.js`** - MongoDB model for Instagram connections
- **Enhanced `Message.js`** - Support for Instagram message sources

### Frontend Components
- **`ConnectInstagram.jsx`** - Instagram connection page
- **Enhanced `Dashboard.jsx`** - Instagram status and connection link
- **Enhanced `ChatWindow.jsx`** - Instagram message styling and indicators

## 🔧 Setup Instructions

### 1. Meta App Configuration

#### Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add **Instagram Basic Display** product
4. Add **Messenger** product for Instagram messaging

#### Configure Instagram Basic Display
1. In your app dashboard, go to **Instagram Basic Display**
2. Add Instagram test users
3. Note your **App ID** and **App Secret**

#### Configure Messenger for Instagram
1. Go to **Messenger** product settings
2. Add Instagram account
3. Generate **Page Access Token**
4. Set up webhook subscription

### 2. Environment Variables

Update your `.env` file:

```env
# Existing variables
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:3000

# New Instagram/Meta variables
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_webhook_verification_token
META_GRAPH_URL=https://graph.facebook.com/v19.0
```

### 3. Webhook Configuration

#### Set Webhook URL
- **Webhook URL**: `https://yourdomain.com/webhook/instagram`
- **Verify Token**: Use the same value as `META_VERIFY_TOKEN`
- **Fields**: Subscribe to `messages` and `messaging_postbacks`

#### Webhook Verification
The webhook endpoint automatically handles Meta's verification challenge:
- **GET** `/webhook/instagram` - Webhook verification
- **POST** `/webhook/instagram` - Incoming message processing

## 🚀 Usage Flow

### 1. Connect Instagram Account

1. **User logs in** to InstantChat
2. **Navigates to** "Connect Instagram" page
3. **Clicks "Connect Instagram"** button
4. **Redirected to** Meta OAuth login
5. **Authorizes permissions** (Instagram Basic + Messenger)
6. **Returns to** InstantChat with connected status

### 2. Receive Instagram Messages

1. **Instagram user** sends DM to your business account
2. **Meta webhook** triggers POST to `/webhook/instagram`
3. **Message processed** and saved to MongoDB
4. **Socket.io emits** message to all connected clients
5. **Frontend displays** message with Instagram styling

### 3. Send Instagram Replies

1. **User types message** in InstantChat
2. **Message sent** to `/api/instagram/sendMessage`
3. **Backend calls** Meta Graph API
4. **Message delivered** to Instagram user
5. **Message saved** to database and broadcasted

## 📱 Frontend Features

### Instagram Connection Page
- **Beautiful UI** with gradient design
- **Connection status** display
- **Feature highlights** explanation
- **Step-by-step** instructions

### Enhanced Dashboard
- **Instagram status indicator** in header
- **Quick connect button** for unconnected users
- **Real-time updates** for connection status

### Message Display
- **Instagram messages** with special styling
- **Source indicators** (Instagram badge)
- **Color coding**:
  - 🔵 **Blue**: Local messages
  - 🟠 **Pink/Orange**: Instagram messages
  - 📱 **Instagram badge**: Shows message source

## 🔌 API Endpoints

### Instagram Routes (`/api/instagram`)

#### `GET /auth/instagram`
- Starts OAuth flow
- Returns Meta authorization URL

#### `GET /auth/instagram/callback`
- Handles OAuth callback
- Exchanges code for access token
- Saves Instagram connection data

#### `POST /sendMessage`
- Sends message to Instagram user
- Requires: `recipientId`, `message`
- Protected by JWT authentication

#### `GET /status`
- Returns Instagram connection status
- Shows token expiry information
- Protected by JWT authentication

#### `DELETE /disconnect`
- Disconnects Instagram account
- Protected by JWT authentication

### Webhook Routes (`/webhook`)

#### `GET /instagram`
- Webhook verification endpoint
- Handles Meta's verification challenge

#### `POST /instagram`
- Processes incoming Instagram messages
- Saves messages to database
- Emits via Socket.io for real-time updates

## 🗄️ Database Schema

### InstagramUser Model
```javascript
{
  userId: String,              // InstantChat user ID
  instagramAccountId: String,  // Instagram account ID
  pageId: String,              // Facebook page ID
  pageAccessToken: String,     // Page access token
  longLivedToken: String,      // Long-lived access token
  tokenExpiresAt: Date,        // Token expiration date
  pageName: String,            // Facebook page name
  instagramUsername: String,   // Instagram username
  isConnected: Boolean,        // Connection status
  webhookSubscribed: Boolean   // Webhook subscription status
}
```

### Enhanced Message Model
```javascript
{
  // Existing fields...
  source: String,              // 'local' or 'instagram'
  instagramSenderId: String,   // Instagram user ID
  instagramMessageId: String,  // Instagram message ID
  instagramThreadId: String,   // Instagram conversation ID
  isFromInstagram: Boolean,    // Message from Instagram
  isToInstagram: Boolean       // Message to Instagram
}
```

## 🧪 Testing

### 1. Local Testing
1. **Set up Meta app** with localhost URLs
2. **Use ngrok** for webhook testing
3. **Test OAuth flow** with test users
4. **Verify webhook** message processing

### 2. Production Testing
1. **Deploy to production** server
2. **Update webhook URL** in Meta app
3. **Test with real Instagram accounts**
4. **Monitor webhook delivery**

## 🔒 Security Considerations

### OAuth Security
- **State parameter** for CSRF protection
- **Secure token storage** in database
- **Token expiration** handling
- **Scope limitation** to required permissions

### Webhook Security
- **Verification token** validation
- **HTTPS requirement** for production
- **Rate limiting** for webhook endpoints
- **Input validation** for webhook data

### API Security
- **JWT authentication** for all endpoints
- **User isolation** (users can only access their own data)
- **Input sanitization** for message content
- **Error handling** without information leakage

## 🚀 Next Steps (Phase 3)

### Planned Features
- **Multiple Instagram accounts** per user
- **Message templates** for quick responses
- **Automated responses** based on keywords
- **Message analytics** and reporting
- **File/media sharing** support
- **User management** for team collaboration

### Technical Improvements
- **Redis caching** for Instagram data
- **Message queuing** for high-volume scenarios
- **Webhook retry logic** for failed deliveries
- **Advanced error handling** and monitoring
- **Performance optimization** for large message volumes

## 📚 Resources

### Meta Developer Documentation
- [Instagram Basic Display](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Messenger API for Instagram](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks)
- [OAuth 2.0](https://developers.facebook.com/docs/facebook-login/security)

### InstantChat Documentation
- [Phase 1: Basic Chat](README.md)
- [Installation Guide](INSTALL.md)
- [UI Improvements](UI_IMPROVEMENTS.md)

---

## 🎯 Quick Start Checklist

- [ ] **Meta App** created and configured
- [ ] **Environment variables** set in `.env`
- [ ] **Webhook URL** configured in Meta app
- [ ] **Instagram Basic Display** product added
- [ ] **Messenger for Instagram** product added
- [ ] **Test users** added to Instagram app
- [ ] **Backend dependencies** installed (`npm install`)
- [ ] **Frontend** updated with Instagram components
- [ ] **Database models** created and indexed
- [ ] **Webhook endpoint** accessible from internet
- [ ] **OAuth flow** tested with test users
- [ ] **Message sending** tested via API
- [ ] **Webhook message** processing verified

---

**🎉 Congratulations!** You now have a fully functional Instagram-integrated chat application!
