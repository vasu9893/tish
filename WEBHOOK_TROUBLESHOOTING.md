# 🔧 Instagram Webhook Troubleshooting Guide

## 🚨 "Callback URL or verify token couldn't be validated" Error

This error occurs when Meta cannot verify your webhook endpoint. Here's how to fix it:

### ✅ **Step-by-Step Fix**

#### 1. **Verify Environment Variables**
Ensure your `.env` file has the correct values:

```bash
# Meta/Instagram API Configuration
META_APP_ID=your_actual_app_id
META_APP_SECRET=your_actual_app_secret
META_VERIFY_TOKEN=instantchat_webhook_2024_secure_token
META_GRAPH_URL=https://graph.facebook.com/v19.0
```

**Important**: `META_VERIFY_TOKEN` must match EXACTLY what you set in Meta dashboard.

#### 2. **Meta Dashboard Configuration**
In your Meta app dashboard:

1. Go to **Instagram Basic Display** → **Basic Display**
2. **Webhook URL**: `https://tish-production.up.railway.app/api/instagram/webhook`
3. **Verify Token**: `instantchat_webhook_2024_secure_token` (or your custom token)
4. **Webhook Fields**: Subscribe to `mentions` and `comments`

#### 3. **Test Webhook Accessibility**
Test if your webhook is publicly accessible:

```bash
# Test webhook endpoint
curl "https://tish-production.up.railway.app/api/instagram/webhook/test"

# Expected response:
{
  "success": true,
  "message": "Webhook endpoint is accessible",
  "verifyToken": "instantchat_webhook_2024_secure_token",
  "webhookUrl": "https://tish-production.up.railway.app/api/instagram/webhook"
}
```

### 🔍 **Common Issues & Solutions**

#### **Issue 1: Verify Token Mismatch**
- **Symptom**: "verify token couldn't be validated"
- **Solution**: Ensure `META_VERIFY_TOKEN` in `.env` matches Meta dashboard exactly
- **Check**: No extra spaces, correct case, exact characters

#### **Issue 2: Wrong Webhook URL**
- **Symptom**: "Callback URL couldn't be validated"
- **Solution**: Use `/api/instagram/webhook` not `/auth/instagram/webhook`
- **Correct URL**: `https://tish-production.up.railway.app/api/instagram/webhook`

#### **Issue 3: HTTPS Required**
- **Symptom**: Meta rejects webhook setup
- **Solution**: Meta requires HTTPS for production webhooks
- **Check**: Your Railway app uses HTTPS

#### **Issue 4: App Not Public**
- **Symptom**: Meta cannot reach your webhook
- **Solution**: Ensure Railway app is publicly accessible
- **Test**: Try accessing webhook URL from external browser

### 🧪 **Testing Steps**

#### **Step 1: Test Webhook Endpoint**
```bash
curl "https://tish-production.up.railway.app/api/instagram/webhook/test"
```

#### **Step 2: Test Webhook Verification**
```bash
# Simulate Meta's verification request
curl "https://tish-production.up.railway.app/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=instantchat_webhook_2024_secure_token&hub.challenge=test_challenge"
```

**Expected Response**: `test_challenge`

#### **Step 3: Check Server Logs**
Look for these log messages in your Railway logs:

```
Instagram webhook verification request: {
  mode: 'subscribe',
  token: 'instantchat_webhook_2024_secure_token',
  challenge: 'present',
  expectedToken: 'instantchat_webhook_2024_secure_token',
  timestamp: '2024-01-01T00:00:00.000Z'
}
Instagram webhook verified successfully
```

### 🚀 **Quick Fix Checklist**

- [ ] `META_VERIFY_TOKEN` in `.env` matches Meta dashboard exactly
- [ ] Webhook URL is `https://tish-production.up.railway.app/api/instagram/webhook`
- [ ] Railway app is publicly accessible
- [ ] HTTPS is enabled (Railway handles this)
- [ ] Webhook fields are subscribed (`mentions`, `comments`)
- [ ] Test endpoint returns success: `/api/instagram/webhook/test`

### 📞 **Still Having Issues?**

1. **Check Railway Logs**: Look for webhook verification attempts
2. **Verify Meta App Status**: Ensure app is not in development mode
3. **Test with Postman**: Use Postman to test webhook endpoints
4. **Check CORS**: Ensure CORS allows Meta's requests

### 🔗 **Useful Commands**

```bash
# Check if webhook is accessible
curl -I "https://tish-production.up.railway.app/api/instagram/webhook/test"

# Test webhook verification
curl "https://tish-production.up.railway.app/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Check environment variables (in Railway dashboard)
echo $META_VERIFY_TOKEN
```

---

**Need more help?** Check the main [SETUP.md](./SETUP.md) for complete Instagram integration setup.
