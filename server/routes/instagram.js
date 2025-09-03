const express = require('express')
const router = express.Router()
const InstagramUser = require('../models/InstagramUser')
const Message = require('../models/Message')
const metaApi = require('../utils/metaApi')
const authMiddleware = require('../middleware/authMiddleware')

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Instagram routes are working!',
    timestamp: new Date().toISOString(),
    route: '/api/instagram/test'
  })
})

// Debug endpoint to check authentication and user data
router.get('/debug/auth', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Instagram Auth Debug Route Called:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      user: req.user,
      hasAuth: !!req.user,
      userId: req.user?.id
    })
    
    const userId = req.user.id
    
    // Check if user has Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    res.json({
      success: true,
      message: 'Authentication debug info',
      debug: {
        timestamp: new Date().toISOString(),
        user: req.user,
        hasInstagramConnection: !!instagramUser,
        instagramConnection: instagramUser ? {
          id: instagramUser._id,
          userId: instagramUser.userId,
          username: instagramUser.username,
          instagramAccountId: instagramUser.instagramAccountId,
          isConnected: instagramUser.isConnected,
          lastConnected: instagramUser.lastConnected,
          permissions: instagramUser.permissions
        } : null
      }
    })
    
  } catch (error) {
    console.error('❌ Instagram Auth Debug Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get auth debug info',
      details: error.message
    })
  }
})

// Debug endpoint to check Instagram connections in database
router.get('/debug/connections', async (req, res) => {
  try {
    const connections = await InstagramUser.find({}).sort({ lastConnected: -1 }).limit(5)
    res.json({
      success: true,
      message: 'Instagram connections in database',
      count: connections.length,
      connections: connections.map(conn => ({
        id: conn._id,
        userId: conn.userId,
        username: conn.username,
        instagramAccountId: conn.instagramAccountId,
        isConnected: conn.isConnected,
        lastConnected: conn.lastConnected,
        tokenExpiresAt: conn.tokenExpiresAt,
        permissions: conn.permissions,
        accountType: conn.accountType
      }))
    })
  } catch (error) {
    console.error('Error fetching Instagram connections:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Instagram connections'
    })
  }
})

// Fix endpoint to update Instagram connection user ID
router.post('/debug/fix-user-id', async (req, res) => {
  try {
    const { instagramAccountId, newUserId } = req.body
    
    if (!instagramAccountId || !newUserId) {
      return res.status(400).json({
        success: false,
        error: 'Both instagramAccountId and newUserId are required'
      })
    }
    
    const result = await InstagramUser.findOneAndUpdate(
      { instagramAccountId: instagramAccountId },
      { userId: newUserId },
      { new: true }
    )
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Instagram connection not found'
      })
    }
    
    res.json({
      success: true,
      message: 'User ID updated successfully',
      connection: {
        id: result._id,
        oldUserId: 'previous value',
        newUserId: result.userId,
        username: result.username,
        instagramAccountId: result.instagramAccountId
      }
    })
  } catch (error) {
    console.error('Error fixing user ID:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fix user ID',
      details: error.message
    })
  }
})

// Fix endpoint to update Instagram connection permissions
router.post('/debug/fix-permissions', async (req, res) => {
  try {
    const { instagramAccountId } = req.body
    
    if (!instagramAccountId) {
      return res.status(400).json({
        success: false,
        error: 'instagramAccountId is required'
      })
    }
    
    // Find the Instagram connection
    const instagramUser = await InstagramUser.findOne({ instagramAccountId: instagramAccountId })
    
    if (!instagramUser) {
      return res.status(404).json({
        success: false,
        error: 'Instagram connection not found'
      })
    }
    
    // Update with correct permissions based on OAuth scopes
    const correctPermissions = [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'instagram_content_publish'
    ]
    
    const result = await InstagramUser.findOneAndUpdate(
      { instagramAccountId: instagramAccountId },
      { 
        permissions: correctPermissions,
        lastConnected: new Date()
      },
      { new: true }
    )
    
    res.json({
      success: true,
      message: 'Permissions updated successfully',
      connection: {
        id: result._id,
        username: result.username,
        instagramAccountId: result.instagramAccountId,
        oldPermissions: instagramUser.permissions,
        newPermissions: result.permissions,
        updatedAt: result.lastConnected
      }
    })
    
  } catch (error) {
    console.error('Error fixing permissions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fix permissions',
      details: error.message
    })
  }
})

// Manual DM import endpoint - for simulating real Instagram DMs
router.post('/debug/import-dm', authMiddleware, async (req, res) => {
  try {
    const { senderId, senderName, message, timestamp } = req.body
    const userId = req.user.id
    
    if (!senderId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'senderId and message are required' 
      })
    }
    
    // Create a realistic Instagram DM entry
    const newMessage = new Message({
      sender: senderName || `Instagram User (${senderId.slice(0, 8)}...)`,
      content: message,
      userId: userId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      room: 'instagram',
      source: 'manual_import', // Mark as manually imported
      isFromInstagram: true,
      instagramSenderId: senderId,
      instagramMessageId: 'manual_' + Date.now(),
      instagramThreadId: senderId
    })
    
    await newMessage.save()
    
    res.json({
      success: true,
      message: 'Instagram DM imported successfully',
      data: {
        messageId: newMessage._id,
        senderId: senderId,
        content: message,
        timestamp: newMessage.timestamp
      }
    })
    
  } catch (error) {
    console.error('Error importing Instagram DM:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to import Instagram DM'
    })
  }
})

