const express = require('express')
const router = express.Router()
const InstagramUser = require('../models/InstagramUser')
const Message = require('../models/Message')
const metaApi = require('../utils/metaApi')
const authMiddleware = require('../middleware/authMiddleware')

// Instagram OAuth - Start the flow
router.get('/auth/instagram', (req, res) => {
  const appId = process.env.META_APP_ID
  // Force HTTPS for Facebook OAuth
  const redirectUri = `https://${req.get('host')}/api/instagram/auth/instagram/callback`
  const scope = 'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_read_engagement'
  
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${Date.now()}`
  
  res.json({ 
    success: true, 
    authUrl: authUrl,
    message: 'Redirect user to this URL to authorize Instagram access'
  })
})

// Instagram OAuth Callback
router.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code not received' 
      })
    }

    // Exchange code for access token
    const tokenResponse = await metaApi.exchangeCodeForToken(code)
    
    if (!tokenResponse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to exchange code for token' 
      })
    }

    const { access_token, user_id } = tokenResponse.data

    // Get long-lived token
    const longLivedResponse = await metaApi.getLongLivedToken(access_token)
    
    if (!longLivedResponse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get long-lived token' 
      })
    }

    const { access_token: longLivedToken, expires_in } = longLivedResponse.data

    // Get page information
    const pageResponse = await metaApi.getPageInfo(longLivedToken)
    
    if (!pageResponse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get page information' 
      })
    }

    const { id: pageId, name: pageName, instagram_business_account } = pageResponse.data

    // Calculate token expiry
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in)

    // Save or update Instagram user connection
    const instagramUser = await InstagramUser.findOneAndUpdate(
      { userId: user_id },
      {
        userId: user_id,
        username: pageName || 'Instagram User',
        instagramAccountId: instagram_business_account?.id || user_id,
        pageId: pageId,
        pageAccessToken: longLivedToken,
        longLivedToken: longLivedToken,
        tokenExpiresAt: tokenExpiresAt,
        pageName: pageName,
        isConnected: true,
        lastConnected: new Date(),
        webhookSubscribed: false
      },
      { upsert: true, new: true }
    )

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
    console.error('Instagram OAuth callback error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete Instagram authentication' 
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

module.exports = router
