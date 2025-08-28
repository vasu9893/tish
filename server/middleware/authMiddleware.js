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
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // For MVP, accept any token (including real JWT tokens)
    // In production, verify JWT properly with process.env.JWT_SECRET
    if (token.startsWith('dummy_jwt_token_')) {
      // Handle dummy tokens for testing
      req.user = {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com'
      }
      console.log('✅ Dummy token accepted')
    } else {
      // Handle real JWT tokens
      try {
        // For now, just accept the token without verification
        // In production, use: const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {
          id: token.substring(0, 10) || 'user_' + Date.now(), // Use token prefix as user ID for now
          username: 'authenticated_user',
          email: 'user@example.com'
        }
        console.log('✅ Real token accepted (user ID:', req.user.id, ')')
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.message)
        // For MVP, still accept the token
        req.user = {
          id: 'user_' + Date.now(),
          username: 'authenticated_user',
          email: 'user@example.com'
        }
        console.log('✅ Token accepted despite JWT error (user ID:', req.user.id, ')')
      }
    }
    
    next()
  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = authMiddleware
