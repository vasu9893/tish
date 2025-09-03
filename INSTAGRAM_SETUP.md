# 📱 Instagram Platform Setup Guide for InstantChat

**Complete setup guide for Instagram API with Instagram Login integration.**

## 🎯 **Overview**

InstantChat uses **Instagram API with Instagram Login** (Business Login for Instagram) as recommended by [Meta's official documentation](https://developers.facebook.com/docs/instagram-platform/overview). This approach provides:

- ✅ **No Facebook Page requirement** - Works with Instagram-only accounts
- ✅ **Professional account support** - Business and Creator accounts
- ✅ **Full API access** - Comments, mentions, insights, and more
- ✅ **Webhook integration** - Real-time event notifications

## 🚀 **Step 1: Create Meta Developer Account**

1. **Visit** [Meta for Developers](https://developers.facebook.com/)
2. **Sign up** or log in with your Facebook account
3. **Complete** developer verification if required

## 🏗️ **Step 2: Create Your App**

1. **Click** "Create App" in the developer dashboard
2. **Select** "Business" as the app type
3. **Fill in** your app details:
   - **App Name**: `InstantChat` (or your preferred name)
   - **Business Account**: Select your business account
   - **App Contact Email**: Your business email

## 📱 **Step 3: Add Instagram Product**

1. **In your app dashboard**, click "Add Product"
2. **Find** "Instagram" and click "Set Up"
3. **Select** "Instagram API setup with Instagram login"
4. **Complete** the basic setup

## ⚙️ **Step 4: Configure Instagram Login**

### **Basic Settings**
1. **Go to** Instagram > Basic Display > Basic Settings
2. **Add** your redirect URI:
   ```
   https://your-domain.com/api/instagram/callback
   ```
3. **Save** the changes

### **Instagram Graph API Setup**
1. **Go to** Instagram > Instagram API setup with Instagram login
2. **Note** your Instagram App ID and App Secret
3. **Add** the same redirect URI here

## 🔑 **Step 5: Environment Variables**

Add these to your `.env` file:

```env
# Instagram API Configuration
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
INSTAGRAM_VERIFY_TOKEN=your_webhook_verify_token_here

# Client Configuration
CLIENT_URL=https://your-domain.com
```

## 🌐 **Step 6: Webhook Configuration**

### **Webhook Endpoint**
Your webhook endpoint will be:
```
https://your-domain.com/api/instagram/webhook
```

### **Webhook Fields to Subscribe**
Subscribe to these Instagram webhook fields:

| Field | Description | Use Case |
|-------|-------------|----------|
| `comments` | New comments on posts | Comment moderation & responses |
| `mentions` | @mentions in posts/comments | Brand monitoring |
| `messages` | Direct messages | Customer support |
| `live_comments` | Live stream comments | Live engagement |
| `message_reactions` | Message reactions | User sentiment analysis |
| `message_postbacks` | Button clicks | Interactive experiences |

### **Webhook Verification**
1. **Set** your webhook verify token in environment variables
2. **Use** the same token when configuring webhooks in Meta
3. **Test** webhook verification with the GET endpoint

## 🔐 **Step 7: App Review & Permissions**

### **Required Permissions**
Your app will request these permissions during Instagram Login:

| Permission | Purpose | Required |
|------------|---------|----------|
| `instagram_basic` | Basic account info | ✅ Yes |
| `instagram_manage_comments` | Comment moderation | ✅ Yes |
| `instagram_manage_messages` | Direct messaging | ✅ Yes |
| `instagram_manage_insights` | Analytics data | ✅ Yes |

### **App Review Process**
1. **Submit** your app for review
2. **Provide** detailed use case descriptions
3. **Demonstrate** how you'll use each permission
4. **Wait** for Meta's review (typically 1-2 weeks)

## 🧪 **Step 8: Testing Your Integration**

### **Local Development**
1. **Use** ngrok or similar for local webhook testing
2. **Set** redirect URI to your ngrok URL during development
3. **Test** OAuth flow with test Instagram accounts

### **Production Testing**
1. **Deploy** your app to production
2. **Update** redirect URIs to production URLs
3. **Test** with real Instagram professional accounts

## 📊 **Step 9: Monitoring & Analytics**

### **Webhook Health**
- **Monitor** webhook delivery success rates
- **Track** event processing performance
- **Log** any webhook failures or errors

### **API Usage**
- **Monitor** Instagram API call limits
- **Track** token refresh cycles
- **Alert** on rate limit approaching

## 🚨 **Common Issues & Solutions**

### **OAuth Errors**
| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Wrong app ID/secret | Verify environment variables |
| `redirect_uri_mismatch` | URI not configured | Add redirect URI to app settings |
| `invalid_grant` | Expired auth code | Ensure code is used within 1 hour |

### **Webhook Issues**
| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not receiving events | Not subscribed to fields | Subscribe to required webhook fields |
| Verification failing | Wrong verify token | Check environment variable |
| Events not processing | Webhook endpoint errors | Check server logs and error handling |

### **Permission Issues**
| Issue | Cause | Solution |
|-------|-------|----------|
| Permission denied | App not reviewed | Complete app review process |
| Limited functionality | Standard access only | Request advanced access if needed |
| Token expired | 60-day limit reached | Implement token refresh logic |

## 🔒 **Security Best Practices**

### **Token Management**
- **Store** access tokens securely (encrypted in database)
- **Implement** automatic token refresh
- **Monitor** token expiration and validity
- **Rotate** app secrets regularly

### **Webhook Security**
- **Verify** webhook signatures (when available)
- **Use** HTTPS for all webhook endpoints
- **Validate** webhook payloads
- **Rate limit** webhook processing

### **Data Privacy**
- **Comply** with Instagram Platform Terms
- **Implement** proper data retention policies
- **Secure** user data storage
- **Follow** GDPR and privacy regulations

## 📚 **API Reference**

### **Key Endpoints**
- **OAuth**: `https://api.instagram.com/oauth/authorize`
- **Token Exchange**: `https://api.instagram.com/oauth/access_token`
- **Graph API**: `https://graph.instagram.com/v21.0/`
- **Webhook**: Your custom webhook endpoint

### **Rate Limits**
- **API Calls**: 4800 × Number of Impressions per 24 hours
- **Messaging**: 2 calls/second per Instagram account
- **Comments**: 750 calls/hour per Instagram account

## 🎉 **Success Checklist**

- [ ] Meta Developer account created
- [ ] Instagram app created and configured
- [ ] Instagram Login product added
- [ ] Redirect URIs configured
- [ ] Webhook endpoints set up
- [ ] Required permissions configured
- [ ] App submitted for review
- [ ] Environment variables set
- [ ] OAuth flow tested
- [ ] Webhook events receiving
- [ ] Production deployment complete

## 📞 **Support Resources**

- **Meta Developer Documentation**: [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/overview)
- **Instagram API Reference**: [API Documentation](https://developers.facebook.com/docs/instagram-platform/reference)
- **App Review Guidelines**: [App Review Process](https://developers.facebook.com/docs/instagram-platform/app-review)
- **Community Support**: [Meta Developer Community](https://developers.facebook.com/community/)

## 🚀 **Next Steps**

After completing this setup:

1. **Test** your Instagram integration
2. **Build** automation workflows
3. **Monitor** webhook events
4. **Scale** your Instagram automation
5. **Optimize** based on usage patterns

---

**Need help?** Check the troubleshooting section or refer to Meta's official documentation.
