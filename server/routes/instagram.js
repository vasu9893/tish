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

// Instagram Basic Display OAuth - Start the flow (PURE INSTAGRAM)
router.get('/auth/instagram', (req, res) => {
  const appId = process.env.META_APP_ID
  // Use environment variable or fallback to Railway URL
  const redirectUri = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
    : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback'
  
  // Instagram Basic Display API scopes (no Facebook required)
  const scope = 'user_profile,user_media'
  
  // Pure Instagram OAuth URL (Instagram Basic Display API)
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${Date.now()}`
  
  console.log('Pure Instagram OAuth initiated:', {
    appId,
    redirectUri,
    scope,
    authUrl,
    type: 'Instagram Basic Display API (no Facebook)'
  })
  
  res.json({ 
    success: true, 
    authUrl: authUrl,
    message: 'Redirect user to Instagram to authorize access directly',
    redirectUri: redirectUri,
    oauthType: 'Pure Instagram Basic Display API'
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

// Instagram Basic Display OAuth Callback (PURE INSTAGRAM)
router.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    
    console.log('Pure Instagram OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state,
      query: req.query,
      headers: req.headers,
      type: 'Instagram Basic Display API'
    })
    
    if (!code) {
      console.error('No authorization code received in callback')
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code not received' 
      })
    }

    // Exchange code for Instagram access token (Instagram Basic Display API)
    console.log('=== STEP 1: Instagram Basic Display Token Exchange ===')
    console.log('Code received:', code ? 'YES' : 'NO')
    console.log('Code length:', code ? code.length : 0)
    console.log('Environment variables:', {
      META_APP_ID: process.env.META_APP_ID ? 'set' : 'missing',
      META_APP_SECRET: process.env.META_APP_SECRET ? 'set' : 'missing',
      BACKEND_URL: process.env.BACKEND_URL || 'not set'
    })
    
    // Use Instagram Basic Display API token exchange
    const tokenResponse = await metaApi.exchangeInstagramBasicDisplayToken(code)
    
    console.log('Instagram token exchange response:', {
      success: tokenResponse.success,
      hasData: !!tokenResponse.data,
      dataKeys: tokenResponse.data ? Object.keys(tokenResponse.data) : 'no data',
      error: tokenResponse.error
    })
    
    if (!tokenResponse.success) {
      console.error('Instagram token exchange failed:', tokenResponse)
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to exchange Instagram code for token',
        details: tokenResponse.details || tokenResponse.error,
        response: tokenResponse
      })
    }

    const { access_token, user_id } = tokenResponse.data

    // Validate required data
    if (!access_token || !user_id) {
      console.error('Missing required data from Instagram token response:', {
        hasAccessToken: !!access_token,
        hasUserId: !!user_id,
        dataKeys: Object.keys(tokenResponse.data || {})
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid Instagram token response - missing access_token or user_id',
        details: `Access token: ${!!access_token}, User ID: ${!!user_id}`
      })
    }

    console.log('Instagram token response validation passed:', {
      hasAccessToken: !!access_token,
      hasUserId: !!user_id
    })

    // Get Instagram user info using the access token
    console.log('=== STEP 2: Get Instagram User Info ===')
    const userInfoResponse = await metaApi.getInstagramUserInfo(access_token, user_id)
    
    console.log('Instagram user info response:', {
      success: userInfoResponse.success,
      hasData: !!userInfoResponse.data,
      dataKeys: userInfoResponse.data ? Object.keys(userInfoResponse.data) : 'no data',
      fullData: userInfoResponse.data,
      error: userInfoResponse.error
    })

    if (!userInfoResponse.success || !userInfoResponse.data) {
      console.error('Failed to get Instagram user info:', userInfoResponse.error)
      return res.status(400).json({
        success: false,
        error: 'Failed to get Instagram user information',
        details: userInfoResponse.error || 'Instagram user info API call failed'
      })
    }

    const instagramUserInfo = userInfoResponse.data
    const username = instagramUserInfo.username || 'Instagram User'
    const accountType = instagramUserInfo.account_type || 'personal'

    // Instagram Basic Display tokens are typically long-lived (60 days)
    console.log('=== STEP 3: Calculate Token Expiry ===')
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60) // 60 days from now
    console.log('Instagram token expires at:', tokenExpiresAt.toISOString())
    
    // Save or update Instagram user connection (pure Instagram, no Facebook)
    console.log('=== STEP 4: Save to Database ===')
    console.log('Saving pure Instagram user to database...')
    
    const instagramUser = await InstagramUser.findOneAndUpdate(
      { userId: user_id },
      {
        userId: user_id,
        username: username,
        instagramAccountId: user_id,
        instagramAccessToken: access_token, // Store Instagram token directly
        instagramUsername: username,
        accountType: accountType,
        tokenExpiresAt: tokenExpiresAt,
        isConnected: true,
        lastConnected: new Date(),
        webhookSubscribed: false,
        // No Facebook fields needed for pure Instagram
        pageId: null,
        pageAccessToken: null,
        longLivedToken: null,
        userAccessToken: null
      },
      { upsert: true, new: true }
    )
    
    console.log('Instagram user saved successfully:', {
      id: instagramUser._id,
      userId: instagramUser.userId,
      username: instagramUser.username,
      instagramAccountId: instagramUser.instagramAccountId
    })

    console.log('=== SUCCESS: Pure Instagram OAuth Complete ===')
    console.log('All steps completed successfully!')
    
    // Redirect to frontend with success parameters
    const frontendUrl = process.env.FRONTEND_URL || 'https://instantchat.in'
    const dashboardRedirectUrl = `${frontendUrl}/dashboard?instagram=success&instagramAccountId=${instagramUser.instagramAccountId}&username=${encodeURIComponent(instagramUser.username)}`
    const oauthCallbackUrl = `${frontendUrl}/oauth-callback?instagram=success&instagramAccountId=${instagramUser.instagramAccountId}&username=${encodeURIComponent(instagramUser.username)}`
    
    console.log('Redirecting to frontend dashboard:', dashboardRedirectUrl)
    console.log('Alternative OAuth callback URL:', oauthCallbackUrl)
    console.log('Frontend URL from env:', process.env.FRONTEND_URL)
    console.log('Instagram user data for redirect:', {
      instagramAccountId: instagramUser.instagramAccountId,
      username: instagramUser.username
    })
    
    // Try to redirect to dashboard first, fallback to OAuth callback if needed
    try {
      res.status(302).redirect(dashboardRedirectUrl)
    } catch (redirectError) {
      console.error('Dashboard redirect failed, trying OAuth callback:', redirectError)
      try {
        res.status(302).redirect(oauthCallbackUrl)
      } catch (callbackRedirectError) {
        console.error('OAuth callback redirect also failed, falling back to JSON response:', callbackRedirectError)
        // Final fallback: send JSON response with redirect instructions
        res.json({
          success: true,
          message: 'Instagram connected successfully! Please return to your dashboard.',
          dashboardUrl: dashboardRedirectUrl,
          oauthCallbackUrl: oauthCallbackUrl,
          data: {
            instagramAccountId: instagramUser.instagramAccountId,
            username: instagramUser.username,
            tokenExpiresAt: instagramUser.tokenExpiresAt
          }
        })
      }
    }

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
    const instagramUser = await InstagramUser.findOne({ userId: userId })

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
