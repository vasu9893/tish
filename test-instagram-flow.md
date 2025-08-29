# 🧪 Instagram Login Flow Test Guide

## 🔍 **Test the Complete Instagram Login Flow**

### **Step 1: Test Frontend Button**
1. Go to: `https://instantchat.in`
2. Click "Continue with Instagram" button
3. **Expected**: Redirects to `https://tish-production.up.railway.app/auth/instagram/start?next=/dashboard`

### **Step 2: Test OAuth Start Endpoint**
```bash
# Test the OAuth start endpoint
curl -I "https://tish-production.up.railway.app/auth/instagram/start?next=/dashboard"

# Expected: 302 redirect to Meta OAuth page
# Location header should contain Facebook/Instagram OAuth URL
```

### **Step 3: Test Instagram Routes**
```bash
# Test main Instagram routes
curl "https://tish-production.up.railway.app/api/instagram/test"

# Expected response:
{
  "success": true,
  "message": "Instagram routes are working!",
  "route": "/api/instagram/test"
}
```

### **Step 4: Test Webhook Endpoint**
```bash
# Test webhook accessibility
curl "https://tish-production.up.railway.app/api/instagram/webhook/test"

# Expected response:
{
  "success": true,
  "message": "Webhook endpoint is accessible",
  "verifyToken": "instantchat_webhook_2024_secure_token"
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: 404 on /auth/instagram/start**
- **Problem**: Route not found
- **Check**: `server.js` has `app.use('/auth/instagram', require('./routes/auth.instagram'))`
- **Solution**: Restart server after route changes

### **Issue 2: 500 Error on OAuth Start**
- **Problem**: Error in `getAuthUrl()` function
- **Check**: Environment variables `META_APP_ID`, `BACKEND_URL`
- **Solution**: Verify `.env` configuration

### **Issue 3: Meta OAuth Not Loading**
- **Problem**: Invalid OAuth URL generated
- **Check**: `server/config/meta.js` `getAuthUrl()` function
- **Solution**: Verify Meta app configuration

## 📋 **Test Checklist**

- [ ] Frontend button redirects to correct URL
- [ ] `/auth/instagram/start` endpoint responds with 302 redirect
- [ ] Redirect URL contains valid Meta OAuth parameters
- [ ] Instagram routes are accessible (`/api/instagram/test`)
- [ ] Webhook endpoint is accessible (`/api/instagram/webhook/test`)
- [ ] Server logs show OAuth initiation

## 🔗 **Expected URLs**

1. **Frontend**: `https://instantchat.in`
2. **OAuth Start**: `https://tish-production.up.railway.app/auth/instagram/start?next=/dashboard`
3. **Meta OAuth**: `https://www.facebook.com/v19.0/dialog/oauth?...`
4. **Callback**: `https://tish-production.up.railway.app/api/instagram/auth/instagram/callback`

## 📊 **Server Logs to Watch**

Look for these log messages in Railway:
```
Instagram OAuth initiated: {
  next: '/dashboard',
  reauth: false,
  stateLength: 123,
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## 🚀 **Quick Test Commands**

```bash
# Test all endpoints in sequence
echo "Testing Instagram flow..."

echo "1. Testing OAuth start..."
curl -I "https://tish-production.up.railway.app/auth/instagram/start?next=/dashboard"

echo "2. Testing Instagram routes..."
curl "https://tish-production.up.railway.app/api/instagram/test"

echo "3. Testing webhook..."
curl "https://tish-production.up.railway.app/api/instagram/webhook/test"

echo "Test complete!"
```
