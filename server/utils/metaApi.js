const axios = require('axios')

class MetaApiHelper {
  constructor() {
    this.graphUrl = process.env.META_GRAPH_URL || 'https://graph.facebook.com/v19.0'
  }

  /**
   * Send a message to Instagram user via Messenger API
   * @param {string} pageAccessToken - Page access token
   * @param {string} recipientId - Instagram user ID
   * @param {string} message - Message text to send
   * @param {string} messageType - Type of message (text, image, etc.)
   * @returns {Promise<Object>} API response
   */
  async sendInstagramMessage(pageAccessToken, recipientId, message, messageType = 'text') {
    try {
      let messagePayload

      switch (messageType) {
        case 'text':
          messagePayload = { text: message }
          break
        case 'image':
          messagePayload = { 
            attachment: {
              type: 'image',
              payload: { url: message }
            }
          }
          break
        case 'quick_reply':
          messagePayload = {
            text: message.text || 'Choose an option:',
            quick_replies: message.quickReplies || []
          }
          break
        default:
          messagePayload = { text: message }
      }

      const response = await axios.post(
        `${this.graphUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: messagePayload
        },
        {
          params: {
            access_token: pageAccessToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      return {
        success: true,
        messageId: response.data.message_id,
        data: response.data
      }
    } catch (error) {
      console.error('Error sending Instagram message:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get user's pages
   * @param {string} userAccessToken - User access token
   * @returns {Promise<Object>} User's pages
   */
  async getUserPages(userAccessToken) {
    try {
      const response = await axios.get(
        `${this.graphUrl}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token,instagram_business_account'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting user pages:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get user information
   * @param {string} accessToken - User access token
   * @returns {Promise<Object>} User info
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        `${this.graphUrl}/me`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,email'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get Instagram page information
   * @param {string} pageAccessToken - Page access token
   * @returns {Promise<Object>} Page info
   */
  async getPageInfo(pageAccessToken) {
    try {
      const response = await axios.get(
        `${this.graphUrl}/me`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'id,name,instagram_business_account'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting page info:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      // Use the correct backend callback URL
      const redirectUri = process.env.BACKEND_URL || 'https://tish-production.up.railway.app'
      
      console.log('Token exchange - redirect_uri:', `${redirectUri}/api/instagram/auth/instagram/callback`)
      console.log('Token exchange - code:', code ? 'present' : 'missing')
      
      const response = await axios.get(
        `${this.graphUrl}/oauth/access_token`,
        {
          params: {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: `${redirectUri}/api/instagram/auth/instagram/callback`,
            code: code
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error exchanging code for token:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        params: {
          client_id: process.env.META_APP_ID,
          redirect_uri: `${process.env.BACKEND_URL || 'https://tish-production.up.railway.app'}/api/instagram/auth/instagram/callback`,
          code: code ? 'present' : 'missing'
        }
      })
      return {
        success: false,
        error: error.response?.data || error.message,
        details: {
          status: error.response?.status,
          message: error.message
        }
      }
    }
  }

  /**
   * Exchange authorization code for Instagram access token (Direct Instagram OAuth)
   * @param {string} code - Authorization code from Instagram OAuth
   * @returns {Promise<Object>} Instagram token response
   */
  async exchangeInstagramCodeForToken(code) {
    try {
      console.log('Exchanging Instagram code for token:', {
        code: code ? code.substring(0, 10) + '...' : 'none',
        redirectUri: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
          : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback'
      })

      const response = await axios.post(
        'https://api.instagram.com/oauth/access_token',
        null,
        {
          params: {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.BACKEND_URL 
              ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
              : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback',
            code: code
          }
        }
      )
      
      console.log('Instagram token exchange successful:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      })
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error exchanging Instagram code for token:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Exchange authorization code for Instagram Basic Display API access token
   * @param {string} code - Authorization code from Instagram OAuth
   * @returns {Promise<Object>} Instagram token response
   */
  async exchangeInstagramBasicDisplayToken(code) {
    try {
      console.log('Exchanging Instagram Basic Display code for token:', {
        code: code ? code.substring(0, 10) + '...' : 'none',
        redirectUri: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
          : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback'
      })

      const response = await axios.post(
        'https://api.instagram.com/oauth/access_token',
        null,
        {
          params: {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.BACKEND_URL
              ? `${process.env.BACKEND_URL}/api/instagram/auth/instagram/callback`
              : 'https://tish-production.up.railway.app/api/instagram/auth/instagram/callback',
            code: code
          }
        }
      )

      console.log('Instagram Basic Display token exchange successful:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error exchanging Instagram Basic Display code for token:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get Instagram user information using Instagram Basic Display API
   * @param {string} accessToken - Instagram access token
   * @param {string} userId - Instagram user ID
   * @returns {Promise<Object>} Instagram user info response
   */
  async getInstagramUserInfo(accessToken, userId) {
    try {
      console.log('Getting Instagram user info:', {
        userId: userId,
        hasToken: !!accessToken
      })

      const response = await axios.get(
        `https://graph.instagram.com/me`,
        {
          params: {
            fields: 'id,username,account_type',
            access_token: accessToken
          }
        }
      )

      console.log('Instagram user info successful:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting Instagram user info:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get long-lived access token
   * @param {string} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} Long-lived token response
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(
        `${this.graphUrl}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            fb_exchange_token: shortLivedToken
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting long-lived token:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Subscribe to Instagram webhooks
   * @param {string} pageAccessToken - Page access token
   * @param {string} pageId - Page ID
   * @returns {Promise<Object>} Subscription response
   */
  async subscribeToWebhooks(pageAccessToken, pageId) {
    try {
      const webhookUrl = process.env.BACKEND_URL || 'https://tish-production.up.railway.app'
      const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'instantchat_verify_token'

      const response = await axios.post(
        `${this.graphUrl}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins'],
          webhook_url: `${webhookUrl}/api/instagram/webhook`,
          verify_token: verifyToken
        },
        {
          params: {
            access_token: pageAccessToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error subscribing to webhooks:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Unsubscribe from Instagram webhooks
   * @param {string} pageAccessToken - Page access token
   * @param {string} pageId - Page ID
   * @returns {Promise<Object>} Unsubscription response
   */
  async unsubscribeFromWebhooks(pageAccessToken, pageId) {
    try {
      const response = await axios.delete(
        `${this.graphUrl}/${pageId}/subscribed_apps`,
        {
          params: {
            access_token: pageAccessToken
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error unsubscribing from webhooks:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Get Instagram user profile
   * @param {string} pageAccessToken - Page access token
   * @param {string} instagramUserId - Instagram user ID
   * @returns {Promise<Object>} User profile response
   */
  async getInstagramUserProfile(pageAccessToken, instagramUserId) {
    try {
      const response = await axios.get(
        `${this.graphUrl}/${instagramUserId}`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'id,username,name,profile_picture_url'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error getting Instagram user profile:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  /**
   * Send typing indicator
   * @param {string} pageAccessToken - Page access token
   * @param {string} recipientId - Instagram user ID
   * @returns {Promise<Object>} API response
   */
  async sendTypingIndicator(pageAccessToken, recipientId) {
    try {
      const response = await axios.post(
        `${this.graphUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          sender_action: 'typing_on'
        },
        {
          params: {
            access_token: pageAccessToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }
}

module.exports = new MetaApiHelper()
