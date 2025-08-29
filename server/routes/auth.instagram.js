const express = require('express')
const router = express.Router()
const { createState, parseState } = require('../utils/csrfState')
const { getAuthUrl } = require('../config/meta')

/**
 * Instagram OAuth Start
 * GET /auth/instagram/start
 * Initiates Instagram OAuth flow with CSRF protection
 */
router.get('/start', (req, res) => {
  try {
    const { next = '/dashboard', reauth = false } = req.query
    
    // Create secure state token with next redirect and TTL
    const state = createState({ next }, 10) // 10 minutes TTL
    
    console.log('Instagram OAuth initiated:', {
      next,
      reauth,
      stateLength: state.length,
      timestamp: new Date().toISOString()
    })
    
    // Generate OAuth URL using meta config
    const authUrl = getAuthUrl({ state, reauth })
    
    // Redirect to Meta OAuth page
    res.redirect(authUrl)
    
  } catch (error) {
    console.error('Instagram OAuth start error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Instagram OAuth',
      details: error.message
    })
  }
})

/**
 * Instagram OAuth Status
 * GET /auth/instagram/status
 * Returns stored Instagram connection information for current user
 */
router.get('/status', (req, res) => {
  try {
    // TODO: Implement actual user authentication and data retrieval
    // For now, return stub data
    console.log('Instagram status requested:', {
      timestamp: new Date().toISOString(),
      headers: req.headers
    })
    
    res.json({
      success: true,
      data: {
        pageId: 'TODO_IMPLEMENT_PAGE_ID_RETRIEVAL',
        igBusinessId: 'TODO_IMPLEMENT_IG_BUSINESS_ID_RETRIEVAL',
        grantedScopes: [
          'instagram_basic',
          'instagram_manage_messages',
          'pages_messaging'
        ],
        missingScopes: [
          'pages_show_list',
          'pages_read_engagement',
          'business_management'
        ],
        connectionStatus: 'connected',
        lastConnected: new Date().toISOString(),
        note: 'This is stub data - implement actual user authentication and data retrieval'
      }
    })
    
  } catch (error) {
    console.error('Instagram status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Instagram status',
      details: error.message
    })
  }
})

/**
 * Instagram OAuth Callback (for reference)
 * This endpoint is handled by the existing /api/instagram/auth/instagram/callback route
 * GET /auth/instagram/callback
 */
router.get('/callback', (req, res) => {
  // This is handled by the main Instagram routes
  // Redirect to the proper endpoint
  res.redirect('/api/instagram/auth/instagram/callback' + req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '')
})

module.exports = router
