# 🚀 InstantChat Instagram-First Login Setup

This guide will help you set up Instagram Business API integration for InstantChat.

## 📋 Prerequisites

### 1. Instagram Account Requirements
- **Convert to Professional Account**: Your Instagram account must be converted to a Professional account (Business or Creator)
- **Link Facebook Page**: Connect your Instagram account to a Facebook Page
- **Business Verification**: Ensure your Facebook Page is verified (recommended)

### 2. Meta App Configuration
- **Create Meta App**: Go to [Meta for Developers](https://developers.facebook.com/)
- **Add Instagram API**: Enable Instagram Basic Display API and Instagram Graph API
- **Configure Webhooks**: Set up webhook endpoints for real-time updates
- **Add Redirect URI**: Include `https://tish-production.up.railway.app/auth/instagram/callback` in your app's OAuth redirect URIs

### 3. Environment Variables
Copy the following to your `.env` file:

```bash
# Meta/Instagram API Configuration
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_REDIRECT_URI=https://tish-production.up.railway.app/auth/instagram/callback
META_GRAPH_URL=https://graph.facebook.com/v19.0
REQUIRED_SCOPES=instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_read_engagement,business_management
META_VERIFY_TOKEN=your_webhook_verify_token_here
```

## 🔧 Setup Steps

### Step 1: Instagram Account Setup
1. Open Instagram app → Settings → Account → Switch to Professional Account
2. Choose "Business" or "Creator" account type
3. Connect to Facebook Page (create one if needed)
4. Complete business profile setup

### Step 2: Meta App Configuration
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create new app or use existing one
3. Add Instagram Basic Display API product
4. Add Instagram Graph API product
5. Configure OAuth redirect URIs
6. Add test users in Roles → Test Users

### Step 3: Webhook Setup
1. In your Meta app, go to Instagram Basic Display → Basic Display
2. Add webhook endpoint: `https://tish-production.up.railway.app/api/instagram/webhook`
3. Set verify token (use same value as `META_VERIFY_TOKEN`)
4. Subscribe to webhook events: `mentions`, `comments`

**Important**: The webhook endpoint must be publicly accessible and use HTTPS in production.

### Step 4: Test Integration
1. Start your server: `npm run dev`
2. Navigate to Instagram connection page
3. Test OAuth flow with test user account
4. Verify webhook delivery

## 🚨 Common Issues

### "App Not Approved" Error
- Use test users during development
- Submit app for review only when ready for production

### "Invalid Scope" Error
- Ensure all required scopes are added to your Meta app
- Check that Instagram Graph API is enabled

### Webhook Not Receiving Events
- Verify webhook endpoint is publicly accessible
- Check verify token matches exactly
- Ensure HTTPS is used in production

## 📚 Next Steps

After successful setup:
1. Implement actual token exchange in `server/config/meta.js`
2. Add real-time message handling via webhooks
3. Implement Instagram Direct Message sending
4. Add analytics and reporting features

## 🔗 Useful Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Meta App Review Guidelines](https://developers.facebook.com/docs/app-review/)
- [Webhook Setup Guide](https://developers.facebook.com/docs/graph-api/webhooks/)
- [OAuth Flow Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/)
