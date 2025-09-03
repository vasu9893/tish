const axios = require('axios');
const { config: webhookConfig } = require('../config/webhooks');

class WebhookMetaApi {
  constructor() {
    this.baseUrl = webhookConfig.meta.baseUrl;
    this.apiVersion = webhookConfig.meta.graphApiVersion;
    this.appId = webhookConfig.meta.appId;
    this.appSecret = webhookConfig.meta.appSecret;
  }

  /**
   * Subscribe Instagram account to webhook fields
   */
  async subscribeToWebhook(instagramAccountId, accessToken, fields) {
    try {
      console.log('🔗 Subscribing Instagram account to webhook fields:', {
        accountId: instagramAccountId,
        fields: fields
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramAccountId}/subscribed_apps`;
      const params = {
        subscribed_fields: fields.join(','),
        access_token: accessToken
      };

      const response = await axios.post(url, null, { params });

      if (response.data.success) {
        console.log('✅ Successfully subscribed to webhook fields:', fields);
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to subscribe to webhook fields');
      }

    } catch (error) {
      console.error('❌ Failed to subscribe to webhook fields:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Unsubscribe Instagram account from webhook fields
   */
  async unsubscribeFromWebhook(instagramAccountId, accessToken) {
    try {
      console.log('🔗 Unsubscribing Instagram account from webhook fields:', instagramAccountId);

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramAccountId}/subscribed_apps`;
      const params = {
        subscribed_fields: '', // Empty string to unsubscribe from all fields
        access_token: accessToken
      };

      const response = await axios.post(url, null, { params });

      if (response.data.success) {
        console.log('✅ Successfully unsubscribed from webhook fields');
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to unsubscribe from webhook fields');
      }

    } catch (error) {
      console.error('❌ Failed to unsubscribe from webhook fields:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Get current webhook subscriptions for an Instagram account
   */
  async getWebhookSubscriptions(instagramAccountId, accessToken) {
    try {
      console.log('🔍 Getting webhook subscriptions for Instagram account:', instagramAccountId);

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramAccountId}/subscribed_apps`;
      const params = {
        access_token: accessToken
      };

      const response = await axios.get(url, { params });

      console.log('✅ Retrieved webhook subscriptions:', response.data);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Failed to get webhook subscriptions:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Test webhook delivery for a specific field
   */
  async testWebhookField(instagramAccountId, accessToken, field) {
    try {
      console.log('🧪 Testing webhook field:', field);

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramAccountId}/subscribed_apps`;
      const params = {
        subscribed_fields: field,
        access_token: accessToken
      };

      const response = await axios.post(url, null, { params });

      if (response.data.success) {
        console.log('✅ Webhook field test successful:', field);
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Webhook field test failed');
      }

    } catch (error) {
      console.error('❌ Webhook field test failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Get Instagram account permissions and capabilities
   */
  async getAccountPermissions(instagramAccountId, accessToken) {
    try {
      console.log('🔍 Getting Instagram account permissions:', instagramAccountId);

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramAccountId}/permissions`;
      const params = {
        access_token: accessToken
      };

      const response = await axios.get(url, { params });

      console.log('✅ Retrieved account permissions:', response.data);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Failed to get account permissions:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Validate access token and get account info
   */
  async validateAccessToken(accessToken) {
    try {
      console.log('🔍 Validating access token...');

      const url = `${this.baseUrl}/${this.apiVersion}/me`;
      const params = {
        access_token: accessToken,
        fields: 'id,username,account_type'
      };

      const response = await axios.get(url, { params });

      console.log('✅ Access token validated:', response.data);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Access token validation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Get supported webhook fields based on account permissions
   */
  async getSupportedWebhookFields(instagramAccountId, accessToken) {
    try {
      console.log('🔍 Getting supported webhook fields for account:', instagramAccountId);

      // Get account permissions
      const permissionsResponse = await this.getAccountPermissions(instagramAccountId, accessToken);
      if (!permissionsResponse.success) {
        throw new Error('Failed to get account permissions');
      }

      const permissions = permissionsResponse.data.data || [];
      const supportedFields = [];

      // Check which webhook fields are supported based on permissions
      for (const [field, requiredPermissions] of Object.entries(webhookConfig.fieldPermissions)) {
        const hasRequiredPermissions = requiredPermissions.some(permission => 
          permissions.some(p => p.permission === permission && p.status === 'granted')
        );

        if (hasRequiredPermissions) {
          supportedFields.push({
            field,
            permissions: requiredPermissions,
            description: webhookConfig.eventTypes[field]?.description || field,
            requiresAdvancedAccess: webhookConfig.eventTypes[field]?.requiresAdvancedAccess || false
          });
        }
      }

      console.log('✅ Supported webhook fields:', supportedFields);
      return {
        success: true,
        data: supportedFields
      };

    } catch (error) {
      console.error('❌ Failed to get supported webhook fields:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create webhook subscription with automatic field detection
   */
  async createSmartWebhookSubscription(instagramAccountId, accessToken, preferredFields = []) {
    try {
      console.log('🧠 Creating smart webhook subscription for account:', instagramAccountId);

      // Get supported fields
      const supportedFieldsResponse = await this.getSupportedWebhookFields(instagramAccountId, accessToken);
      if (!supportedFieldsResponse.success) {
        throw new Error('Failed to get supported webhook fields');
      }

      const supportedFields = supportedFieldsResponse.data;
      let fieldsToSubscribe = [];

      // If preferred fields are specified, filter to only supported ones
      if (preferredFields.length > 0) {
        fieldsToSubscribe = supportedFields
          .filter(field => preferredFields.includes(field.field))
          .map(field => field.field);
      } else {
        // Subscribe to all supported fields
        fieldsToSubscribe = supportedFields.map(field => field.field);
      }

      if (fieldsToSubscribe.length === 0) {
        throw new Error('No supported webhook fields found for this account');
      }

      // Create subscription
      const subscriptionResponse = await this.subscribeToWebhook(
        instagramAccountId,
        accessToken,
        fieldsToSubscribe
      );

      if (subscriptionResponse.success) {
        console.log('✅ Smart webhook subscription created successfully');
        return {
          success: true,
          data: {
            subscribedFields: fieldsToSubscribe,
            supportedFields: supportedFields,
            subscription: subscriptionResponse.data
          }
        };
      } else {
        throw new Error('Failed to create webhook subscription');
      }

    } catch (error) {
      console.error('❌ Failed to create smart webhook subscription:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WebhookMetaApi();
