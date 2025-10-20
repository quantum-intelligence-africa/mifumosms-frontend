// Test script to verify API integration
// Run this with: node test-api-integration.js

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testSenderRequestAPI() {
  console.log('🧪 Testing Sender Request API Integration...\n');

  // Test 1: Check if stats endpoint works
  console.log('1. Testing GET /api/messaging/sender-requests/stats/');
  try {
    const statsResponse = await fetch(`${API_BASE_URL}/messaging/sender-requests/stats/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add a valid token here for authenticated requests
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    console.log(`   Status: ${statsResponse.status}`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('   ✅ Stats endpoint working');
      console.log('   Response:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('   ❌ Stats endpoint failed');
      const errorText = await statsResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  console.log('\n2. Testing POST /api/messaging/sender-requests/submit/ (with required fields)');
  try {
    const submitData = {
      requested_sender_id: 'TEST-SMS',
      sample_content: 'This is a test message for our SMS service'
    };

    const submitResponse = await fetch(`${API_BASE_URL}/messaging/sender-requests/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add a valid token here for authenticated requests
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(submitData)
    });

    console.log(`   Status: ${submitResponse.status}`);
    if (submitResponse.ok) {
      const submitData = await submitResponse.json();
      console.log('   ✅ Submit endpoint working with required fields');
      console.log('   Response:', JSON.stringify(submitData, null, 2));
    } else {
      console.log('   ❌ Submit endpoint failed');
      const errorText = await submitResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  console.log('\n3. Testing POST /api/messaging/sender-requests/submit/ (missing sample_content)');
  try {
    const submitData = {
      requested_sender_id: 'TEST-SMS-2'
      // Missing sample_content field
    };

    const submitResponse = await fetch(`${API_BASE_URL}/messaging/sender-requests/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add a valid token here for authenticated requests
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(submitData)
    });

    console.log(`   Status: ${submitResponse.status}`);
    if (submitResponse.status === 400) {
      console.log('   ✅ Correctly returns 400 for missing sample_content');
      const errorData = await submitResponse.json();
      console.log('   Error response:', JSON.stringify(errorData, null, 2));
    } else {
      console.log('   ⚠️  Unexpected status - should be 400 for missing required field');
      const responseText = await submitResponse.text();
      console.log('   Response:', responseText);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   - If all tests show ✅, your API integration is working correctly');
  console.log('   - If you see ❌, check your backend server is running on 127.0.0.1:8000');
  console.log('   - For authenticated endpoints, add a valid Bearer token to the headers');
  console.log('   - The frontend should now work with the simplified API calls (no business_justification required)');
}

// Run the test
testSenderRequestAPI().catch(console.error);
