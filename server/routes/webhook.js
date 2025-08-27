const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const InstagramUser = require('../models/InstagramUser')
const FlowEngine = require('../engine/flowEngine')

// Instagram webhook verification (GET request)
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Instagram webhook verified successfully')
    res.status(200).send(challenge)
  } else {
    console.log('❌ Instagram webhook verification failed')
    res.sendStatus(403)
  }
})

// Instagram webhook events (POST request)
router.post('/instagram', async (req, res) => {
  try {
    const body = req.body

    // Check if this is a page webhook
    if (body.object === 'page') {
      // Process each entry
      for (const entry of body.entry) {
        const pageId = entry.id
        const time = entry.time

        // Process messaging events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await processMessagingEvent(messagingEvent, pageId)
          }
        }

        // Process standby events (when page is not active)
        if (entry.standby) {
          for (const standbyEvent of entry.standby) {
            await processStandbyEvent(standbyEvent, pageId)
          }
        }
      }

      res.sendStatus(200)
    } else {
      res.sendStatus(404)
    }
  } catch (error) {
    console.error('❌ Instagram webhook processing error:', error)
    res.sendStatus(500)
  }
})

// Process messaging events (when user sends message to page)
async function processMessagingEvent(messagingEvent, pageId) {
  const senderId = messagingEvent.sender.id
  const recipientId = messagingEvent.recipient.id
  const timestamp = messagingEvent.timestamp

  // Handle text messages
  if (messagingEvent.message && messagingEvent.message.text) {
    const messageText = messagingEvent.message.text
    const messageId = messagingEvent.message.mid

    console.log(`📱 Instagram message received from ${senderId}: ${messageText}`)

    // Find the Instagram user by page ID
    const instagramUser = await InstagramUser.findOne({ pageId: pageId })
    
    if (!instagramUser) {
      console.log(`⚠️ No Instagram user found for page ID: ${pageId}`)
      return
    }

    // Save message to database
    const newMessage = new Message({
      sender: `Instagram User (${senderId.slice(0, 8)}...)`,
      content: messageText,
      userId: instagramUser.userId,
      timestamp: new Date(timestamp * 1000),
      room: 'instagram',
      source: 'instagram',
      isFromInstagram: true,
      instagramSenderId: senderId,
      instagramMessageId: messageId,
      instagramThreadId: senderId // Use sender ID as thread ID for now
    })

    await newMessage.save()
    console.log(`💾 Instagram message saved to database: ${newMessage._id}`)

    // Run automation flows for this message
    try {
      const flowEngine = new FlowEngine()
      const automationResult = await flowEngine.runAutomation(instagramUser.userId, messageText)
      
      if (automationResult.success) {
        console.log(`🤖 Automation executed: ${automationResult.message}`)
        
        // Check if any message nodes were triggered and send replies
        for (const flowResult of automationResult.results) {
          if (flowResult.result && flowResult.result.type === 'message') {
            console.log(`💬 Auto-reply triggered: ${flowResult.result.content}`)
            
            // TODO: Send actual Instagram message via Meta API
            // For now, we'll just log it
            // await sendInstagramMessage(senderId, flowResult.result.content)
          }
        }
      } else {
        console.log(`⚠️ No automation flows found or error: ${automationResult.message}`)
      }
    } catch (error) {
      console.error('❌ Error running automation:', error)
    }

    // TODO: Emit via Socket.io to update frontend in real-time
    // This will be implemented in the main server.js file
  }

  // Handle postback events (button clicks, etc.)
  if (messagingEvent.postback) {
    console.log(`🔘 Instagram postback received from ${senderId}: ${messagingEvent.postback.payload}`)
  }
}

// Process standby events (when page is not active)
async function processStandbyEvent(standbyEvent, pageId) {
  // Handle events when the page is not actively being used
  // This could include message delivery receipts, read receipts, etc.
  console.log(`⏸️ Instagram standby event for page ${pageId}:`, standbyEvent.type)
}

// Test webhook endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    meta: {
      verifyToken: process.env.META_VERIFY_TOKEN ? 'Set' : 'Not set',
      appId: process.env.META_APP_ID ? 'Set' : 'Not set',
      appSecret: process.env.META_APP_SECRET ? 'Set' : 'Not set'
    }
  })
})

module.exports = router
