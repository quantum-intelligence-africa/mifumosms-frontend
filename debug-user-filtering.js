// Debug script to test user ID filtering logic
// This simulates the frontend filtering logic to help debug the issue

// Simulate API response data
const mockApiResponse = {
  "count": 1,
  "results": [
    {
      "id": "2615873f-eb7d-4677-8a61-62dffe449188",
      "user": 77,
      "user_id": 77,
      "requested_sender_id": "API2121",
      "status": "pending",
      "user_email": "apiresponse@example.com"
    }
  ]
};

// Simulate current user ID (this is what you need to check in your app)
const currentUserId = 77; // Change this to test different scenarios

console.log('🧪 Testing User ID Filtering Logic\n');

console.log('API Response:', JSON.stringify(mockApiResponse, null, 2));
console.log('Current User ID:', currentUserId, 'type:', typeof currentUserId);

// Test the filtering logic
const results = mockApiResponse.results;
console.log('\n📊 Filtering Results:');

const filteredResults = results.filter((request) => {
  // Try multiple possible user ID fields from the API response
  const requestUserId = request.user_id || request.user || request.created_by?.id || request.created_by;
  
  // Convert both IDs to numbers for comparison (API returns integers)
  const requestUserIdNum = Number(requestUserId);
  const currentUserIdNum = Number(currentUserId);
  const isCurrentUser = requestUserIdNum === currentUserIdNum;
  
  // Debug logging
  console.log(`\nRequest: ${request.requested_sender_id}`);
  console.log('  Request User ID (raw):', requestUserId, 'type:', typeof requestUserId);
  console.log('  Current User ID (raw):', currentUserId, 'type:', typeof currentUserId);
  console.log('  Request User ID (num):', requestUserIdNum);
  console.log('  Current User ID (num):', currentUserIdNum);
  console.log('  Is Current User:', isCurrentUser);
  
  if (!isCurrentUser) {
    console.log('  ❌ Filtering out request from other user');
  } else {
    console.log('  ✅ Keeping request from current user');
  }
  
  return isCurrentUser;
});

console.log('\n🎯 Final Results:');
console.log('Filtered results count:', filteredResults.length);
console.log('Filtered results:', filteredResults);

// Test different scenarios
console.log('\n🔍 Testing Different Scenarios:');

// Test 1: String vs Number comparison
console.log('\n1. String vs Number comparison:');
console.log('77 === 77:', 77 === 77);
console.log('"77" === 77:', "77" === 77);
console.log('77 === "77":', 77 === "77");
console.log('Number("77") === 77:', Number("77") === 77);

// Test 2: Different user IDs
console.log('\n2. Different user IDs:');
const testCases = [
  { requestUserId: 77, currentUserId: 77 },
  { requestUserId: "77", currentUserId: 77 },
  { requestUserId: 77, currentUserId: "77" },
  { requestUserId: "77", currentUserId: "77" },
  { requestUserId: 78, currentUserId: 77 },
  { requestUserId: undefined, currentUserId: 77 },
  { requestUserId: null, currentUserId: 77 }
];

testCases.forEach((testCase, index) => {
  const requestUserIdNum = Number(testCase.requestUserId);
  const currentUserIdNum = Number(testCase.currentUserId);
  const isMatch = requestUserIdNum === currentUserIdNum;
  
  console.log(`  Test ${index + 1}: requestUserId=${testCase.requestUserId} (${typeof testCase.requestUserId}), currentUserId=${testCase.currentUserId} (${typeof testCase.currentUserId}) -> ${isMatch ? '✅ Match' : '❌ No Match'}`);
});

console.log('\n💡 Recommendations:');
console.log('1. Check the browser console for the actual values');
console.log('2. Make sure currentUserId is not undefined or null');
console.log('3. Verify the API response structure matches what you expect');
console.log('4. If the API already filters by user, you might not need frontend filtering');

