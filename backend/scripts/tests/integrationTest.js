/**
 * Integration Test - Color Vision Test Flow
 * Simulates a complete user journey through Step 3
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/applications';

async function integrationTest() {
  console.log('🔄 Starting Integration Test...\n');

  try {
    // Step 1: Verify DigiLocker and get application
    console.log('1️⃣  Verifying DigiLocker...');
    const loginResponse = await axios.post(`${BASE_URL}/verify-digilocker`, {
      digiLockerId: '123456789012'
    });
    
    const application = loginResponse.data.existingApplication;
    console.log('✓ Application found:', application.applicationNumber);
    console.log('✓ Payment Status:', application.paymentStatus);
    console.log('✓ Color Test Date:', application.colorTestDate);
    console.log('✓ Already Completed:', application.colorVisionTestCompleted);

    // Step 2: Attempt Color Vision Test
    console.log('\n2️⃣  Attempting Color Vision Test...');
    const testResponse = await axios.post(`${BASE_URL}/complete-color-test`, {
      applicationNumber: application.applicationNumber,
      digiLockerId: '123456789012'
    });
    
    console.log('✓ Test Status:', testResponse.data.success ? 'PASSED' : 'FAILED');
    console.log('✓ Completion Date:', testResponse.data.colorVisionTestDate);
    console.log('✓ Message:', testResponse.data.message);

    // Step 3: Verify update in database
    console.log('\n3️⃣  Verifying database update...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-digilocker`, {
      digiLockerId: '123456789012'
    });
    
    const updatedApp = verifyResponse.data.existingApplication;
    console.log('✓ Color Test Completed:', updatedApp.colorVisionTestCompleted);
    console.log('✓ Color Test Date:', updatedApp.colorVisionTestDate);

    console.log('\n✅ Integration Test PASSED!\n');

  } catch (error) {
    console.error('\n❌ Integration Test FAILED!');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run test
integrationTest();
