// Test script to verify the user ID filtering fix
// This simulates the exact scenario from your logs

console.log('🧪 Testing User ID Filtering Fix\n');

// Simulate the exact API response structure you mentioned
const mockApiResponse = {
  "count": 6,
  "results": [
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449188",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "VRT",
      "status": "pending",
      "user_email": "user@example.com"
    },
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449189",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "HJYU",
      "status": "pending",
      "user_email": "user@example.com"
    },
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449190",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "TEST123",
      "status": "approved",
      "user_email": "user@example.com"
    },
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449191",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "MYCOMPANY",
      "status": "pending",
      "user_email": "user@example.com"
    },
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449192",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "SMSAPI",
      "status": "rejected",
      "user_email": "user@example.com"
    },
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449193",
      "user": 62,
      "user_id": 62,
      "requested_sender_id": "FINALTEST",
      "status": "pending",
      "user_email": "user@example.com"
    }
  ]
};

// Simulate current user ID (this is what you need to check in your app)
const currentUserId = 62;

console.log('📊 API Response:');
console.log('Total requests in API:', mockApiResponse.results.length);
console.log('Current User ID:', currentUserId);
console.log('');

// Test the OLD (broken) filtering logic
console.log('❌ OLD Filtering Logic (broken):');
const oldFilteredResults = mockApiResponse.results.filter((request) => {
  // OLD way - only checking request.user_id
  const requestUserId = request.user_id;
  const isCurrentUser = requestUserId === currentUserId;
  
  console.log(`Request ${request.requested_sender_id}: user_id=${requestUserId}, current=${currentUserId}, match=${isCurrentUser}`);
  
  return isCurrentUser;
});
console.log('OLD Filtered results count:', oldFilteredResults.length);
console.log('');

// Test the NEW (fixed) filtering logic
console.log('✅ NEW Filtering Logic (fixed):');
const newFilteredResults = mockApiResponse.results.filter((request) => {
  // NEW way - try both user_id and user fields
  const requestUserId = request.user_id || request.user;
  const isCurrentUser = requestUserId === currentUserId;
  
  console.log(`Request ${request.requested_sender_id}: user_id=${request.user_id}, user=${request.user}, extracted=${requestUserId}, current=${currentUserId}, match=${isCurrentUser}`);
  
  return isCurrentUser;
});
console.log('NEW Filtered results count:', newFilteredResults.length);
console.log('');

// Test edge cases
console.log('🔍 Testing Edge Cases:');
const edgeCases = [
  { user: 62, user_id: undefined, description: 'Only user field' },
  { user: undefined, user_id: 62, description: 'Only user_id field' },
  { user: 62, user_id: 62, description: 'Both fields present' },
  { user: 77, user_id: 62, description: 'Different values' },
  { user: undefined, user_id: undefined, description: 'Both undefined' }
];

edgeCases.forEach((testCase, index) => {
  const requestUserId = testCase.user_id || testCase.user;
  const isMatch = requestUserId === currentUserId;
  
  console.log(`  Test ${index + 1} (${testCase.description}): user=${testCase.user}, user_id=${testCase.user_id}, extracted=${requestUserId}, match=${isMatch ? '✅' : '❌'}`);
});

console.log('\n🎯 Expected Results:');
console.log('✅ After the fix, you should see all 6 requests displayed');
console.log('✅ The debug logs should show: "✅ Keeping request from current user" for each request');
console.log('✅ No more "Filtering out request from other user" messages');
console.log('✅ Filtered results count should be 6, not 0');

console.log('\n🔧 To Test in Your App:');
console.log('1. Refresh your frontend page');
console.log('2. Open browser console (F12)');
console.log('3. Look for the debug logs showing the comparison');
console.log('4. You should see all 6 requests displayed');

