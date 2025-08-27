const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // For MVP, we'll use a simple token check
    // In production, verify JWT properly
    if (token.startsWith('dummy_jwt_token_')) {
      req.user = {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com'
      }
      next()
    } else {
      return res.status(401).json({ message: 'Token is not valid' })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = authMiddleware
