/**
 * CSRF State Utility for OAuth Security
 * Handles state parameter generation, parsing, and TTL validation
 */

const crypto = require('crypto')

/**
 * Create a secure state token with payload and TTL
 * @param {Object} payload - Data to encode in state (e.g., { next: '/dashboard', userId: '123' })
 * @param {number} ttlMinutes - Time to live in minutes (default: 10)
 * @returns {string} Encoded state token
 */
function createState(payload, ttlMinutes = 10) {
  const timestamp = Date.now()
  const expiresAt = timestamp + (ttlMinutes * 60 * 1000)
  
  const stateData = {
    ...payload,
    timestamp,
    expiresAt,
    nonce: crypto.randomBytes(16).toString('hex')
  }
  
  // Encode as base64 for URL safety
  const jsonString = JSON.stringify(stateData)
  return Buffer.from(jsonString).toString('base64')
}

/**
 * Parse and validate a state token
 * @param {string} state - Encoded state token
 * @returns {Object|null} Parsed state data or null if invalid/expired
 */
function parseState(state) {
  try {
    if (!state) return null
    
    // Decode from base64
    const jsonString = Buffer.from(state, 'base64').toString('utf8')
    const stateData = JSON.parse(jsonString)
    
    // Check if expired
    if (Date.now() > stateData.expiresAt) {
      console.log('State token expired:', { 
        tokenAge: Date.now() - stateData.timestamp,
        maxAge: stateData.expiresAt - stateData.timestamp 
      })
      return null
    }
    
    return stateData
  } catch (error) {
    console.error('Error parsing state token:', error)
    return null
  }
}

/**
 * Check if a state token is still valid (not expired)
 * @param {string} state - Encoded state token
 * @returns {boolean} True if valid, false if expired or invalid
 */
function checkTTL(state) {
  const stateData = parseState(state)
  return stateData !== null
}

/**
 * Extract specific data from state token
 * @param {string} state - Encoded state token
 * @param {string} key - Key to extract
 * @returns {any} Value of the key or undefined if not found
 */
function getStateValue(state, key) {
  const stateData = parseState(state)
  return stateData ? stateData[key] : undefined
}

module.exports = {
  createState,
  parseState,
  checkTTL,
  getStateValue
}