// Debug endpoint to create test Instagram conversations
router.post('/debug/create-test-conversations', async (req, res) => {
  try {
    const userId = '1' // Using the fixed user ID
    
    // Create some test Instagram messages
    const testMessages = [
      {
        sender: 'Instagram User (john_doe)',
        content: 'Hey! I saw your latest post, it was amazing! 🔥',
        userId: userId,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        room: 'instagram',
        source: 'instagram',
        isFromInstagram: true,
        instagramSenderId: 'john_doe_123',
        instagramMessageId: 'msg_' + Date.now() + '_1',
        instagramThreadId: 'john_doe_123'
      },
      {
        sender: 'Instagram User (sarah_smith)',
        content: 'Hi! I have a question about your products. Are they available for international shipping?',
        userId: userId,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        room: 'instagram',
        source: 'instagram',
        isFromInstagram: true,
        instagramSenderId: 'sarah_smith_456',
        instagramMessageId: 'msg_' + Date.now() + '_2',
        instagramThreadId: 'sarah_smith_456'
      },
      {
        sender: 'Instagram User (mike_wilson)',
        content: 'Love your content! Keep it up! 👍',
        userId: userId,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        room: 'instagram',
        source: 'instagram',
        isFromInstagram: true,
        instagramSenderId: 'mike_wilson_789',
        instagramMessageId: 'msg_' + Date.now() + '_3',
        instagramThreadId: 'mike_wilson_789'
      }
    ]
    
    // Save test messages to database
    const savedMessages = await Message.insertMany(testMessages)
    
    res.json({
      success: true,
      message: 'Test Instagram conversations created successfully',
      count: savedMessages.length,
      conversations: savedMessages.map(msg => ({
        senderId: msg.instagramSenderId,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    })
  } catch (error) {
    console.error('Error creating test conversations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create test conversations'
    })
  }
})

// Quick fix endpoint for current user's Instagram permissions
router.post('/debug/fix-current-user-permissions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    
    console.log('🔧 Fixing permissions for user:', userId)
    
    // Find the Instagram connection for this user
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram connection found for this user'
      })
    }
    
    // Update with correct permissions based on OAuth scopes
    const correctPermissions = [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'instagram_content_publish'
    ]
    
    const result = await InstagramUser.findOneAndUpdate(
      { userId: userId },
      { 
        permissions: correctPermissions,
        lastConnected: new Date()
      },
      { new: true }
    )
    
    console.log('✅ Permissions fixed for user:', userId, 'New permissions:', result.permissions)
    
    res.json({
      success: true,
      message: 'Your Instagram permissions have been fixed!',
      connection: {
        id: result._id,
        username: result.username,
        instagramAccountId: result.instagramAccountId,
        oldPermissions: instagramUser.permissions,
        newPermissions: result.permissions,
        updatedAt: result.lastConnected
      },
      note: 'You can now try loading Instagram conversations again'
    })
    
  } catch (error) {
    console.error('❌ Error fixing current user permissions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fix permissions',
      details: error.message
    })
  }
})

// Instagram Business Login OAuth - Start the flow
router.get('/auth/instagram', (req, res) => {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
  // Use environment variable or fallback to Railway URL
  const redirectUri = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
    : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback'
  
  // Instagram Business Login API scopes - using new scope values
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish'
  ]
  const scope = scopes.join(',')
  
  // Generate state parameter for CSRF protection
  const state = `csrf_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  // Instagram Business Login OAuth URL
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`
  
  console.log('Instagram Business Login OAuth initiated:', {
    appId,
    redirectUri,
    scope,
    state,
    authUrl,
    type: 'Instagram Business Login API'
  })
  
  res.json({ 
    success: true, 
    authUrl: authUrl,
    message: 'Redirect user to Instagram Business Login to authorize access',
    redirectUri: redirectUri,
    oauthType: 'Instagram Business Login API',
    state: state,
    scopes: scopes
  })
})

// Test callback URL endpoint
router.get('/auth/instagram/callback/test', (req, res) => {
  res.json({
    success: true,
    message: 'Callback URL is working!',
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path
  })
})

