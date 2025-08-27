const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const Message = require('../models/Message')

// @route   GET /api/messages
// @desc    Get all messages
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(50)
    
    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/messages/:room
// @desc    Get messages by room
// @access  Private
router.get('/:room', authMiddleware, async (req, res) => {
  try {
    const { room } = req.params
    const { limit = 50, before } = req.query
    
    let query = { room }
    
    if (before) {
      query.timestamp = { $lt: new Date(before) }
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .sort({ timestamp: 1 }) // Re-sort for chronological order
    
    res.json(messages)
  } catch (error) {
    console.error('Get room messages error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/messages
// @desc    Create a new message
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, room = 'general' } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' })
    }
    
    const newMessage = new Message({
      sender: req.user.username,
      content: content.trim(),
      userId: req.user.id,
      room,
      timestamp: new Date()
    })
    
    const savedMessage = await newMessage.save()
    
    res.json(savedMessage)
  } catch (error) {
    console.error('Create message error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/messages/:id
// @desc    Update a message
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' })
    }
    
    const message = await Message.findById(id)
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }
    
    // Check if user owns the message
    if (message.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this message' })
    }
    
    message.content = content.trim()
    message.isEdited = true
    message.editedAt = new Date()
    
    const updatedMessage = await message.save()
    
    res.json(updatedMessage)
  } catch (error) {
    console.error('Update message error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    
    const message = await Message.findById(id)
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }
    
    // Check if user owns the message
    if (message.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' })
    }
    
    await Message.findByIdAndDelete(id)
    
    res.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
