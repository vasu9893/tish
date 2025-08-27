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
   * @returns {Promise<Object>} API response
   */
  async sendInstagramMessage(pageAccessToken, recipientId, message) {
    try {
      const response = await axios.post(
        `${this.graphUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message }
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
}

module.exports = new MetaApiHelper()