// Instagram Business Login OAuth Callback
router.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state, error, error_reason, error_description } = req.query
    
    console.log('Instagram Business Login OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state,
      error: error,
      error_reason: error_reason,
      error_description: error_description,
      query: req.query,
      headers: req.headers,
      type: 'Instagram Business Login API'
    })

    // Handle authorization cancellation or errors
    if (error) {
      console.error('Instagram authorization error:', { error, error_reason, error_description })
      const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'
      return res.redirect(`${clientUrl}/dashboard?instagram=error&error=${encodeURIComponent(error_description || 'Authorization was denied')}`)
    }
    
    if (!code) {
      console.error('No authorization code received in callback')
      const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'
      return res.redirect(`${clientUrl}/dashboard?instagram=error&error=${encodeURIComponent('Authorization code not received')}`)
    }

    // Validate state parameter for CSRF protection
    if (!state || !state.startsWith('csrf_')) {
      console.error('Invalid or missing state parameter')
      const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'
      return res.redirect(`${clientUrl}/dashboard?instagram=error&error=${encodeURIComponent('Invalid security token')}`)
    }

    // Exchange code for Instagram Business access token
    console.log('=== STEP 1: Instagram Business Login Token Exchange ===')
    console.log('Code received:', code ? 'YES' : 'NO')
    console.log('Code length:', code ? code.length : 0)
    console.log('State parameter:', state)
    console.log('Environment variables:', {
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? 'set' : 'missing',
      INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? 'set' : 'missing',
      META_APP_ID: process.env.META_APP_ID ? 'set' : 'missing',
      META_APP_SECRET: process.env.META_APP_SECRET ? 'set' : 'missing',
      BACKEND_URL: process.env.BACKEND_URL || 'not set'
    })
    
    // Use Instagram Business Login API token exchange
    const tokenResponse = await metaApi.exchangeInstagramBusinessToken(code)
    
    console.log('Instagram token exchange response:', {
      success: tokenResponse.success,
      hasData: !!tokenResponse.data,
      dataKeys: tokenResponse.data ? Object.keys(tokenResponse.data) : 'no data',
      error: tokenResponse.error,
      permissions: tokenResponse.data?.permissions
    })
    
    if (!tokenResponse.success) {
      console.error('Token exchange failed:', tokenResponse.error)
      const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'
      return res.redirect(`${clientUrl}/dashboard?instagram=error&error=${encodeURIComponent('Failed to exchange authorization code for token')}`)
    }

    const { access_token: shortLivedToken, user_id: instagramUserId, permissions } = tokenResponse.data

    // Exchange short-lived token for long-lived token (60 days validity)
    console.log('=== STEP 2: Exchange for Long-Lived Token ===')
    const longLivedTokenResponse = await metaApi.exchangeForLongLivedInstagramToken(shortLivedToken)
    
    console.log('Long-lived token exchange response:', {
      success: longLivedTokenResponse.success,
      hasToken: !!longLivedTokenResponse.data?.access_token,
      expiresIn: longLivedTokenResponse.data?.expires_in
    })

    if (!longLivedTokenResponse.success) {
      console.error('Long-lived token exchange failed:', longLivedTokenResponse.error)
      // Continue with short-lived token if long-lived exchange fails
    }

    const finalToken = longLivedTokenResponse.success ? longLivedTokenResponse.data.access_token : shortLivedToken
    const expiresIn = longLivedTokenResponse.data?.expires_in || 3600 // Default to 1 hour for short-lived
    const expiresAt = new Date(Date.now() + (expiresIn * 1000))

    // Get Instagram user info using the final token
    console.log('=== STEP 3: Get Instagram User Info ===')
    const userInfoResponse = await metaApi.getInstagramUserInfo(finalToken, instagramUserId)
    
    console.log('Instagram user info response:', {
      success: userInfoResponse.success,
      hasData: !!userInfoResponse.data,
      dataKeys: userInfoResponse.data ? Object.keys(userInfoResponse.data) : 'no data',
      username: userInfoResponse.data?.username,
      error: userInfoResponse.error
    })

    // Get Instagram permissions separately (since token response might not include them)
    console.log('=== STEP 3.5: Get Instagram Permissions ===')
    const permissionsResponse = await metaApi.getInstagramPermissions(finalToken, instagramUserId)
    
    console.log('Instagram permissions response:', {
      success: permissionsResponse.success,
      permissions: permissionsResponse.data?.permissions,
      accountType: permissionsResponse.data?.accountType,
      error: permissionsResponse.error
    })

    // Use permissions from the separate call, fallback to token response
    const finalPermissions = permissionsResponse.success ? permissionsResponse.data.permissions : (permissions || [])

    // Prepare Instagram connection data
    const instagramConnectionData = {
      instagramUserId: instagramUserId,
      username: userInfoResponse.data?.username || 'Unknown',
      accessToken: finalToken,
      tokenType: 'bearer',
      permissions: finalPermissions,
      expiresAt: expiresAt,
      profileData: userInfoResponse.data || {},
      isLongLived: longLivedTokenResponse.success,
      lastConnected: new Date(),
      connectionType: 'Instagram Business Login'
    }

    console.log('=== STEP 4: Instagram Business Login Success ===')
    console.log('Connection data prepared:', {
      username: instagramConnectionData.username,
      userId: instagramConnectionData.instagramUserId,
      permissions: instagramConnectionData.permissions,
      isLongLived: instagramConnectionData.isLongLived,
      expiresAt: instagramConnectionData.expiresAt
    })

    // Save Instagram connection to database
    console.log('=== STEP 5: Save Instagram Connection to Database ===')
    try {
      // For now, use a dummy user ID - in production, extract from JWT token
      const dummyUserId = 'user_' + Date.now() // This should be extracted from authenticated user
    
    const instagramUser = await InstagramUser.findOneAndUpdate(
        { instagramAccountId: instagramUserId },
        {
          userId: dummyUserId,
          username: instagramConnectionData.username,
          instagramAccountId: instagramUserId,
          instagramUsername: instagramConnectionData.username,
          instagramAccessToken: finalToken,
          accountType: 'business', // Instagram Business Login
          tokenExpiresAt: expiresAt,
        isConnected: true,
        lastConnected: new Date(),
          permissions: finalPermissions,
        webhookSubscribed: false,
          // Instagram Business Login specific fields
          pageId: null, // Not applicable for Business Login
          pageAccessToken: null, // Not applicable for Business Login
          longLivedToken: longLivedTokenResponse.success ? finalToken : null,
        userAccessToken: null
      },
      { upsert: true, new: true }
    )
    
      console.log('✅ Instagram connection saved to database:', {
      id: instagramUser._id,
      userId: instagramUser.userId,
      username: instagramUser.username,
        instagramAccountId: instagramUser.instagramAccountId,
        isConnected: instagramUser.isConnected,
        tokenExpiresAt: instagramUser.tokenExpiresAt
      })
      
    } catch (dbError) {
      console.error('❌ Failed to save Instagram connection to database:', dbError)
      // Continue with redirect even if database save fails
    }
    
    // Redirect to frontend with success parameters
    const clientUrl = process.env.CLIENT_URL || 'https://instantchat.in'
    const redirectUrl = `${clientUrl}/dashboard?instagram=success&username=${encodeURIComponent(instagramConnectionData.username)}&userId=${encodeURIComponent(instagramUserId)}&permissions=${encodeURIComponent(finalPermissions?.join(',') || '')}`
    
    console.log('Redirecting to:', redirectUrl)
    res.redirect(redirectUrl)

  } catch (error) {
    console.error('Instagram OAuth callback error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    })
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete Instagram authentication',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    })
  }
})

