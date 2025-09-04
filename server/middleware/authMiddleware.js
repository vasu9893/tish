const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    console.log('🔐 Auth Middleware Debug:', {
      timestamp: new Date().toISOString(),
      hasAuthorizationHeader: !!req.header('Authorization'),
      rawToken: req.header('Authorization'),
      extractedToken: token,
      tokenLength: token ? token.length : 0,
      tokenStartsWith: token ? token.substring(0, 20) + '...' : 'none'
    })
    
    if (!token) {
      console.log('❌ No token provided')
      return res.status(401).json({ 
        success: false,
        error: 'No token, authorization denied' 
      })
    }


    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
      
      if (!decoded.user || !decoded.user.id) {
        console.log('❌ Invalid token structure')
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token structure' 
        })
      }

      // Set user info in request
      req.user = {
        id: decoded.user.id,
        username: decoded.user.username,
        email: decoded.user.email
      }
      
      console.log('✅ JWT token verified successfully for user:', req.user.id)
      next()
      
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', {
        error: jwtError.message,
        name: jwtError.name,
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
      })
      
      // Check if it's an expired token
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired',
          details: jwtError.message
        })
      }
      
      // Check if it's an invalid token
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token',
          details: jwtError.message
        })
      }
      
      // Check if it's a malformed token
      if (jwtError.name === 'JsonWebTokenError' && jwtError.message.includes('malformed')) {
        return res.status(401).json({ 
          success: false,
          error: 'Malformed token',
          details: 'The token format is invalid. Please login again.'
        })
      }
      
      // Other JWT errors
      return res.status(401).json({ 
        success: false,
        error: 'Token verification failed',
        details: jwtError.message
      })
    }
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error' 
    })
  }
}

module.exports = authMiddleware
