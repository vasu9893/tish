const axios = require('axios');

async function fixInstagramUserID() {
  try {
    console.log('🔧 Fixing Instagram user ID mismatch...');
    
    const response = await axios.post(
      'https://tish-production.up.railway.app/api/instagram/debug/fix-user-id-mismatch',
      {},
      {
        headers: {
          'Authorization': 'Bearer dummy_jwt_token_1756',
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