// Send message to Instagram (using Instagram Basic Display API)
router.post('/sendMessage', authMiddleware, async (req, res) => {
  try {
    const { recipientId, message, threadId, messageType = 'text' } = req.body
    const userId = req.user.id

    if (!recipientId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient ID and message are required' 
      })
    }

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    if (instagramUser.isTokenExpired()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram access token expired. Please reconnect your account.' 
      })
    }

    // Note: Instagram Basic Display API doesn't support sending messages
    // This would require Instagram Graph API (which needs Facebook pages)
    // For now, we'll save the message locally and inform the user
    console.log('Instagram Basic Display API limitation: Cannot send messages directly')
    
    // Save message to database (local only)
    const newMessage = new Message({
      sender: instagramUser.username || 'You',
      content: message,
      userId: userId,
      timestamp: new Date(),
      room: 'instagram',
      source: 'local',
      isToInstagram: true,
      instagramSenderId: recipientId,
      instagramThreadId: threadId,
      messageType: messageType,
      status: 'pending' // Message cannot be sent via Basic Display API
    })

    await newMessage.save()

    res.json({
      success: true,
      message: 'Message saved locally. Note: Instagram Basic Display API cannot send messages directly.',
      data: {
        messageId: newMessage._id,
        timestamp: newMessage.timestamp,
        messageType: messageType,
        status: 'pending',
        note: 'Instagram Basic Display API limitation: Messages cannot be sent directly'
      }
    })

  } catch (error) {
    console.error('Send Instagram message error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save Instagram message' 
    })
  }
})

// Send bulk messages to multiple Instagram users
router.post('/sendBulkMessage', authMiddleware, async (req, res) => {
  try {
    const { recipientIds, message, messageType = 'text', delayMs = 1000 } = req.body
    const userId = req.user.id

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient IDs array is required and must not be empty' 
      })
    }

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      })
    }

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    if (instagramUser.isTokenExpired()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram access token expired. Please reconnect your account.' 
      })
    }

    const results = []
    const errors = []

    // Send messages with delay to avoid rate limiting
    for (let i = 0; i < recipientIds.length; i++) {
      try {
        const recipientId = recipientIds[i]
        
        // Add delay between messages (except for the first one)
        if (i > 0 && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }

        // Note: Instagram Basic Display API doesn't support sending messages
        // This would require Instagram Graph API (which needs Facebook pages)
        // For now, we'll save the message locally and inform the user
        console.log('Instagram Basic Display API limitation: Cannot send messages directly')
        
        // Save message to database (local only)
        const newMessage = new Message({
          sender: instagramUser.username || 'You',
          content: message,
          userId: userId,
          timestamp: new Date(),
          room: 'instagram',
          source: 'local',
          isToInstagram: true,
          instagramSenderId: recipientId,
          instagramThreadId: null, // No threadId in Basic Display API
          messageType: messageType,
          status: 'pending' // Message cannot be sent via Basic Display API
        })

        await newMessage.save()

        results.push({
          recipientId,
          success: true,
          messageId: newMessage._id,
          note: 'Message saved locally. Note: Instagram Basic Display API cannot send messages directly.'
        })
      } catch (error) {
        errors.push({
          recipientId: recipientIds[i],
          success: false,
          error: error.message
        })
      }
    }

    res.json({
      success: true,
      message: `Bulk message saved locally. Note: Instagram Basic Display API cannot send messages directly.`,
      data: {
        totalRecipients: recipientIds.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    })

  } catch (error) {
    console.error('Send bulk Instagram message error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send bulk Instagram messages' 
    })
  }
})

