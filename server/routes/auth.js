const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide username and password' 
      })
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    })

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      })
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    })
  }
})

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide all required fields' 
      })
    }

    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists' 
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    })

    await user.save()

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Get user from auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated' 
      })
    }

    // Find user in database
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    })
  }
})

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ 
        success: false,
        error: 'Token is required' 
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    
    // Find user in database
    const user = await User.findById(decoded.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    })
  }
})

module.exports = router
