const mongoose = require('mongoose');
const DigiLocker = require('./models/DigiLocker');
const Application = require('./models/Application');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/drive-ease');
    console.log('✅ Connected to MongoDB');
    
    // Check DigiLocker data
    const digilockers = await DigiLocker.find({});
    console.log('📋 DigiLocker entries:', digilockers.length);
    
    // Check Application data
    const applications = await Application.find({});
    console.log('🗂️ Application entries:', applications.length);
    
    // Check for our test data specifically
    console.log('\n🔍 Looking for DL123456789...');
    const dlData = await DigiLocker.findOne({ digilockerID: 'DL123456789' });
    const appData = await Application.findOne({ digilocker: 'DL123456789' });
    
    console.log('DigiLocker DL123456789 found:', !!dlData);
    console.log('Application DL123456789 found:', !!appData);
    
    if (dlData) {
      console.log('DigiLocker data:', {
        id: dlData.digilockerID,
        name: dlData.fullName,
        fieldName: 'digilockerID'
      });
    }
    
    if (appData) {
      console.log('Application data:', {
        id: appData.digilocker,
        name: appData.fullName,
        status: appData.applicationStatus,
        learnerTestCompleted: appData.learnerTestCompleted,
        fieldName: 'digilocker'
      });
    }
    
    // Show the field name mismatch issue
    console.log('\n⚠️  ISSUE IDENTIFIED:');
    console.log('- DigiLocker model uses field: digilockerID');
    console.log('- Application model uses field: digilocker');
    console.log('- This causes lookup failures!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();