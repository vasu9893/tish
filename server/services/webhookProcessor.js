const crypto = require('crypto');
const WebhookEvent = require('../models/WebhookEvent');
const WebhookSubscription = require('../models/WebhookSubscription');
const InstagramUser = require('../models/InstagramUser');

class WebhookProcessor {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.batchSize = 100;
    this.retryDelay = 5000;
    this.maxRetries = 3;
    this.socketIO = null; // Will be set by the server
  }

  /**
   * Set Socket.IO instance for broadcasting
   */
  setSocketIO(io) {
    this.socketIO = io;
    console.log('🔌 Socket.IO instance set for webhook broadcasting');
  }

  /**
   * Broadcast webhook event to Socket.IO clients
   */
  broadcastWebhookEvent(eventData) {
    if (!this.socketIO) {
      console.log('⚠️ Socket.IO not available for broadcasting');
      return;
    }

    try {
      const eventMessage = {
        id: eventData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: eventData.eventType || eventData.type || 'unknown',
        sender: {
          id: eventData.sender?.id || eventData.from?.id || eventData.senderId || 'unknown',
          username: eventData.sender?.username || eventData.from?.username || eventData.senderId || 'Unknown User'
        },
        content: {
          text: eventData.message?.text || eventData.comment?.text || eventData.content || 'No content available'
        },
        timestamp: eventData.timestamp || eventData.created_time || new Date().toISOString(),
        accountId: eventData.accountId || eventData.instagramAccountId || 'unknown',
        payload: eventData // Store full payload for details view
      };

      console.log('📤 Broadcasting webhook event via Socket.IO:', {
        eventType: eventMessage.eventType,
        sender: eventMessage.sender.username,
        content: eventMessage.content.text.substring(0, 50) + '...'
      });

      // Broadcast to all connected clients
      this.socketIO.emit('webhook_event', eventMessage);

    } catch (error) {
      console.error('❌ Failed to broadcast webhook event:', error);
    }
  }

  /**
   * Verify webhook signature using X-Hub-Signature-256
   */
  verifySignature(payload, signature, appSecret) {
    try {
      // Skip signature verification if no signature provided (for testing)
      if (!signature) {
        console.log('⚠️ No signature provided, skipping verification (development mode)');
        return true;
      }

      // Skip signature verification if no app secret configured
      if (!appSecret) {
        console.log('⚠️ No app secret configured, skipping verification (development mode)');
        return true;
      }

      // Create expected signature
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');
      
      console.log('🔐 Signature verification:', {
        provided: signature,
        expected: expectedSignature,
        payloadLength: payload.length,
        appSecretLength: appSecret ? appSecret.length : 0
      });

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        console.error('❌ Signature verification failed:', {
          provided: signature,
          expected: expectedSignature
        });
      }

      return isValid;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      
      // In development, allow webhooks without proper signatures
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: allowing webhook without valid signature');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Process incoming webhook payload
   */
  async processWebhook(payload, headers, query, rawBody = null) {
    const startTime = Date.now();
    
    try {
      console.log('📥 Processing webhook payload:', {
        contentType: headers['content-type'],
        userAgent: headers['user-agent'],
        payloadType: typeof payload,
        rawBodyType: rawBody ? typeof rawBody : 'none',
        rawBodyLength: rawBody ? (Buffer.isBuffer(rawBody) ? rawBody.length : rawBody.length) : 0,
        timestamp: new Date().toISOString()
      });

      // Extract webhook metadata
      const webhookMetadata = {
        hubMode: query['hub.mode'],
        hubVerifyToken: query['hub.verify_token'],
        hubTimestamp: query['hub.timestamp'],
        hubSignature: headers['x-hub-signature-256']
      };

      // Verify webhook signature using raw body
      const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
      let rawPayload;
      
      if (rawBody) {
        rawPayload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      } else {
        rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
      }
      
      if (!this.verifySignature(rawPayload, webhookMetadata.hubSignature, appSecret)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse and validate payload
      const events = this.parsePayload(payload);
      if (!events || events.length === 0) {
        throw new Error('No valid events found in payload');
      }

      // Process each event
      const processingResults = [];
      for (const event of events) {
        try {
          const result = await this.processEvent(event, webhookMetadata);
          processingResults.push(result);
        } catch (error) {
          console.error('❌ Failed to process event:', error);
          processingResults.push({
            success: false,
            error: error.message,
            event: event
          });
        }
      }

      const processingTime = Date.now() - startTime;
      
      console.log('✅ Webhook processing completed:', {
        eventsProcessed: events.length,
        successful: processingResults.filter(r => r.success).length,
        failed: processingResults.filter(r => !r.success).length,
        processingTime: `${processingTime}ms`
      });

      return {
        success: true,
        eventsProcessed: events.length,
        results: processingResults,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Webhook processing failed:', error);
      
      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  /**
   * Parse webhook payload and extract events
   */
  parsePayload(payload) {
    try {
      console.log('🔍 Parsing webhook payload:', {
        object: payload.object,
        hasEntry: !!payload.entry,
        entryType: Array.isArray(payload.entry) ? 'array' : typeof payload.entry,
        entryLength: Array.isArray(payload.entry) ? payload.entry.length : 'N/A',
        payloadKeys: Object.keys(payload)
      });

      const events = [];
      
      // Handle different payload structures
      if (payload.object === 'instagram') {
        if (payload.entry && Array.isArray(payload.entry)) {
          console.log('📋 Processing Instagram entries:', payload.entry.length);
          
          for (const entry of payload.entry) {
            console.log('📝 Processing entry:', {
              id: entry.id,
              hasChanges: !!entry.changes,
              changesType: Array.isArray(entry.changes) ? 'array' : typeof entry.changes,
              changesLength: Array.isArray(entry.changes) ? entry.changes.length : 'N/A',
              entryKeys: Object.keys(entry)
            });
            
            // Handle entries with changes array (standard webhook format)
            if (entry.changes && Array.isArray(entry.changes)) {
              for (const change of entry.changes) {
                console.log('🔄 Processing change:', {
                  field: change.field,
                  hasValue: !!change.value,
                  valueKeys: change.value ? Object.keys(change.value) : []
                });
                
                const event = this.parseInstagramChange(entry.id, change);
                if (event) {
                  console.log('✅ Created event:', event.eventType);
                  events.push(event);
                } else {
                  console.log('❌ Failed to create event from change');
                }
              }
            }
            // Handle entries without changes (direct event format)
            else if (entry.id && entry.time) {
              console.log('🔄 Processing direct entry event');
              const event = this.parseDirectInstagramEvent(entry);
              if (event) {
                console.log('✅ Created direct event:', event.eventType);
                events.push(event);
              } else {
                console.log('❌ Failed to create direct event');
              }
            }
            else {
              console.log('⚠️ Entry has no changes array or direct event structure');
            }
          }
        } else {
          console.log('⚠️ Payload has no entry array or entry is not an array');
        }
      } else {
        console.log('⚠️ Payload object is not "instagram":', payload.object);
      }

      console.log('📊 Total events parsed:', events.length);
      return events;
    } catch (error) {
      console.error('❌ Failed to parse webhook payload:', error);
      return [];
    }
  }

  /**
   * Parse direct Instagram event (without changes array)
   */
  parseDirectInstagramEvent(entry) {
    try {
      console.log('🔍 Parsing direct Instagram event:', {
        entryId: entry.id,
        entryKeys: Object.keys(entry)
      });

      // Create a basic event structure
      const event = {
        id: `event_${entry.id}_${Date.now()}`,
        eventType: 'instagram_webhook',
        timestamp: new Date(entry.time * 1000).toISOString(),
        accountId: entry.id,
        content: {
          text: 'Instagram webhook event received',
          rawData: entry
        },
        userInfo: {
          accountId: entry.id
        },
        metadata: {
          source: 'direct_webhook',
          entryData: entry
        }
      };

      return event;
    } catch (error) {
      console.error('❌ Failed to parse direct Instagram event:', error);
      return null;
    }
  }

  /**
   * Parse Instagram-specific change event
   */
  parseInstagramChange(accountId, change) {
    try {
      const { field, value } = change;
      
      console.log('🔍 Parsing Instagram change:', {
        field,
        accountId,
        hasValue: !!value,
        valueKeys: value ? Object.keys(value) : [],
        valueItem: value?.item ? Object.keys(value.item) : []
      });
      
      // Map field to event type
      const eventTypeMap = {
        'comments': 'comments',
        'live_comments': 'live_comments',
        'messages': 'messages',
        'message_reactions': 'message_reactions',
        'message_postbacks': 'message_postbacks',
        'message_referrals': 'message_referrals',
        'message_seen': 'message_seen',
        'mentions': 'mentions'
      };

      const eventType = eventTypeMap[field];
      if (!eventType) {
        console.warn('⚠️ Unknown Instagram field:', field);
        return null;
      }

      console.log('✅ Mapped field to event type:', { field, eventType });

      // Extract event data based on type
      const eventData = this.extractEventData(eventType, value, accountId);
      if (!eventData) {
        console.error('❌ extractEventData returned null for:', { eventType, value });
        return null;
      }

      console.log('✅ Extracted event data:', { eventType, eventData });

      return {
        eventType,
        accountId,
        ...eventData
      };

    } catch (error) {
      console.error('❌ Failed to parse Instagram change:', error);
      return null;
    }
  }

  /**
   * Extract event data based on event type
   */
  extractEventData(eventType, value, accountId) {
    try {
      console.log('🔍 Extracting event data:', {
        eventType,
        accountId,
        hasValue: !!value,
        valueKeys: value ? Object.keys(value) : [],
        valueStructure: value
      });

      switch (eventType) {
        case 'comments':
        case 'live_comments':
          return this.extractCommentData(value, accountId);
        
        case 'messages':
          return this.extractMessageData(value, accountId);
        
        case 'message_reactions':
          return this.extractReactionData(value, accountId);
        
        case 'mentions':
          return this.extractMentionData(value, accountId);
        
        default:
          return this.extractGenericData(value, accountId);
      }
    } catch (error) {
      console.error('❌ Failed to extract event data:', error);
      return null;
    }
  }

  /**
   * Extract comment data
   */
  extractCommentData(value, accountId) {
    console.log('🔍 Extracting comment data:', {
      hasValue: !!value,
      hasItem: !!value?.item,
      valueKeys: value ? Object.keys(value) : [],
      itemKeys: value?.item ? Object.keys(value.item) : []
    });

    // Handle Instagram webhook comment structure
    // Structure 1: value.item (nested)
    // Structure 2: value directly contains comment data
    let commentData = null;
    
    if (value?.item) {
      // Structure 1: value.item
      commentData = value.item;
      console.log('📋 Using nested value.item structure');
    } else if (value?.id && value?.text) {
      // Structure 2: value directly contains comment data
      commentData = value;
      console.log('📋 Using direct value structure');
    } else {
      console.log('❌ No valid comment structure found in value');
      return null;
    }
    
    const eventData = {
      id: `comment_${commentData.id || Date.now()}`,
      senderId: commentData.from?.id || commentData.user?.id || 'unknown',
      recipientId: accountId,
      timestamp: new Date().toISOString(),
      content: {
        text: commentData.text || commentData.message || '',
        mediaUrl: commentData.media?.url || null,
        mediaType: commentData.media?.type || commentData.media?.media_product_type || null,
        replyTo: commentData.reply_to?.comment_id || null,
        parentId: commentData.media?.id || commentData.parent_id || null
      },
      userInfo: {
        username: commentData.from?.username || commentData.user?.username || 'unknown',
        fullName: commentData.from?.name || commentData.user?.name || 'Unknown User',
        profilePicture: commentData.from?.profile_picture_url || commentData.user?.profile_picture_url || null,
        verified: commentData.from?.verified || commentData.user?.verified || false
      },
      metadata: {
        originalCommentData: commentData,
        originalValue: value
      }
    };

    console.log('✅ Successfully extracted comment data:', eventData);
    return eventData;
  }

  /**
   * Extract message data
   */
  extractMessageData(value, accountId) {
    if (!value || !value.message_id) return null;

    return {
      senderId: value.from?.id || 'unknown',
      recipientId: accountId,
      content: {
        text: value.message || '',
        mediaUrl: value.media?.url || null,
        mediaType: value.media?.type || null,
        replyTo: value.reply_to?.message_id || null,
        parentId: value.thread_id || null
      },
      userInfo: {
        username: value.from?.username || 'unknown',
        fullName: value.from?.name || 'Unknown User',
        profilePicture: value.from?.profile_picture_url || null,
        verified: value.from?.verified || false
      }
    };
  }

  /**
   * Extract reaction data
   */
  extractReactionData(value, accountId) {
    if (!value || !value.reaction_id) return null;

    return {
      senderId: value.from?.id || 'unknown',
      recipientId: accountId,
      content: {
        text: value.reaction || '',
        mediaUrl: null,
        mediaType: null,
        replyTo: value.message_id || null,
        parentId: value.thread_id || null
      },
      userInfo: {
        username: value.from?.username || 'unknown',
        fullName: value.from?.name || 'Unknown User',
        profilePicture: value.from?.profile_picture_url || null,
        verified: value.from?.verified || false
      }
    };
  }

  /**
   * Extract mention data
   */
  extractMentionData(value, accountId) {
    if (!value || !value.mention_id) return null;

    return {
      senderId: value.from?.id || 'unknown',
      recipientId: accountId,
      content: {
        text: value.text || '',
        mediaUrl: value.media?.url || null,
        mediaType: value.media?.type || null,
        replyTo: null,
        parentId: value.media?.id || null
      },
      userInfo: {
        username: value.from?.username || 'unknown',
        fullName: value.from?.name || 'Unknown User',
        profilePicture: value.from?.profile_picture_url || null,
        verified: value.from?.verified || false
      }
    };
  }

  /**
   * Extract generic data for unknown event types
   */
  extractGenericData(value, accountId) {
    return {
      senderId: value.from?.id || 'unknown',
      recipientId: accountId,
      content: {
        text: JSON.stringify(value) || '',
        mediaUrl: null,
        mediaType: null,
        replyTo: null,
        parentId: null
      },
      userInfo: {
        username: value.from?.username || 'unknown',
        fullName: value.from?.name || 'Unknown User',
        profilePicture: value.from?.profile_picture_url || null,
        verified: value.from?.verified || false
      }
    };
  }

  /**
   * Process individual event
   */
  async processEvent(event, webhookMetadata) {
    const startTime = Date.now();
    
    try {
      // Check if event is duplicate
      const deduplicationKey = `${event.eventType}_${event.accountId}_${event.senderId}_${Date.now()}`;
      const isDuplicate = await WebhookEvent.isDuplicate(deduplicationKey);
      
      if (isDuplicate) {
        console.log('⚠️ Duplicate event detected, skipping:', deduplicationKey);
        return {
          success: true,
          duplicate: true,
          eventId: deduplicationKey
        };
      }

      // Create webhook event record
      const webhookEvent = new WebhookEvent({
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        eventType: event.eventType,
        accountId: event.accountId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        payload: event,
        content: event.content,
        userInfo: event.userInfo,
        webhookMetadata,
        deduplicationKey
      });

      await webhookEvent.save();

      // Update subscription statistics
      await this.updateSubscriptionStats(event.accountId, {
        success: true,
        processingTime: Date.now() - startTime
      });

      // Add to processing queue
      this.addToQueue(webhookEvent);

      // Broadcast event to Socket.IO clients
      this.broadcastWebhookEvent(event);

      console.log('✅ Event processed successfully:', {
        eventId: webhookEvent.eventId,
        eventType: event.eventType,
        senderId: event.senderId,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        eventId: webhookEvent.eventId,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Event processing failed:', error);
      
      // Update subscription statistics
      await this.updateSubscriptionStats(event.accountId, {
        success: false,
        processingTime: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Update subscription statistics
   */
  async updateSubscriptionStats(accountId, eventData) {
    try {
      const subscription = await WebhookSubscription.getActiveByAccount(accountId);
      if (subscription) {
        await subscription.updateStats(eventData);
      }
    } catch (error) {
      console.error('❌ Failed to update subscription stats:', error);
    }
  }

  /**
   * Add event to processing queue
   */
  addToQueue(webhookEvent) {
    this.processingQueue.push(webhookEvent);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process events in queue
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, this.batchSize);
        
        console.log(`🔄 Processing batch of ${batch.length} events`);
        
        // Process batch in parallel
        const promises = batch.map(event => this.processQueuedEvent(event));
        await Promise.allSettled(promises);
        
        // Small delay between batches
        if (this.processingQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('❌ Queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual queued event
   */
  async processQueuedEvent(webhookEvent) {
    try {
      // Mark as processing
      webhookEvent.processedStatus = 'processing';
      await webhookEvent.save();

      // Simulate processing (replace with actual business logic)
      await this.executeBusinessLogic(webhookEvent);

      // Mark as completed
      await webhookEvent.markAsProcessed();

      console.log('✅ Queued event processed:', webhookEvent.eventId);

    } catch (error) {
      console.error('❌ Queued event processing failed:', error);
      
      // Mark as failed
      await webhookEvent.markAsFailed(error.message);
      
      // Retry logic
      if (webhookEvent.processingAttempts < this.maxRetries) {
        setTimeout(() => {
          webhookEvent.retry();
          this.addToQueue(webhookEvent);
        }, this.retryDelay * (webhookEvent.processingAttempts + 1));
      }
    }
  }

  /**
   * Execute business logic for webhook event
   */
  async executeBusinessLogic(webhookEvent) {
    // This is where you'd implement your business logic
    // For example: send notifications, update databases, trigger workflows, etc.
    
    switch (webhookEvent.eventType) {
      case 'messages':
        await this.handleNewMessage(webhookEvent);
        break;
      
      case 'comments':
        await this.handleNewComment(webhookEvent);
        break;
      
      case 'mentions':
        await this.handleNewMention(webhookEvent);
        break;
      
      default:
        console.log(`ℹ️ No specific handler for event type: ${webhookEvent.eventType}`);
    }
  }

  /**
   * Handle new message events
   */
  async handleNewMessage(webhookEvent) {
    console.log('💬 Processing new message:', {
      sender: webhookEvent.userInfo.username,
      content: webhookEvent.content.text?.substring(0, 50) + '...'
    });
    
    // Add your message handling logic here
    // For example: update conversation, send notifications, etc.
  }

  /**
   * Handle new comment events
   */
  async handleNewComment(webhookEvent) {
    console.log('💭 Processing new comment:', {
      sender: webhookEvent.userInfo.username,
      content: webhookEvent.content.text?.substring(0, 50) + '...'
    });
    
    // Add your comment handling logic here
  }

  /**
   * Handle new mention events
   */
  async handleNewMention(webhookEvent) {
    console.log('📢 Processing new mention:', {
      sender: webhookEvent.userInfo.username,
      content: webhookEvent.content.text?.substring(0, 50) + '...'
    });
    
    // Add your mention handling logic here
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
      retryDelay: this.retryDelay,
      maxRetries: this.maxRetries
    };
  }
}

module.exports = new WebhookProcessor();