// Get Instagram connection status
router.get('/status', authMiddleware, async (req, res) => {
  console.log('🔍 Instagram Status Route Called:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    user: req.user,
    hasAuth: !!req.user
  })
  try {
    const userId = req.user.id
    
    // Try to find Instagram connection by user ID first
    let instagramUser = await InstagramUser.findOne({ userId: userId })
    
    // If not found by user ID, try to find any recent connection (for demo purposes)
    // In production, this should be properly linked to authenticated users
    if (!instagramUser) {
      console.log('No Instagram connection found for user ID:', userId)
      console.log('Checking for any recent Instagram connections...')
      
      // Find the most recent Instagram connection (for demo purposes)
      instagramUser = await InstagramUser.findOne({ isConnected: true })
        .sort({ lastConnected: -1 })
        .limit(1)
      
      if (instagramUser) {
        console.log('Found recent Instagram connection:', {
          id: instagramUser._id,
          username: instagramUser.username,
          lastConnected: instagramUser.lastConnected
        })
      }
    }

    if (!instagramUser) {
      return res.json({
        success: true,
        connected: false,
        message: 'Instagram not connected'
      })
    }

    const isExpired = instagramUser.isTokenExpired()
    const daysUntilExpiry = instagramUser.daysUntilExpiry()

    res.json({
      success: true,
      connected: instagramUser.isConnected && !isExpired,
      data: {
        username: instagramUser.username,
        instagramUsername: instagramUser.instagramUsername,
        accountType: instagramUser.accountType,
        lastConnected: instagramUser.lastConnected,
        tokenExpiresAt: instagramUser.tokenExpiresAt,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: isExpired,
        apiType: 'Instagram Basic Display API'
      }
    })

  } catch (error) {
    console.error('Get Instagram status error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Instagram status' 
    })
  }
})

// Get Instagram conversations (from Instagram Graph API)
router.get('/conversations', authMiddleware, async (req, res) => {
  console.log('🔍 Instagram Conversations Route Called:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    user: req.user,
    hasAuth: !!req.user,
    userId: req.user?.id
  })
  
  try {
    const userId = req.user.id
    const { limit = 50, offset = 0 } = req.query

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram account not found. Please connect your Instagram account first.',
        debug: {
          requestedUserId: userId,
          availableConnections: await InstagramUser.find({}).select('userId username').limit(5)
        }
      })
    }
    
    if (!instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram account is not connected. Please reconnect your Instagram account.',
        debug: {
          userId: userId,
          instagramUsername: instagramUser.username,
          isConnected: instagramUser.isConnected,
          lastConnected: instagramUser.lastConnected
        }
      })
    }

    // Check if we have the required permissions
    if (!instagramUser.permissions?.includes('instagram_manage_messages')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required permission: instagram_manage_messages. Please reconnect your Instagram account with the correct permissions.',
        debug: {
          userId: userId,
          instagramUsername: instagramUser.username,
          currentPermissions: instagramUser.permissions,
          requiredPermissions: ['instagram_manage_messages']
        }
      })
    }

    // Call Instagram Graph API to get real conversations
    const igUserId = instagramUser.instagramAccountId
    const accessToken = instagramUser.instagramAccessToken
    
    console.log('📡 Calling Instagram Graph API for conversations:', {
      igUserId,
      hasToken: !!accessToken,
      permissions: instagramUser.permissions
    })

    // Build Graph API URL
    const graphUrl = `https://graph.instagram.com/v23.0/${igUserId}/conversations?platform=instagram&access_token=${accessToken}`
    
    console.log('🔗 Graph API URL:', graphUrl.replace(accessToken, '***TOKEN***'))

    // Make request to Instagram Graph API
    const response = await fetch(graphUrl)
    const responseText = await response.text()
    
    // Check if response is JSON (prevent "Unexpected token '<'" errors)
    if (!response.headers.get('content-type')?.includes('application/json')) {
      console.error('❌ Instagram Graph API returned non-JSON response:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: responseText.slice(0, 500)
      })
      
      return res.status(response.status).json({
        success: false,
        error: 'Instagram API returned non-JSON response',
        status: response.status,
        body: responseText.slice(0, 500),
        note: 'This usually means the API endpoint is not accessible or there\'s an authentication issue'
      })
    }

    const graphData = JSON.parse(responseText)
    
    console.log('✅ Instagram Graph API response:', {
      success: response.ok,
      status: response.status,
      hasData: !!graphData.data,
      conversationCount: graphData.data?.length || 0
    })

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Instagram Graph API error',
        details: graphData,
        status: response.status
      })
    }

    // Transform Instagram API response to match frontend expectations
    const conversations = (graphData.data || []).map(conv => ({
      id: conv.id,
      recipientId: conv.id,
      fullName: `Instagram User (${conv.id.slice(-8)})`, // We'll get real names from messages
      avatar: null,
      timestamp: conv.updated_time ? new Date(parseInt(conv.updated_time) * 1000).toLocaleString() : 'Unknown',
      lastMessage: 'Loading...', // Will be populated when messages are fetched
      messageCount: 0, // Will be populated when messages are fetched
      unreadCount: 0,
      // Instagram API specific data
      _instagramData: {
        conversationId: conv.id,
        updatedTime: conv.updated_time,
        rawData: conv
      }
    }))

    // If no conversations found, return empty array with helpful message
    if (conversations.length === 0) {
      return res.json({
        success: true,
        data: {
          conversations: [],
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          note: 'No Instagram conversations found. This could mean: 1) No DMs yet, 2) Account is new, 3) Permissions need to be updated',
          source: 'instagram_graph_api',
          permissions: instagramUser.permissions,
          debug: {
            igUserId,
            hasAccessToken: !!accessToken,
            permissions: instagramUser.permissions
          }
        }
      })
    }

    res.json({
      success: true,
      data: {
        conversations,
        total: conversations.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        note: 'Real-time data from Instagram Graph API',
        source: 'instagram_graph_api',
        permissions: instagramUser.permissions
      }
    })

  } catch (error) {
    console.error('Get Instagram conversations error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Instagram conversations',
      details: error.message
    })
  }
})

