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

// Instagram OAuth - Start the flow
router.get('/auth/instagram', (req, res) => {
  const appId = process.env.META_APP_ID
  // Use environment variable or fallback to Railway URL
  const redirectUri = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
    : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback'
  
  const scope = 'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_read_engagement'
  
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${Date.now()}`
  
  console.log('Instagram OAuth initiated:', {
    appId,
    redirectUri,
    scope,
    authUrl
  })
  
  res.json({ 
    success: true, 
    authUrl: authUrl,
    message: 'Redirect user to this URL to authorize Instagram access',
    redirectUri: redirectUri // Include this for debugging
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

// Instagram OAuth Callback
router.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    
    console.log('Instagram OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state,
      query: req.query,
      headers: req.headers
    })
    
    if (!code) {
      console.error('No authorization code received in callback')
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code not received' 
      })
    }

    // Exchange code for access token
    console.log('=== STEP 1: Token Exchange ===')
    console.log('Code received:', code ? 'YES' : 'NO')
    console.log('Code length:', code ? code.length : 0)
    console.log('Environment variables:', {
      META_APP_ID: process.env.META_APP_ID ? 'set' : 'missing',
      META_APP_SECRET: process.env.META_APP_SECRET ? 'set' : 'missing',
      BACKEND_URL: process.env.BACKEND_URL || 'not set'
    })
    
    const tokenResponse = await metaApi.exchangeCodeForToken(code)
    
    console.log('Token exchange response:', {
      success: tokenResponse.success,
      hasData: !!tokenResponse.data,
      dataKeys: tokenResponse.data ? Object.keys(tokenResponse.data) : 'no data',
      error: tokenResponse.error
    })
    
    if (!tokenResponse.success) {
      console.error('Token exchange failed:', tokenResponse)
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to exchange code for token',
        details: tokenResponse.details || tokenResponse.error,
        response: tokenResponse
      })
    }

    const { access_token, user_id } = tokenResponse.data

    // If user_id is missing, get it from user info API
    let finalUserId = user_id
    if (!user_id && access_token) {
      console.log('User ID missing from token response, fetching from user info API...')
      
      const userInfoResponse = await metaApi.getUserInfo(access_token)
      console.log('User info response:', {
        success: userInfoResponse.success,
        hasData: !!userInfoResponse.data,
        dataKeys: userInfoResponse.data ? Object.keys(userInfoResponse.data) : 'no data',
        fullData: userInfoResponse.data,
        error: userInfoResponse.error
      })
      
      if (userInfoResponse.success && userInfoResponse.data?.id) {
        finalUserId = userInfoResponse.data.id
        console.log('User ID obtained from user info API:', finalUserId)
      } else {
        console.error('Failed to get user ID from user info API:', userInfoResponse.error)
        return res.status(400).json({
          success: false,
          error: 'Failed to get user ID from Meta API',
          details: userInfoResponse.error || 'User info API call failed'
        })
      }
    }

    // Validate required data
    if (!access_token || !finalUserId) {
      console.error('Missing required data after user info fetch:', {
        hasAccessToken: !!access_token,
        hasUserId: !!finalUserId,
        originalUserId: user_id,
        finalUserId: finalUserId,
        dataKeys: Object.keys(tokenResponse.data || {})
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid token response - missing access_token or user_id',
        details: `Access token: ${!!access_token}, User ID: ${!!finalUserId}`
      })
    }

    console.log('Token response validation passed:', {
      hasAccessToken: !!access_token,
      hasUserId: !!finalUserId,
      originalUserId: user_id,
      finalUserId: finalUserId
    })

    // Get long-lived user token
    console.log('=== STEP 2: Get Long-lived User Token ===')
    console.log('Short-lived token length:', access_token ? access_token.length : 0)
    
    const longLivedUserResponse = await metaApi.getLongLivedToken(access_token)
    
    console.log('Long-lived user token response:', {
      success: longLivedUserResponse.success,
      hasData: !!longLivedUserResponse.data,
      dataKeys: longLivedUserResponse.data ? Object.keys(longLivedUserResponse.data) : 'no data',
      fullData: longLivedUserResponse.data,
      error: longLivedUserResponse.error
    })
    
    if (!longLivedUserResponse.success) {
      console.error('Failed to get long-lived user token:', longLivedUserResponse.error)
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get long-lived user token',
        details: longLivedUserResponse.error
      })
    }

    const { access_token: longLivedUserToken, expires_in: userTokenExpiresIn } = longLivedUserResponse.data
    console.log('Long-lived user token obtained, expires in:', userTokenExpiresIn, 'seconds')
    console.log('User token expiry type:', typeof userTokenExpiresIn)
    console.log('User token expiry value:', userTokenExpiresIn)
    console.log('User token response data keys:', Object.keys(longLivedUserResponse.data))

    // Validate user token expiry value - Meta sometimes doesn't return expires_in for long-lived tokens
    if (userTokenExpiresIn && (isNaN(userTokenExpiresIn) || userTokenExpiresIn <= 0)) {
      console.error('Invalid user token expiry value:', {
        value: userTokenExpiresIn,
        type: typeof userTokenExpiresIn,
        isNaN: isNaN(userTokenExpiresIn),
        isPositive: userTokenExpiresIn > 0
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid user token expiry value received from Meta',
        details: `Expected positive number, got: ${userTokenExpiresIn} (${typeof userTokenExpiresIn})`
      })
    }
    
    // If no expiry provided, assume it's already a long-lived token
    if (!userTokenExpiresIn) {
      console.log('No expiry provided for user token - assuming already long-lived')
    }

    // Get user's pages
    console.log('=== STEP 3: Get User Pages ===')
    console.log('Using long-lived user token, length:', longLivedUserToken ? longLivedUserToken.length : 0)
    
    const pagesResponse = await metaApi.getUserPages(longLivedUserToken)
    
    console.log('Pages response:', {
      success: pagesResponse.success,
      hasData: !!pagesResponse.data,
      dataKeys: pagesResponse.data ? Object.keys(pagesResponse.data) : 'no data',
      pagesCount: pagesResponse.data?.data?.length || 0,
      error: pagesResponse.error
    })
    
    if (!pagesResponse.success) {
      console.error('Failed to get user pages:', pagesResponse.error)
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get user pages',
        details: pagesResponse.error
      })
    }

    const pages = pagesResponse.data.data || []
    console.log('User pages found:', pages.length)
    console.log('Pages details:', pages.map(p => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account })))
    
    // Find a page with Instagram business account
    const pageWithInstagram = pages.find(page => page.instagram_business_account)
    
    if (!pageWithInstagram) {
      console.error('No Instagram business account found in pages:', pages.map(p => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account })))
      return res.status(400).json({ 
        success: false, 
        error: 'No Instagram business account found. Please ensure your Facebook page is connected to Instagram.',
        availablePages: pages.map(p => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account }))
      })
    }

    const { id: pageId, name: pageName, access_token: pageAccessToken, instagram_business_account } = pageWithInstagram

    // Get long-lived page token
    console.log('=== STEP 4: Get Long-lived Page Token ===')
    console.log('Page access token length:', pageAccessToken ? pageAccessToken.length : 0)
    console.log('Page ID:', pageId)
    console.log('Page name:', pageName)
    console.log('Instagram business account ID:', instagram_business_account?.id)
    
    const longLivedPageResponse = await metaApi.getLongLivedToken(pageAccessToken)
    
    console.log('Page token exchange response:', {
      success: longLivedPageResponse.success,
      hasData: !!longLivedPageResponse.data,
      dataKeys: longLivedPageResponse.data ? Object.keys(longLivedPageResponse.data) : 'no data',
      fullData: longLivedPageResponse.data,
      error: longLivedPageResponse.error
    })
    
    if (!longLivedPageResponse.success) {
      console.error('Failed to get long-lived page token:', longLivedPageResponse.error)
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get long-lived page token',
        details: longLivedPageResponse.error
      })
    }

    const { access_token: longLivedPageToken, expires_in: pageTokenExpiresIn } = longLivedPageResponse.data
    console.log('Long-lived page token obtained, expires in:', pageTokenExpiresIn, 'seconds')
    console.log('Page token expiry type:', typeof pageTokenExpiresIn)
    console.log('Page token expiry value:', pageTokenExpiresIn)
    console.log('Page token response data keys:', Object.keys(longLivedPageResponse.data))

    // Validate expiry value - Meta sometimes doesn't return expires_in for long-lived tokens
    if (pageTokenExpiresIn && (isNaN(pageTokenExpiresIn) || pageTokenExpiresIn <= 0)) {
      console.error('Invalid page token expiry value:', {
        value: pageTokenExpiresIn,
        type: typeof pageTokenExpiresIn,
        isNaN: isNaN(pageTokenExpiresIn),
        isPositive: pageTokenExpiresIn > 0
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid token expiry value received from Meta',
        details: `Expected positive number, got: ${pageTokenExpiresIn} (${typeof pageTokenExpiresIn})`
      })
    }
    
    // If no expiry provided, assume it's already a long-lived token
    if (!pageTokenExpiresIn) {
      console.log('No expiry provided for page token - assuming already long-lived')
    }

    // Calculate token expiry (use page token expiry)
    console.log('=== STEP 5: Save to Database ===')
    
    let tokenExpiresAt
    if (pageTokenExpiresIn && !isNaN(pageTokenExpiresIn) && pageTokenExpiresIn > 0) {
      // Use Meta's provided expiry
      tokenExpiresAt = new Date()
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + parseInt(pageTokenExpiresIn))
      console.log('Using Meta-provided expiry:', pageTokenExpiresIn, 'seconds')
    } else {
      // No expiry provided or invalid - use 60 days (typical for long-lived tokens)
      tokenExpiresAt = new Date()
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60)
      console.log('No valid expiry provided - using fallback: 60 days from now')
    }
    
    // Validate the calculated date
    if (isNaN(tokenExpiresAt.getTime())) {
      console.error('Failed to calculate valid expiry date:', {
        originalExpiry: pageTokenExpiresIn,
        calculatedDate: tokenExpiresAt,
        isInvalid: isNaN(tokenExpiresAt.getTime())
      })
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate token expiry date',
        details: 'Date calculation resulted in invalid date'
      })
    }
    
    console.log('Token expires at:', tokenExpiresAt.toISOString())
    console.log('Token expiry validation passed')

    // Save or update Instagram user connection
    console.log('Saving Instagram user to database...')
    const instagramUser = await InstagramUser.findOneAndUpdate(
      { userId: finalUserId },
      {
        userId: finalUserId,
        username: pageName || 'Instagram User',
        instagramAccountId: instagram_business_account?.id || finalUserId,
        pageId: pageId,
        pageAccessToken: longLivedPageToken,
        longLivedToken: longLivedPageToken,
        userAccessToken: longLivedUserToken, // Store user token for future use
        tokenExpiresAt: tokenExpiresAt,
        pageName: pageName,
        isConnected: true,
        lastConnected: new Date(),
        webhookSubscribed: false
      },
      { upsert: true, new: true }
    )
    
    console.log('Instagram user saved successfully:', {
      id: instagramUser._id,
      userId: instagramUser.userId,
      pageId: instagramUser.pageId,
      pageName: instagramUser.pageName
    })

    console.log('=== SUCCESS: Instagram OAuth Complete ===')
    console.log('All steps completed successfully!')
    
    // Redirect to frontend with success parameters instead of sending JSON
    const frontendUrl = process.env.FRONTEND_URL || 'https://instantchat.in'
    const dashboardRedirectUrl = `${frontendUrl}/dashboard?instagram=success&pageId=${instagramUser.pageId}&pageName=${encodeURIComponent(instagramUser.pageName)}&instagramAccountId=${instagramUser.instagramAccountId}`
    const oauthCallbackUrl = `${frontendUrl}/oauth-callback?instagram=success&pageId=${instagramUser.pageId}&pageName=${encodeURIComponent(instagramUser.pageName)}&instagramAccountId=${instagramUser.instagramAccountId}`
    
    console.log('Redirecting to frontend dashboard:', dashboardRedirectUrl)
    console.log('Alternative OAuth callback URL:', oauthCallbackUrl)
    console.log('Frontend URL from env:', process.env.FRONTEND_URL)
    console.log('Instagram user data for redirect:', {
      pageId: instagramUser.pageId,
      pageName: instagramUser.pageName,
      instagramAccountId: instagramUser.instagramAccountId
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
            pageId: instagramUser.pageId,
            pageName: instagramUser.pageName,
            instagramAccountId: instagramUser.instagramAccountId,
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

// Send message to Instagram
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

    // Send message via Meta API
    const apiResponse = await metaApi.sendInstagramMessage(
      instagramUser.pageAccessToken,
      recipientId,
      message,
      messageType
    )

    if (!apiResponse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to send Instagram message',
        details: apiResponse.error
      })
    }

    // Save message to database
    const newMessage = new Message({
      sender: instagramUser.pageName || 'You',
      content: message,
      userId: userId,
      timestamp: new Date(),
      room: 'instagram',
      source: 'local',
      isToInstagram: true,
      instagramSenderId: recipientId,
      instagramMessageId: apiResponse.messageId,
      instagramThreadId: threadId,
      messageType: messageType
    })

    await newMessage.save()

    res.json({
      success: true,
      message: 'Message sent to Instagram successfully!',
      data: {
        messageId: newMessage._id,
        instagramMessageId: apiResponse.messageId,
        timestamp: newMessage.timestamp,
        messageType: messageType
      }
    })

  } catch (error) {
    console.error('Send Instagram message error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send Instagram message' 
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

        const apiResponse = await metaApi.sendInstagramMessage(
          instagramUser.pageAccessToken,
          recipientId,
          message,
          messageType
        )

        if (apiResponse.success) {
          // Save message to database
          const newMessage = new Message({
            sender: instagramUser.pageName || 'You',
            content: message,
            userId: userId,
            timestamp: new Date(),
            room: 'instagram',
            source: 'local',
            isToInstagram: true,
            instagramSenderId: recipientId,
            instagramMessageId: apiResponse.messageId,
            messageType: messageType
          })

          await newMessage.save()

          results.push({
            recipientId,
            success: true,
            messageId: newMessage._id,
            instagramMessageId: apiResponse.messageId
          })
        } else {
          errors.push({
            recipientId,
            success: false,
            error: apiResponse.error
          })
        }
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
      message: `Bulk message sent to ${results.length} recipients`,
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
        pageName: instagramUser.pageName,
        instagramUsername: instagramUser.instagramUsername,
        lastConnected: instagramUser.lastConnected,
        tokenExpiresAt: instagramUser.tokenExpiresAt,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: isExpired
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

// Get Instagram conversations
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

    // Get conversations from messages
    const conversations = await Message.aggregate([
      { 
        $match: { 
          userId: userId, 
          room: 'instagram',
          $or: [
            { isToInstagram: true },
            { source: 'instagram' }
            ] 
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
      room: 'instagram',
      $or: [
        { isToInstagram: true },
        { source: 'instagram' }
      ]
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
        offset: parseInt(offset)
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

    // Get messages for this conversation
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
        offset: parseInt(offset)
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

    // Subscribe to webhooks using Meta API
    const subscriptionResponse = await metaApi.subscribeToWebhooks(
      instagramUser.pageAccessToken,
      instagramUser.pageId
    )

    if (subscriptionResponse.success) {
      // Update database
      instagramUser.webhookSubscribed = true
      instagramUser.lastWebhookSubscription = new Date()
      await instagramUser.save()

      res.json({
        success: true,
        message: 'Webhook subscription successful',
        data: {
          webhookSubscribed: true,
          lastSubscription: instagramUser.lastWebhookSubscription
        }
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to subscribe to webhooks',
        details: subscriptionResponse.error
      })
    }

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

    // Unsubscribe from webhooks using Meta API
    const unsubscriptionResponse = await metaApi.unsubscribeFromWebhooks(
      instagramUser.pageAccessToken,
      instagramUser.pageId
    )

    if (unsubscriptionResponse.success) {
      // Update database
      instagramUser.webhookSubscribed = false
      await instagramUser.save()

      res.json({
        success: true,
        message: 'Webhook unsubscription successful',
        data: {
          webhookSubscribed: false
        }
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to unsubscribe from webhooks',
        details: unsubscriptionResponse.error
      })
    }

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

// Instagram webhook verification (GET request from Meta)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  console.log('Webhook verification request:', {
    mode,
    token,
    challenge: challenge ? 'present' : 'missing'
  })

  // Verify token should match your app's verify token
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'instantchat_verify_token'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully')
    res.status(200).send(challenge)
  } else {
    console.error('Webhook verification failed:', {
      mode,
      token,
      expectedToken: verifyToken
    })
    res.status(403).send('Forbidden')
  }
})

// Instagram webhook for incoming messages (POST request from Meta)
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
      const { id: pageId, messaging } = entryItem

      if (messaging && Array.isArray(messaging)) {
        for (const messageEvent of messaging) {
          try {
            const { sender, recipient, message, timestamp } = messageEvent

            if (message && message.text) {
              // Find the Instagram user by page ID
              const instagramUser = await InstagramUser.findOne({ 
                pageId: pageId.toString(),
                isConnected: true 
              })

              if (!instagramUser) {
                console.log('No Instagram user found for page ID:', pageId)
                continue
              }

              // Save incoming message to database
              const newMessage = new Message({
                sender: sender.id,
                content: message.text,
                userId: instagramUser.userId,
                timestamp: new Date(timestamp * 1000),
                room: 'instagram',
                source: 'instagram',
                isToInstagram: false,
                instagramSenderId: sender.id,
                instagramRecipientId: recipient.id,
                instagramMessageId: message.mid,
                messageType: 'text'
              })

              await newMessage.save()

              processedEvents.push({
                type: 'message',
                senderId: sender.id,
                messageId: newMessage._id,
                content: message.text
              })

              console.log('Incoming Instagram message saved:', {
                messageId: newMessage._id,
                senderId: sender.id,
                content: message.text
              })

              // TODO: Trigger automation flows here
              // await triggerAutomationFlows(instagramUser.userId, sender.id, message.text)
            }
          } catch (error) {
            console.error('Error processing webhook message:', error)
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        processedEvents: processedEvents.length,
        events: processedEvents
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

// @route   GET /api/instagram/account
// @desc    Get Instagram account information
// @access  Private
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
        pageId: instagramUser.pageId,
        pageName: instagramUser.pageName,
        instagramAccountId: instagramUser.instagramAccountId,
        username: instagramUser.username,
        lastConnected: instagramUser.lastConnected,
        tokenExpiresAt: instagramUser.tokenExpiresAt,
        isConnected: instagramUser.isConnected
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
