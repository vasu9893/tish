const express = require('express')
const router = express.Router()
const InstagramUser = require('../models/InstagramUser')
const Message = require('../models/Message')
const metaApi = require('../utils/metaApi')
const authMiddleware = require('../middleware/authMiddleware')

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

    // Validate required data
    if (!access_token || !user_id) {
      console.error('Missing required data from token response:', {
        hasAccessToken: !!access_token,
        hasUserId: !!user_id,
        dataKeys: Object.keys(tokenResponse.data || {})
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid token response - missing access_token or user_id'
      })
    }

    console.log('Token response validation passed:', {
      hasAccessToken: !!access_token,
      hasUserId: !!user_id,
      userId: user_id
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

    // Validate user token expiry value
    if (!userTokenExpiresIn || isNaN(userTokenExpiresIn) || userTokenExpiresIn <= 0) {
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

    // Validate expiry value
    if (!pageTokenExpiresIn || isNaN(pageTokenExpiresIn) || pageTokenExpiresIn <= 0) {
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

    // Calculate token expiry (use page token expiry)
    console.log('=== STEP 5: Save to Database ===')
    
    let tokenExpiresAt
    if (pageTokenExpiresIn && !isNaN(pageTokenExpiresIn) && pageTokenExpiresIn > 0) {
      // Use Meta's provided expiry
      tokenExpiresAt = new Date()
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + parseInt(pageTokenExpiresIn))
      console.log('Using Meta-provided expiry:', pageTokenExpiresIn, 'seconds')
    } else {
      // Fallback to 60 days (typical for long-lived tokens)
      tokenExpiresAt = new Date()
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60)
      console.log('Using fallback expiry: 60 days from now')
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
      { userId: user_id },
      {
        userId: user_id,
        username: pageName || 'Instagram User',
        instagramAccountId: instagram_business_account?.id || user_id,
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
    
    res.json({
      success: true,
      message: 'Instagram connected successfully!',
      data: {
        pageId: instagramUser.pageId,
        pageName: instagramUser.pageName,
        instagramAccountId: instagramUser.instagramAccountId,
        tokenExpiresAt: instagramUser.tokenExpiresAt
      }
    })

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
    const { recipientId, message, threadId } = req.body
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
      message
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
      instagramThreadId: threadId
    })

    await newMessage.save()

    res.json({
      success: true,
      message: 'Message sent to Instagram successfully!',
      data: {
        messageId: newMessage._id,
        instagramMessageId: apiResponse.messageId,
        timestamp: newMessage.timestamp
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

// Get Instagram connection status
router.get('/status', authMiddleware, async (req, res) => {
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
