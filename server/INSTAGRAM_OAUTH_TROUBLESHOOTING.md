# Instagram OAuth Troubleshooting Guide

## Common Error: "Failed to exchange code for token"

This error occurs when the OAuth code exchange process fails. Here's how to fix it:

## 1. Check Environment Variables

Ensure these environment variables are set correctly in your `.env` file:

```bash
# Meta App Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_webhook_verify_token

# Backend URL (for OAuth redirect)
BACKEND_URL=https://tish-production.up.railway.app

# Client URL
CLIENT_URL=https://your-frontend-domain.com
```

## 2. Verify Meta App Settings

### App Domains
- Add your backend domain to "App Domains"
- Example: `tish-production.up.railway.app`

### Valid OAuth Redirect URIs
- Add this exact URL: `https://tish-production.up.railway.app/api/instagram/auth/instagram/callback`
- **Important**: The redirect URI must match EXACTLY what's sent in the OAuth request

### App Review Status
- Ensure your app is either in development mode or has passed review
- Check that required permissions are granted

## 3. Test OAuth Flow Step by Step

### Step 1: Initiate OAuth
```bash
GET /api/instagram/auth/instagram
```

**Expected Response:**
```json
{
  "success": true,
  "authUrl": "https://www.facebook.com/v19.0/dialog/oauth?...",
  "message": "Redirect user to this URL to authorize Instagram access"
}
```

### Step 2: User Authorization
- User visits the `authUrl`
- User grants permissions
- Meta redirects to your callback URL with a `code` parameter

### Step 3: Code Exchange
```bash
GET /api/instagram/auth/instagram/callback?code=AUTHORIZATION_CODE&state=TIMESTAMP
```

## 4. Debug Common Issues

### Issue: Redirect URI Mismatch
**Error**: `redirect_uri parameter does not match any registered OAuth redirect URIs`

**Solution**: 
1. Check Meta Developer Console → App Settings → Basic
2. Verify the redirect URI matches exactly
3. Ensure no trailing slashes or typos

### Issue: Invalid App ID or Secret
**Error**: `Invalid client_id or client_secret`

**Solution**:
1. Verify `META_APP_ID` and `META_APP_SECRET` in your `.env`
2. Check that the app ID matches your Meta app
3. Ensure the app secret is correct (not the app ID)

### Issue: Code Already Used
**Error**: `This authorization code has been used`

**Solution**:
1. OAuth codes can only be used once
2. Generate a new authorization code by restarting the OAuth flow
3. Clear any stored codes in your application

### Issue: Expired Code
**Error**: `This authorization code has expired`

**Solution**:
1. OAuth codes expire quickly (usually within 10 minutes)
2. Ensure the user completes the flow promptly
3. Implement proper error handling for expired codes

## 5. Testing Checklist

### Before Testing
- [ ] Environment variables are set correctly
- [ ] Meta app is configured properly
- [ ] Redirect URI is added to Meta app
- [ ] App has required permissions

### During Testing
- [ ] Check server logs for detailed error messages
- [ ] Verify the authorization code is received
- [ ] Confirm the redirect URI matches exactly
- [ ] Test with a fresh OAuth flow

### After Testing
- [ ] Check that the access token is received
- [ ] Verify the token can be used for API calls
- [ ] Confirm the Instagram user is saved to database

## 6. Server Logs

Enable detailed logging to debug issues:

```javascript
// Check these log messages:
console.log('Instagram OAuth initiated:', { appId, redirectUri, scope, authUrl })
console.log('Token exchange failed:', tokenResponse)
console.error('Error exchanging code for token:', { error, response, status, params })
```

## 7. Common Fixes

### Fix 1: Update Redirect URI
```javascript
// In metaApi.js
const redirectUri = process.env.BACKEND_URL || 'https://tish-production.up.railway.app'
```

### Fix 2: Verify App Configuration
```javascript
// Check that these match your Meta app:
META_APP_ID=your_actual_app_id
META_APP_SECRET=your_actual_app_secret
```

### Fix 3: Test with Development Mode
- Keep your app in development mode for testing
- Add test users to your Meta app
- Use your personal account for initial testing

## 8. Production Considerations

### Security
- Never expose app secrets in client-side code
- Use environment variables for all sensitive data
- Implement proper session management

### Error Handling
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry mechanisms for transient failures

### Monitoring
- Monitor OAuth success/failure rates
- Track token expiration and renewal
- Set up alerts for authentication failures

## 9. Still Having Issues?

If you're still experiencing problems:

1. **Check Meta Developer Console** for app status
2. **Review server logs** for detailed error messages
3. **Verify environment variables** are loaded correctly
4. **Test with a fresh OAuth flow** (new authorization code)
5. **Contact Meta Developer Support** if the issue persists

## 10. Quick Test Commands

```bash
# Test environment variables
echo $META_APP_ID
echo $META_APP_SECRET
echo $BACKEND_URL

# Test OAuth initiation
curl "https://tish-production.up.railway.app/api/instagram/auth/instagram"

# Check server logs
# Look for OAuth-related log messages
```
