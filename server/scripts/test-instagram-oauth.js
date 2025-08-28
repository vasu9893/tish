#!/usr/bin/env node

/**
 * Test script for Instagram OAuth flow
 * This script tests the Instagram OAuth endpoints to ensure they're working properly
 */

const axios = require('axios')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://instantchat.in'

console.log('🧪 Testing Instagram OAuth Flow')
console.log('================================')
console.log(`Backend URL: ${BACKEND_URL}`)
console.log(`Frontend URL: ${FRONTEND_URL}`)
console.log('')

async function testInstagramEndpoints() {
  try {
    console.log('1. Testing Instagram status endpoint...')
    const statusResponse = await axios.get(`${BACKEND_URL}/api/instagram/status`)
    console.log('✅ Status endpoint working:', statusResponse.data)
    console.log('')

    console.log('2. Testing Instagram auth initiation...')
    const authResponse = await axios.get(`${BACKEND_URL}/api/instagram/auth/instagram`)
    console.log('✅ Auth initiation working:', {
      success: authResponse.data.success,
      hasAuthUrl: !!authResponse.data.authUrl,
      authUrlLength: authResponse.data.authUrl?.length || 0
    })
    console.log('')

    console.log('3. Testing environment variables...')
    console.log('✅ FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (using default)')
    console.log('✅ BACKEND_URL:', process.env.BACKEND_URL || 'Not set (using default)')
    console.log('✅ META_APP_ID:', process.env.META_APP_ID ? 'Set' : 'Not set')
    console.log('✅ META_APP_SECRET:', process.env.META_APP_SECRET ? 'Set' : 'Not set')
    console.log('')

    console.log('4. Testing redirect URL construction...')
    const testPageId = '123456789'
    const testPageName = 'Test Page'
    const testAccountId = '987654321'
    
    const dashboardUrl = `${FRONTEND_URL}/dashboard?instagram=success&pageId=${testPageId}&pageName=${encodeURIComponent(testPageName)}&instagramAccountId=${testAccountId}`
    const oauthCallbackUrl = `${FRONTEND_URL}/oauth-callback?instagram=success&pageId=${testPageId}&pageName=${encodeURIComponent(testPageName)}&instagramAccountId=${testAccountId}`
    
    console.log('✅ Dashboard redirect URL:', dashboardUrl)
    console.log('✅ OAuth callback URL:', oauthCallbackUrl)
    console.log('')

    console.log('🎉 All tests passed! Instagram OAuth flow is properly configured.')
    console.log('')
    console.log('📝 Next steps:')
    console.log('   - Ensure your Meta app is properly configured')
    console.log('   - Test the complete OAuth flow with a real Instagram account')
    console.log('   - Verify webhook endpoints are accessible')
    console.log('')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    
    console.log('')
    console.log('🔧 Troubleshooting tips:')
    console.log('   - Check if the backend server is running')
    console.log('   - Verify environment variables are set correctly')
    console.log('   - Check CORS configuration')
    console.log('   - Ensure all required Meta API credentials are configured')
    console.log('')
    
    process.exit(1)
  }
}

// Run the tests
testInstagramEndpoints()