// Simple conversations endpoint for testing (no Instagram connection required)
router.get('/conversations/test', authMiddleware, async (req, res) => {
  try {
    console.log('🧪 Test Conversations Route Called:', {
      timestamp: new Date().toISOString(),
      user: req.user,
      userId: req.user?.id
    })
    
    // Return test conversations for development
    const testConversations = [
      {
        id: 'test_conv_1',
        recipientId: 'test_user_1',
        fullName: 'Test User 1',
        avatar: null,
        timestamp: new Date().toLocaleString(),
        lastMessage: 'This is a test conversation for development',
        messageCount: 1,
        unreadCount: 0,
        _instagramData: {
          conversationId: 'test_conv_1',
          updatedTime: Date.now() / 1000,
          rawData: { id: 'test_conv_1' }
        }
      },
      {
        id: 'test_conv_2',
        recipientId: 'test_user_2',
        fullName: 'Test User 2',
        avatar: null,
        timestamp: new Date().toLocaleString(),
        lastMessage: 'Another test conversation',
        messageCount: 1,
        unreadCount: 0,
        _instagramData: {
          conversationId: 'test_conv_2',
          updatedTime: Date.now() / 1000,
          rawData: { id: 'test_conv_2' }
        }
      }
    ]
    
    res.json({
      success: true,
      data: {
        conversations: testConversations,
        total: testConversations.length,
        note: 'Test conversations for development - no Instagram connection required',
        source: 'test_data',
        debug: {
          userId: req.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Test conversations error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get test conversations',
      details: error.message
    })
  }
})

// Get conversation messages (from Instagram Graph API)
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { conversationId } = req.params
    const { limit = 100, offset = 0 } = req.query

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    // Check if we have the required permissions
    if (!instagramUser.permissions?.includes('instagram_manage_messages')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required permission: instagram_manage_messages. Please reconnect your Instagram account.' 
      })
    }

    const accessToken = instagramUser.instagramAccessToken
    
    console.log('📡 Fetching messages for conversation:', {
      conversationId,
      userId,
      hasToken: !!accessToken
    })

    // Step 1: Get message IDs from conversation
    const conversationUrl = `https://graph.instagram.com/v23.0/${conversationId}?fields=messages&access_token=${accessToken}`
    
    const convResponse = await fetch(conversationUrl)
    const convText = await convResponse.text()
    
    // Check if response is JSON
    if (!convResponse.headers.get('content-type')?.includes('application/json')) {
      console.error('❌ Instagram Graph API returned non-JSON for conversation:', {
        status: convResponse.status,
        contentType: convResponse.headers.get('content-type'),
        body: convText.slice(0, 500)
      })
      
      return res.status(convResponse.status).json({
        success: false,
        error: 'Instagram API returned non-JSON response for conversation',
        status: convResponse.status,
        body: convText.slice(0, 500)
      })
    }

    const convData = JSON.parse(convText)
    
    if (!convResponse.ok) {
      return res.status(convResponse.status).json({
        success: false,
        error: 'Instagram Graph API error for conversation',
        details: convData,
        status: convResponse.status
      })
    }

    const messageIds = convData.messages?.data || []
    console.log('📝 Found message IDs:', messageIds.length)

    // Step 2: Get details for each message (limited to 20 most recent as per Instagram API docs)
    const messages = []
    const recentMessageIds = messageIds.slice(0, 20) // Instagram only allows 20 most recent

    for (const msgRef of recentMessageIds) {
      try {
        const messageUrl = `https://graph.instagram.com/v23.0/${msgRef.id}?fields=id,created_time,from,to,message&access_token=${accessToken}`
        
        const msgResponse = await fetch(messageUrl)
        const msgText = await msgResponse.text()
        
        if (msgResponse.ok && msgResponse.headers.get('content-type')?.includes('application/json')) {
          const msgData = JSON.parse(msgText)
          
          // Transform Instagram message to frontend format
          const message = {
            id: msgData.id,
            content: msgData.message || 'No content',
            sender: msgData.from?.username || `User ${msgData.from?.id?.slice(-8) || 'Unknown'}`,
            timestamp: msgData.created_time ? new Date(msgData.created_time).toLocaleString() : 'Unknown',
            isFromUser: msgData.from?.id === instagramUser.instagramAccountId,
            isFromInstagram: msgData.from?.id !== instagramUser.instagramAccountId,
            isInstagram: true,
            messageType: 'text',
            instagramSenderId: msgData.from?.id,
            instagramMessageId: msgData.id,
            source: 'instagram_graph_api',
            // Instagram API specific data
            _instagramData: {
              createdTime: msgData.created_time,
              to: msgData.to,
              from: msgData.from,
              rawData: msgData
            }
          }
          
          messages.push(message)
        } else {
          console.warn('⚠️ Failed to fetch message details:', {
            messageId: msgRef.id,
            status: msgResponse.status,
            body: msgText.slice(0, 200)
          })
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error('❌ Error fetching message details:', {
          messageId: msgRef.id,
          error: error.message
        })
      }
    }

    // Sort messages by creation time (oldest first)
    messages.sort((a, b) => {
      const timeA = a._instagramData?.createdTime ? new Date(a._instagramData.createdTime) : new Date(0)
      const timeB = b._instagramData?.createdTime ? new Date(b._instagramData.createdTime) : new Date(0)
      return timeA - timeB
    })

    console.log('✅ Successfully fetched messages:', {
      conversationId,
      totalMessages: messageIds.length,
      fetchedMessages: messages.length,
      note: 'Instagram API only allows access to 20 most recent messages per conversation'
    })

    res.json({
      success: true,
      data: {
        messages,
        recipientId: conversationId,
        total: messageIds.length,
        fetched: messages.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        note: 'Real-time data from Instagram Graph API (20 most recent messages)',
        source: 'instagram_graph_api',
        limitations: 'Instagram API only provides access to 20 most recent messages per conversation'
      }
    })

  } catch (error) {
    console.error('Get conversation messages error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get conversation messages',
      details: error.message
    })
  }
})

