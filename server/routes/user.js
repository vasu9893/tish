const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
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
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user profile' 
    })
  }
})

// @route   PATCH /api/user/profile
// @desc    Update user profile
// @access  Private
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.user.id
    
    // Check if username or email already exists
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      })
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already taken' 
        })
      }
    }
    
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      })
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already registered' 
        })
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...(username && { username }),
        ...(email && { email }),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password')
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    })
  }
})

// @route   POST /api/user/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatarUrl } = req.body
    const userId = req.user.id
    
    if (!avatarUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Avatar URL is required' 
      })
    }
    
    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        avatarUrl,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password')
    
    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update avatar' 
    })
  }
})

// @route   POST /api/user/2fa/enable
// @desc    Enable 2FA for user
// @access  Private
router.post('/2fa/enable', authMiddleware, async (req, res) => {
  try {
    // For now, just return a placeholder response
    // In production, implement actual 2FA setup
    res.json({
      success: true,
      message: '2FA setup initiated',
      data: {
        qrCode: 'data:image/png;base64,placeholder',
        secret: 'placeholder-secret-key'
      }
    })
  } catch (error) {
    console.error('Enable 2FA error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to enable 2FA' 
    })
  }
})

// @route   POST /api/user/delete
// @desc    Delete user account
// @access  Private
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body
    const userId = req.user.id
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required to delete account' 
      })
    }
    
    // Verify password
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid password' 
      })
    }
    
    // Delete user (in production, you might want to soft delete)
    await User.findByIdAndDelete(userId)
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete account' 
    })
  }
})

module.exports = router
