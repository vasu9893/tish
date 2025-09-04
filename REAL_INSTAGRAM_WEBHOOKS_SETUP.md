# 🔗 Real Instagram Webhooks Setup Guide

This guide will help you set up **real Instagram webhooks** to receive live notifications from Instagram activity in your InstantChat dashboard.

## 🚨 **Why You're Not Getting Real Webhooks**

The current system is not receiving real Instagram webhooks because:

1. **No Active Subscription** - Your Instagram account is not subscribed to Meta's webhook system
2. **Missing Meta Configuration** - Webhook endpoints are not configured in Meta Developer Console
3. **Instagram API Limitations** - Using Instagram Basic Display API which has limited webhook support
4. **Webhook URL Not Registered** - Meta doesn't know where to send webhook events

## 📋 **Prerequisites**

Before setting up real webhooks, ensure you have:

- ✅ **Meta Developer Account** with Instagram Business/Creator account
- ✅ **Instagram App** with Instagram Graph API enabled
- ✅ **Public Server URL** (Railway/Heroku/AWS) - **HTTPS required**
- ✅ **Instagram Account Connected** to InstantChat
- ✅ **App Approved** for Instagram Graph API (or in Development mode)

## 🛠️ **Step-by-Step Setup**

### **Step 1: Check Current Status**

1. Open the webhook setup tool: `setup-real-instagram-webhooks.html`
2. Click "Check Instagram Status" to verify your connection
3. Ensure your Instagram account is connected and has proper permissions

### **Step 2: Configure Meta Developer Console**

1. **Go to Meta Developer Console:**
   ```
   https://developers.facebook.com/apps/YOUR_APP_ID/webhooks/
   ```

2. **Add Webhook:**
   - Click "Add Webhook"
   - Set **Callback URL**: `https://tish-production.up.railway.app/api/webhooks/instagram`
   - Set **Verify Token**: `instantchat_webhook_2024_secure_token`
   - Click "Verify and Save"

3. **Subscribe to Webhook Fields:**
   - ✅ `comments` - New comments on your posts
   - ✅ `mentions` - When someone mentions you
   - ✅ `live_comments` - Comments during live videos
   - ✅ `message_reactions` - Reactions to your messages
   - ✅ `messages` - Direct messages (if using Instagram Graph API)

### **Step 3: Subscribe to Webhooks via API**

Use the webhook setup tool or make API calls:

```bash
# Subscribe to webhook fields
curl -X POST https://tish-production.up.railway.app/api/webhooks/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribedFields": ["comments", "mentions", "live_comments", "message_reactions"],
    "webhookConfig": {
      "url": "https://tish-production.up.railway.app/api/webhooks/instagram",
      "verifyToken": "instantchat_webhook_2024_secure_token",
      "secret": "your_webhook_secret_here"
    }
  }'
```

### **Step 4: Test Webhook Endpoints**

1. **Test Verification:**
   ```bash
   curl "https://tish-production.up.railway.app/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=instantchat_webhook_2024_secure_token&hub.challenge=test123"
   ```
   Should return: `test123`

2. **Test Event Processing:**
   ```bash
   curl -X POST https://tish-production.up.railway.app/api/webhooks/instagram \
     -H "Content-Type: application/json" \
     -d '{
       "object": "instagram",
       "entry": [{
         "id": "test_page_id",
         "time": 1234567890,
         "changes": [{
           "field": "comments",
           "value": {
             "item": {
               "id": "test_comment_id",
               "text": "Test comment",
               "from": {"id": "test_user_id", "username": "test_user"}
             }
           }
         }]
       }]
     }'
   ```

### **Step 5: Monitor Webhook Events**