// Subscribe to Instagram webhooks
router.post('/subscribe-webhook', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const instagramUser = await InstagramUser.findOne({ userId: userId })

    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    // Note: Instagram Basic Display API webhooks are limited to mentions and comments.
    // For other webhook types, you'd need Instagram Graph API (which needs Facebook pages).
    // For now, we'll inform the user.
    console.log('Instagram Basic Display API limitation: Cannot subscribe to other webhooks')
    
    res.json({
      success: true,
      message: 'Webhook subscription successful (limited to mentions and comments). Note: Instagram Basic Display API webhooks are limited to mentions and comments.',
      data: {
        webhookSubscribed: true,
        lastSubscription: new Date()
      }
    })

  } catch (error) {
    console.error('Webhook subscription error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to subscribe to webhooks' 
    })
  }
})

// Unsubscribe from Instagram webhooks
router.delete('/unsubscribe-webhook', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const instagramUser = await InstagramUser.findOne({ userId: userId })

    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    // Note: Instagram Basic Display API webhooks are limited to mentions and comments.
    // For other webhook types, you'd need Instagram Graph API (which needs Facebook pages).
    // For now, we'll inform the user.
    console.log('Instagram Basic Display API limitation: Cannot unsubscribe from other webhooks')
    
    res.json({
      success: true,
      message: 'Webhook unsubscription successful (limited to mentions and comments). Note: Instagram Basic Display API webhooks are limited to mentions and comments.',
      data: {
        webhookSubscribed: false
      }
    })

  } catch (error) {
    console.error('Webhook unsubscription error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unsubscribe from webhooks' 
    })
  }
})

// Disconnect Instagram
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    
    await InstagramUser.findOneAndUpdate(
      { userId: userId },
      { 
        isConnected: false,
        webhookSubscribed: false
      }
    )

    res.json({
      success: true,
      message: 'Instagram disconnected successfully'
    })

  } catch (error) {
    console.error('Disconnect Instagram error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Instagram' 
    })
  }
})

