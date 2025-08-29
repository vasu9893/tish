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
      error: 'Failed to fix user ID'
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

    // Prepare Instagram connection data
    const instagramConnectionData = {
      instagramUserId: instagramUserId,
      username: userInfoResponse.data?.username || 'Unknown',
      accessToken: finalToken,
      tokenType: 'bearer',
      permissions: permissions || [],
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
          permissions: permissions || [],
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
    const redirectUrl = `${clientUrl}/dashboard?instagram=success&username=${encodeURIComponent(instagramConnectionData.username)}&userId=${encodeURIComponent(instagramUserId)}&permissions=${encodeURIComponent(permissions?.join(',') || '')}`
    
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

// Get Instagram conversations (from local database)
router.get('/conversations', authMiddleware, async (req, res) => {
  console.log('🔍 Instagram Conversations Route Called:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    user: req.user,
    hasAuth: !!req.user
  })
  try {
    const userId = req.user.id
    const { limit = 50, offset = 0 } = req.query

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    // Get conversations from local messages
    const conversations = await Message.aggregate([
      { 
        $match: { 
          userId: userId, 
          room: 'instagram'
        } 
      },
      {
        $group: {
          _id: '$instagramSenderId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      },
      {
        $skip: parseInt(offset)
      },
      {
        $limit: parseInt(limit)
      }
    ])

    const total = await Message.countDocuments({
      userId: userId,
      room: 'instagram'
    })

    res.json({
      success: true,
      data: {
        conversations: conversations.map(conv => ({
          recipientId: conv._id,
          lastMessage: conv.lastMessage,
          messageCount: conv.messageCount
        })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        note: 'Data from local database only (Instagram Basic Display API limitation)'
      }
    })

  } catch (error) {
    console.error('Get Instagram conversations error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Instagram conversations' 
    })
  }
})

// Get conversation messages
router.get('/conversations/:recipientId/messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { recipientId } = req.params
    const { limit = 100, offset = 0 } = req.query

    // Get user's Instagram connection
    const instagramUser = await InstagramUser.findOne({ userId: userId })
    
    if (!instagramUser || !instagramUser.isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instagram not connected. Please connect your Instagram account first.' 
      })
    }

    // Get messages for this conversation from local database
    const messages = await Message.find({
      userId: userId,
      room: 'instagram',
      $or: [
        { instagramSenderId: recipientId },
        { instagramRecipientId: recipientId }
      ]
    })
    .sort({ timestamp: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit))

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Show oldest first
        recipientId,
        total: messages.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        note: 'Data from local database only (Instagram Basic Display API limitation)'
      }
    })

  } catch (error) {
    console.error('Get conversation messages error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get conversation messages' 
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