1. **Start Monitoring:**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "https://tish-production.up.railway.app/api/webhooks/events?limit=10"
   ```

2. **Check Real-time Events:**
   - Open your InstantChat dashboard
   - Go to "Notifications" tab
   - You should see live webhook events appearing

## 🔧 **Troubleshooting**

### **Issue: Webhook Verification Fails**

**Symptoms:** Meta Developer Console shows "Verification Failed"

**Solutions:**
1. Check that your server is accessible via HTTPS
2. Verify the webhook URL is correct
3. Ensure the verify token matches exactly
4. Check server logs for verification requests

### **Issue: No Webhook Events Received**

**Symptoms:** Dashboard shows no notifications despite Instagram activity

**Solutions:**
1. Verify webhook subscription in Meta Developer Console
2. Check that your Instagram account is a Business/Creator account
3. Ensure your app has proper permissions
4. Test with the webhook setup tool

### **Issue: Instagram API Limitations**

**Symptoms:** Limited webhook fields available

**Solutions:**
1. Upgrade to Instagram Graph API (requires Facebook Page)
2. Use Instagram Business Login instead of Basic Display API
3. Request additional permissions through Meta App Review

## 📊 **Supported Webhook Events**

| Event Type | Description | Requirements |
|------------|-------------|--------------|
| `comments` | New comments on posts | Instagram Business/Creator account |
| `mentions` | When someone mentions you | Instagram Business/Creator account |
| `live_comments` | Comments during live videos | Instagram Business/Creator account |
| `message_reactions` | Reactions to messages | Instagram Graph API + Page |
| `messages` | Direct messages | Instagram Graph API + Page |
| `message_postbacks` | Postback events | Instagram Graph API + Page |
| `message_referrals` | Referral events | Instagram Graph API + Page |

## 🚀 **Advanced Configuration**

### **Environment Variables**

Add these to your `.env` file:

```env
# Webhook Configuration
META_VERIFY_TOKEN=instantchat_webhook_2024_secure_token
WEBHOOK_BASE_URL=https://tish-production.up.railway.app/api/webhooks
WEBHOOK_INSTAGRAM_URL=https://tish-production.up.railway.app/api/webhooks/instagram

# Meta App Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
```

### **Webhook Security**

1. **Signature Verification:**
   ```javascript
   // Verify webhook signature
   const crypto = require('crypto');
   const signature = req.headers['x-hub-signature-256'];
   const expectedSignature = crypto
     .createHmac('sha256', process.env.META_APP_SECRET)
     .update(JSON.stringify(req.body))
     .digest('hex');
   ```

2. **Rate Limiting:**
   ```javascript
   // Implement rate limiting for webhook endpoints
   const rateLimit = require('express-rate-limit');
   const webhookLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 1000 // limit each IP to 1000 requests per windowMs
   });
   ```

## 📱 **Testing Real Webhooks**

### **Method 1: Use the Setup Tool**

1. Open `setup-real-instagram-webhooks.html`
2. Follow the step-by-step setup process
3. Test each component individually

### **Method 2: Manual Testing**

1. **Create Test Content:**
   - Post a photo on Instagram
   - Ask someone to comment on it
   - Check if the comment appears in your dashboard

2. **Test Mentions:**
   - Ask someone to mention you in a comment
   - Check if the mention appears in your dashboard

3. **Test Live Comments:**
   - Go live on Instagram
   - Ask someone to comment during the live
   - Check if the live comment appears in your dashboard

## 🔍 **Monitoring and Debugging**

### **Check Webhook Status**

```bash
# Check webhook health
curl https://tish-production.up.railway.app/api/webhooks/health

# Get recent events
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://tish-production.up.railway.app/api/webhooks/events?limit=20"
```

### **Server Logs**

Monitor your server logs for webhook activity:

```bash
# Railway logs
railway logs

# Check for webhook requests
grep "Instagram Webhook" logs.txt
```

### **Meta Developer Console**

1. Go to your app's webhook settings
2. Check the "Recent Deliveries" tab
3. Look for successful/failed webhook deliveries

## 🎯 **Expected Results**

After successful setup, you should see:

1. ✅ **Webhook Verification** - Meta Developer Console shows "Verified"
2. ✅ **Live Notifications** - Real Instagram events appear in your dashboard
3. ✅ **Real-time Updates** - Events appear within seconds of Instagram activity
4. ✅ **Proper Event Types** - Comments, mentions, reactions, etc. are categorized correctly

## 🆘 **Getting Help**

If you're still not receiving real webhooks:

1. **Check the Setup Tool** - Use `setup-real-instagram-webhooks.html` for guided setup
2. **Review Server Logs** - Look for webhook-related errors
3. **Verify Meta Configuration** - Ensure webhook is properly configured in Developer Console
4. **Test with Simple Events** - Start with basic comments and mentions
5. **Check Instagram Account Type** - Ensure you're using a Business/Creator account

## 📚 **Additional Resources**

- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Instagram Graph API Webhooks](https://developers.facebook.com/docs/instagram-api/webhooks)
- [Webhook Security Best Practices](https://developers.facebook.com/docs/graph-api/webhooks/security)

---

**Note:** Real Instagram webhooks require a public HTTPS server and proper Meta app configuration. The setup tool (`setup-real-instagram-webhooks.html`) provides a guided process to configure everything correctly.
