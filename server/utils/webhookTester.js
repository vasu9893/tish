const crypto = require('crypto');
const { config: webhookConfig } = require('../config/webhooks');

class WebhookTester {
  constructor() {
    this.testEvents = new Map();
    this.testResults = new Map();
  }

  /**
   * Generate a test webhook signature
   */
  generateSignature(payload, appSecret) {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Create a test Instagram comment event
   */
  createCommentEvent(accountId, commentId, mediaId, userId, username, text) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [{
          field: 'comments',
          value: {
            id: commentId,
            text: text,
            from: {
              id: userId,
              username: username
            },
            media: {
              id: mediaId,
              type: 'IMAGE'
            },
            timestamp: Math.floor(Date.now() / 1000)
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram message event
   */
  createMessageEvent(accountId, messageId, senderId, senderUsername, text, isEcho = false) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: accountId
          },
          timestamp: Math.floor(Date.now() / 1000),
          message: {
            mid: messageId,
            text: text,
            is_echo: isEcho
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram mention event
   */
  createMentionEvent(accountId, mediaId, userId, username, caption) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [{
          field: 'mentions',
          value: {
            id: mediaId,
            caption: caption,
            from: {
              id: userId,
              username: username
            },
            timestamp: Math.floor(Date.now() / 1000)
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram live comment event
   */
  createLiveCommentEvent(accountId, liveId, commentId, userId, username, text) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [{
          field: 'live_comments',
          value: {
            id: commentId,
            text: text,
            from: {
              id: userId,
              username: username
            },
            live_media: {
              id: liveId,
              type: 'LIVE'
            },
            timestamp: Math.floor(Date.now() / 1000)
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram message reaction event
   */
  createMessageReactionEvent(accountId, messageId, senderId, reaction) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: accountId
          },
          timestamp: Math.floor(Date.now() / 1000),
          reaction: {
            mid: messageId,
            action: reaction,
            reaction: reaction
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram message postback event
   */
  createMessagePostbackEvent(accountId, senderId, payload, title) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: accountId
          },
          timestamp: Math.floor(Date.now() / 1000),
          postback: {
            payload: payload,
            title: title
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram message referral event
   */
  createMessageReferralEvent(accountId, senderId, ref, source, type) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: accountId
          },
          timestamp: Math.floor(Date.now() / 1000),
          referral: {
            ref: ref,
            source: source,
            type: type
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a test Instagram message seen event
   */
  createMessageSeenEvent(accountId, senderId, watermark) {
    const event = {
      object: 'instagram',
      entry: [{
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: accountId
          },
          timestamp: Math.floor(Date.now() / 1000),
          read: {
            watermark: watermark
          }
        }]
      }]
    };

    return {
      event,
      signature: this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
      headers: {
        'X-Hub-Signature-256': this.generateSignature(JSON.stringify(event), webhookConfig.meta.appSecret),
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Create a comprehensive test suite
   */
  createTestSuite(accountId, senderId, senderUsername) {
    const testSuite = {
      id: `test_suite_${Date.now()}`,
      timestamp: new Date(),
      accountId,
      senderId,
      senderUsername,
      tests: []
    };

    // Comment event
    testSuite.tests.push({
      name: 'Instagram Comment Event',
      type: 'comments',
      event: this.createCommentEvent(
        accountId,
        `comment_${Date.now()}`,
        `media_${Date.now()}`,
        senderId,
        senderUsername,
        'This is a test comment! 🚀'
      )
    });

    // Message event
    testSuite.tests.push({
      name: 'Instagram Message Event',
      type: 'messages',
      event: this.createMessageEvent(
        accountId,
        `msg_${Date.now()}`,
        senderId,
        senderUsername,
        'Hello! This is a test message from the webhook tester.'
      )
    });

    // Mention event
    testSuite.tests.push({
      name: 'Instagram Mention Event',
      type: 'mentions',
      event: this.createMentionEvent(
        accountId,
        `media_${Date.now()}`,
        senderId,
        senderUsername,
        'Check out this awesome post! @instantchat'
      )
    });

    // Live comment event
    testSuite.tests.push({
      name: 'Instagram Live Comment Event',
      type: 'live_comments',
      event: this.createLiveCommentEvent(
        accountId,
        `live_${Date.now()}`,
        `comment_${Date.now()}`,
        senderId,
        senderUsername,
        'Amazing live stream! 🔥'
      )
    });

    // Message reaction event
    testSuite.tests.push({
      name: 'Instagram Message Reaction Event',
      type: 'message_reactions',
      event: this.createMessageReactionEvent(
        accountId,
        `msg_${Date.now()}`,
        senderId,
        '❤️'
      )
    });

    // Message postback event
    testSuite.tests.push({
      name: 'Instagram Message Postback Event',
      type: 'message_postbacks',
      event: this.createMessagePostbackEvent(
        accountId,
        senderId,
        'GET_STARTED',
        'Get Started'
      )
    });

    // Message referral event
    testSuite.tests.push({
      name: 'Instagram Message Referral Event',
      type: 'message_referrals',
      event: this.createMessageReferralEvent(
        accountId,
        senderId,
        'ref_code_123',
        'SHORTLINK',
        'OPEN_THREAD'
      )
    });

    // Message seen event
    testSuite.tests.push({
      name: 'Instagram Message Seen Event',
      type: 'message_seen',
      event: this.createMessageSeenEvent(
        accountId,
        senderId,
        Math.floor(Date.now() / 1000)
      )
    });

    return testSuite;
  }

  /**
   * Execute a test suite
   */
  async executeTestSuite(testSuite, webhookUrl) {
    const results = {
      suiteId: testSuite.id,
      timestamp: new Date(),
      totalTests: testSuite.tests.length,
      passed: 0,
      failed: 0,
      results: []
    };

    console.log(`🧪 Executing test suite: ${testSuite.id}`);

    for (const test of testSuite.tests) {
      try {
        console.log(`  Testing: ${test.name}`);
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: test.event.headers,
          body: JSON.stringify(test.event.event)
        });

        const responseData = await response.text();
        let parsedData;
        
        try {
          parsedData = JSON.parse(responseData);
        } catch (e) {
          parsedData = { raw: responseData };
        }

        const testResult = {
          name: test.name,
          type: test.type,
          status: response.ok ? 'passed' : 'failed',
          statusCode: response.status,
          response: parsedData,
          timestamp: new Date()
        };

        if (response.ok) {
          results.passed++;
          console.log(`    ✅ ${test.name} - PASSED`);
        } else {
          results.failed++;
          console.log(`    ❌ ${test.name} - FAILED (${response.status})`);
        }

        results.results.push(testResult);

      } catch (error) {
        console.error(`    ❌ ${test.name} - ERROR:`, error.message);
        
        results.failed++;
        results.results.push({
          name: test.name,
          type: test.type,
          status: 'error',
          error: error.message,
          timestamp: new Date()
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🧪 Test suite completed: ${results.passed}/${results.totalTests} passed`);
    
    // Store test results
    this.testResults.set(testSuite.id, results);
    
    return results;
  }

  /**
   * Get test suite by ID
   */
  getTestSuite(suiteId) {
    return this.testEvents.get(suiteId);
  }

  /**
   * Get test results by suite ID
   */
  getTestResults(suiteId) {
    return this.testResults.get(suiteId);
  }

  /**
   * Get all test suites
   */
  getAllTestSuites() {
    return Array.from(this.testEvents.values());
  }

  /**
   * Get all test results
   */
  getAllTestResults() {
    return Array.from(this.testResults.values());
  }

  /**
   * Clean up old test data
   */
  cleanupOldData() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Cleanup old test events
    for (const [suiteId, suite] of this.testEvents.entries()) {
      if (suite.timestamp < oneDayAgo) {
        this.testEvents.delete(suiteId);
      }
    }

    // Cleanup old test results
    for (const [suiteId, results] of this.testResults.entries()) {
      if (results.timestamp < oneDayAgo) {
        this.testResults.delete(suiteId);
      }
    }

    console.log('🧹 Cleaned up old webhook test data');
  }
}

module.exports = new WebhookTester();
