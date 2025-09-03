const axios = require('axios');

async function fixInstagramUserID() {
  try {
    console.log('🔧 Fixing Instagram user ID mismatch...');
    console.log('⚠️  Note: This script requires a real JWT token from your authentication system.');
    console.log('   Please update the AUTH_TOKEN variable with a valid token from your login.');
    
    // TODO: Replace with your actual JWT token from authentication
    const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';
    
    if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
      console.log('❌ Please set AUTH_TOKEN to a valid JWT token from your login system');
      return;
    }
    
    const response = await axios.post(
      'https://tish-production.up.railway.app/api/instagram/debug/fix-user-id-mismatch',
      {},
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixInstagramUserID();


