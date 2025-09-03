const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const InstagramConnection = require('../models/InstagramConnection');
const User = require('../models/User');

// Instagram API Configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'https://tish-production.up.railway.app/api/instagram/callback';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com/v21.0';

// @route   GET /api/instagram/auth
// @desc    Check Instagram connection status
// @access  Private
router.get('/auth', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find Instagram connection for this user
    const connection = await InstagramConnection.findOne({ userId });
    
    if (!connection) {
      return res.json({
        success: true,
        connected: false,
        message: 'No Instagram connection found'
      });
    }

    // Check if token is still valid
    const now = new Date();
    if (connection.tokenExpiresAt && now > connection.tokenExpiresAt) {
      // Token expired, mark as disconnected
      connection.isConnected = false;
      await connection.save();
      
      return res.json({
        success: true,
        connected: false,
        message: 'Instagram token expired',
        needsRefresh: true
      });
    }

    res.json({
      success: true,
      connected: connection.isConnected,
      message: 'Instagram connection found',
      connection: {
        username: connection.username,
        instagramUserId: connection.instagramUserId,
        permissions: connection.permissions,
        lastConnected: connection.lastConnected
      }
    });

  } catch (error) {
    console.error('Instagram auth check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Instagram connection'
    });
  }
});

// @route   GET /api/instagram/connect
// @desc    Start Instagram OAuth flow (Instagram Login)
// @access  Private
router.get('/connect', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Instagram Login OAuth URL
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&scope=instagram_basic,instagram_manage_comments,instagram_manage_messages` +
      `&response_type=code` +
      `&state=${userId}`; // Pass user ID in state for security

    res.json({
      success: true,
      authUrl: instagramAuthUrl,
      message: 'Instagram OAuth URL generated'
    });

  } catch (error) {
    console.error('Instagram connect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Instagram OAuth URL'
    });
  }
});

// @route   GET /api/instagram/callback
// @desc    Handle Instagram OAuth callback
// @access  Public
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state'
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token from Instagram');
    }

    // Get long-lived access token
    const longLivedTokenResponse = await fetch(
      `${INSTAGRAM_GRAPH_URL}/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${INSTAGRAM_APP_SECRET}&` +
      `access_token=${tokenData.access_token}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (!longLivedTokenData.access_token) {
      throw new Error('Failed to get long-lived access token');
    }

    // Get user info
    const userResponse = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me?` +
      `fields=id,username,account_type&` +
      `access_token=${longLivedTokenData.access_token}`
    );

    const userData = await userResponse.json();
    
    if (!userData.id || !userData.username) {
      throw new Error('Failed to get Instagram user info');
    }

    // Check if user has professional account
    if (userData.account_type !== 'BUSINESS' && userData.account_type !== 'CREATOR') {
      return res.status(400).json({
        success: false,
        error: 'Instagram account must be a professional account (Business or Creator)'
      });
    }

    // Get permissions
    const permissionsResponse = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me/permissions?` +
      `access_token=${longLivedTokenData.access_token}`
    );

    const permissionsData = await permissionsResponse.json();
    const permissions = permissionsData.data || [];

    // Calculate token expiration
    const expiresIn = longLivedTokenData.expires_in || 5184000; // 60 days in seconds
    const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Save or update connection
    const userId = state; // User ID was passed in state parameter
    
    let connection = await InstagramConnection.findOne({ userId });
    
    if (connection) {
      // Update existing connection
      connection.accessToken = longLivedTokenData.access_token;
      connection.tokenExpiresAt = tokenExpiresAt;
      connection.username = userData.username;
      connection.instagramUserId = userData.id;
      connection.permissions = permissions.map(p => p.permission);
      connection.lastConnected = new Date();
      connection.isConnected = true;
    } else {
      // Create new connection
      connection = new InstagramConnection({
        userId,
        accessToken: longLivedTokenData.access_token,
        tokenExpiresAt,
        username: userData.username,
        instagramUserId: userData.id,
        permissions: permissions.map(p => p.permission),
        lastConnected: new Date(),
        isConnected: true
      });
    }

    await connection.save();

    // Redirect to success page
    const successUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?instagram=success&username=${encodeURIComponent(userData.username)}&userId=${userData.id}&permissions=${encodeURIComponent(permissions.map(p => p.permission).join(','))}`;
    
    res.redirect(successUrl);

  } catch (error) {
    console.error('Instagram callback error:', error);
    
    const errorUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?instagram=error&error=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
});

// @route   POST /api/instagram/refresh-token
// @desc    Refresh Instagram access token
// @access  Private
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await InstagramConnection.findOne({ userId });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram connection found'
      });
    }

    // Refresh the token
    const refreshResponse = await fetch(
      `${INSTAGRAM_GRAPH_URL}/access_token?` +
      `grant_type=ig_refresh_token&` +
      `access_token=${connection.accessToken}`
    );

    const refreshData = await refreshResponse.json();
    
    if (!refreshData.access_token) {
      throw new Error('Failed to refresh Instagram access token');
    }

    // Update connection with new token
    connection.accessToken = refreshData.access_token;
    connection.tokenExpiresAt = new Date(Date.now() + ((refreshData.expires_in || 5184000) * 1000));
    connection.lastConnected = new Date();
    
    await connection.save();

    res.json({
      success: true,
      message: 'Instagram token refreshed successfully',
      expiresAt: connection.tokenExpiresAt
    });

  } catch (error) {
    console.error('Instagram token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh Instagram token'
    });
  }
});

// @route   POST /api/instagram/disconnect
// @desc    Disconnect Instagram account
// @access  Private
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await InstagramConnection.findOne({ userId });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram connection found'
      });
    }

    // Mark as disconnected
    connection.isConnected = false;
    connection.disconnectedAt = new Date();
    
    await connection.save();

    res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });

  } catch (error) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Instagram account'
    });
  }
});

// @route   GET /api/instagram/webhook
// @desc    Instagram webhook endpoint for receiving events
// @access  Public
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify webhook
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log('✅ Instagram webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Instagram webhook verification failed');
    res.status(403).json({ error: 'Forbidden' });
  }
});

// @route   POST /api/instagram/webhook
// @desc    Handle Instagram webhook events
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    
    console.log('📱 Instagram webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature (if configured)
    // TODO: Implement webhook signature verification

    if (body.object === 'instagram') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          await processInstagramWebhookEvent(change);
        }
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Instagram webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to process webhook events
async function processInstagramWebhookEvent(change) {
  try {
    const { field, value } = change;
    
    console.log(`🔔 Processing Instagram webhook: ${field}`, value);

    // Handle different event types
    switch (field) {
      case 'comments':
        await handleCommentEvent(value);
        break;
      case 'mentions':
        await handleMentionEvent(value);
        break;
      case 'messages':
        await handleMessageEvent(value);
        break;
      case 'live_comments':
        await handleLiveCommentEvent(value);
        break;
      default:
        console.log(`⚠️ Unknown Instagram webhook field: ${field}`);
    }

  } catch (error) {
    console.error('Error processing Instagram webhook event:', error);
  }
}

// Event handlers
async function handleCommentEvent(data) {
  // TODO: Implement comment event handling
  console.log('💬 Comment event received:', data);
}

async function handleMentionEvent(data) {
  // TODO: Implement mention event handling
  console.log('🏷️ Mention event received:', data);
}

async function handleMessageEvent(data) {
  // TODO: Implement message event handling
  console.log('💌 Message event received:', data);
}

async function handleLiveCommentEvent(data) {
  // TODO: Implement live comment event handling
  console.log('📺 Live comment event received:', data);
}

// Debug endpoints for development
router.get('/debug/auth', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await InstagramConnection.findOne({ userId });
    
    res.json({
      success: true,
      debug: {
        userId,
        instagramConnection: connection ? {
          username: connection.username,
          userId: connection.userId,
          instagramUserId: connection.instagramUserId,
          isConnected: connection.isConnected,
          permissions: connection.permissions,
          lastConnected: connection.lastConnected,
          tokenExpiresAt: connection.tokenExpiresAt
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fix endpoint to update Instagram connection user ID
router.post('/debug/fix-user-id-mismatch', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find any Instagram connection (for MVP testing)
    let connection = await InstagramConnection.findOne({});
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram connection found'
      });
    }

    const oldUserId = connection.userId;
    
    // Update the connection to use the current user's ID
    connection.userId = userId;
    await connection.save();

    res.json({
      success: true,
      message: 'Instagram connection user ID fixed',
      connection: {
        username: connection.username,
        oldUserId,
        newUserId: userId,
        permissions: connection.permissions
      }
    });

  } catch (error) {
    console.error('Fix user ID mismatch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix user ID mismatch'
    });
  }
});

module.exports = router;
