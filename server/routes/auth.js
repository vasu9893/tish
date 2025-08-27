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
      return res.status(400).json({ message: 'Please provide username and password' })
    }

    // For MVP, we'll use dummy authentication
    // In production, verify against database
    if (username && password) {
      // Generate dummy JWT token
      const payload = {
        user: {
          id: '1',
          username: username,
          email: `${username}@example.com`
        }
      }

      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      )

      res.json({
        token,
        user: {
          id: '1',
          username: username,
          email: `${username}@example.com`
        }
      })
    } else {
      res.status(400).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
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
      return res.status(400).json({ message: 'Please provide all required fields' })
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] })
    if (user) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword
    })

    await user.save()

    // Generate JWT token
    const payload = {
      user: {
        id: user.id
      }
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // For MVP, return dummy user data
    // In production, get from req.user (set by auth middleware)
    res.json({
      user: {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com'
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
