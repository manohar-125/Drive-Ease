/**
 * Color Vision Test - Unit Tests
 * Tests for POST /api/applications/complete-color-test
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:5001/api/applications';

// Test data
const validApplication = {
  applicationNumber: 'APP1729929091534850', // Replace with actual app number from DB
  digiLockerId: '123456789012'
};

// Test 1: Success case - all preconditions met
async function testSuccessCase() {
  console.log('\n✅ Test 1: Success case (valid preconditions)');
  try {
    const response = await axios.post(`${BASE_URL}/complete-color-test`, validApplication);
    console.log('✓ Status:', response.status);
    console.log('✓ Response:', response.data);
    return response.status === 200 && response.data.success === true;
  } catch (error) {
    console.log('✗ Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Double attempt (should fail with 409)
async function testDoubleAttempt() {
  console.log('\n⚠️  Test 2: Double attempt (should reject)');
  try {
    const response = await axios.post(`${BASE_URL}/complete-color-test`, validApplication);
    console.log('✗ Should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✓ Status: 409 (Conflict)');
      console.log('✓ Message:', error.response.data.message);
      return true;
    }
    console.log('✗ Wrong error:', error.response?.data);
    return false;
  }
}

// Test 3: Payment not completed (403)
async function testPaymentNotCompleted() {
  console.log('\n🚫 Test 3: Payment not completed (should reject with 403)');
  const unpaidApp = {
    applicationNumber: 'APP_UNPAID', // Replace with unpaid app number
    digiLockerId: '123456789012'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/complete-color-test`, unpaidApp);
    console.log('✗ Should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.log('✓ Status:', error.response.status);
      console.log('✓ Message:', error.response.data.message);
      return true;
    }
    console.log('✗ Wrong error:', error.response?.data);
    return false;
  }
}

// Test 4: Wrong date (422)
async function testWrongDate() {
  console.log('\n📅 Test 4: Wrong date (should reject with 422)');
  const wrongDateApp = {
    applicationNumber: 'APP_FUTURE_DATE', // Replace with future dated app
    digiLockerId: '123456789012'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/complete-color-test`, wrongDateApp);
    console.log('✗ Should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 422 || error.response?.status === 404) {
      console.log('✓ Status:', error.response.status);
      console.log('✓ Message:', error.response.data.message);
      return true;
    }
    console.log('✗ Wrong error:', error.response?.data);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('====================================');
  console.log('🧪 Color Vision Test - Unit Tests');
  console.log('====================================');
  
  const results = [];
  
  results.push(await testSuccessCase());
  results.push(await testDoubleAttempt());
  results.push(await testPaymentNotCompleted());
  results.push(await testWrongDate());
  
  console.log('\n====================================');
  console.log('📊 Test Results');
  console.log('====================================');
  console.log(`Passed: ${results.filter(r => r).length}/${results.length}`);
  console.log(`Failed: ${results.filter(r => !r).length}/${results.length}`);
  console.log('====================================\n');
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