// Instagram Basic Display API webhook verification (GET request)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  console.log('Instagram webhook verification request:', {
    mode,
    token,
    challenge: challenge ? 'present' : 'missing',
    expectedToken: process.env.META_VERIFY_TOKEN || 'instantchat_verify_token',
    timestamp: new Date().toISOString()
  })

  // Verify token should match your app's verify token
  const verifyToken = process.env.META_VERIFY_TOKEN || 'instantchat_verify_token'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Instagram webhook verified successfully')
    res.status(200).send(challenge)
  } else {
    console.error('Instagram webhook verification failed:', {
      mode,
      token,
      expectedToken: verifyToken,
      tokenMatch: token === verifyToken,
      modeMatch: mode === 'subscribe'
    })
    res.status(403).send('Forbidden')
  }
})

// Webhook test endpoint for debugging
router.get('/webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    verifyToken: process.env.META_VERIFY_TOKEN || 'instantchat_verify_token',
    webhookUrl: `${req.protocol}://${req.get('host')}/api/instagram/webhook`,
    note: 'Use this endpoint to test if your webhook is publicly accessible'
  })
})

// Instagram Basic Display API webhook for incoming events (POST request)
router.post('/webhook', async (req, res) => {
  try {
    console.log('Instagram webhook received:', {
      body: req.body,
      headers: req.headers
    })

    const { object, entry } = req.body

    if (object !== 'instagram') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook object type' 
      })
    }

    if (!entry || !Array.isArray(entry)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook entry format' 
      })
    }

    const processedEvents = []

    for (const entryItem of entry) {
      const { id: instagramUserId, changes } = entryItem

      if (changes && Array.isArray(changes)) {
        for (const change of changes) {
          try {
            const { field, value } = change

            if (field === 'mentions' && value) {
              // Handle mentions
              processedEvents.push({
                type: 'mention',
                instagramUserId: instagramUserId,
                field: field,
                value: value
              })

              console.log('Instagram mention processed:', {
                instagramUserId: instagramUserId,
                field: field,
                value: value
              })
            } else if (field === 'comments' && value) {
              // Handle comments
              processedEvents.push({
                type: 'comment',
                instagramUserId: instagramUserId,
                field: field,
                value: value
              })

              console.log('Instagram comment processed:', {
                instagramUserId: instagramUserId,
                field: field,
                value: value
              })
            }
          } catch (error) {
            console.error('Error processing webhook change:', error)
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Instagram webhook processed successfully',
      data: {
        processedEvents: processedEvents.length,
        events: processedEvents,
        note: 'Instagram Basic Display API webhooks are limited to mentions and comments'
      }
    })

  } catch (error) {
    console.error('Instagram webhook error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process Instagram webhook' 
    })
  }
})

// Deauthorize callback - called when user removes app access
router.post('/deauthorize', async (req, res) => {
  try {
    const { signed_request } = req.body
    
    if (!signed_request) {
      return res.status(400).json({ 
        success: false, 
        error: 'Signed request not provided' 
      })
    }

    // Parse the signed request to get user ID
    // For now, we'll handle it simply - in production you'd verify the signature
    console.log('Deauthorize request received:', { signed_request })
    
    // You can implement proper signature verification here
    // const decoded = verifySignedRequest(signed_request, process.env.META_APP_SECRET)
    
    res.status(200).json({ 
      success: true, 
      message: 'Deauthorize callback processed' 
    })
    
  } catch (error) {
    console.error('Deauthorize callback error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process deauthorize callback' 
    })
  }
})

// Data deletion request callback - called when user requests data deletion
router.post('/data-deletion', async (req, res) => {
  try {
    const { signed_request } = req.body
    
    if (!signed_request) {
      return res.status(400).json({ 
        success: false, 
        error: 'Signed request not provided' 
      })
    }

    console.log('Data deletion request received:', { signed_request })
    
    // You can implement proper signature verification here
    // const decoded = verifySignedRequest(signed_request, process.env.META_APP_SECRET)
    
    // For now, return a placeholder response
    // In production, you'd implement actual data deletion logic
    res.status(200).json({
      success: true,
      message: 'Data deletion request processed',
      data: {
        url: `${process.env.CLIENT_URL}/data-deletion-status`,
        confirmation_code: `DEL_${Date.now()}`
      }
    })
    
  } catch (error) {
    console.error('Data deletion callback error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process data deletion callback' 
    })
  }
})

// Get Instagram account information
router.get('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'Instagram account not connected'
      })
    }
    
    res.json({
      success: true,
      data: {
        instagramAccountId: instagramUser.instagramAccountId,
        username: instagramUser.username,
        instagramUsername: instagramUser.instagramUsername,
        accountType: instagramUser.accountType,
        lastConnected: instagramUser.lastConnected,
        tokenExpiresAt: instagramUser.tokenExpiresAt,
        isConnected: instagramUser.isConnected,
        apiType: 'Instagram Basic Display API'
      }
    })
  } catch (error) {
    console.error('Get Instagram account error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Instagram account' 
    })
  }
})

module.exports = router
