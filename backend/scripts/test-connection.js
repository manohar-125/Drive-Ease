const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
async function testConnection() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drive-ease';
    console.log('Testing connection to:', dbUri);
    
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected Successfully');
    
    // Test if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test DigiLocker model
    const DigiLocker = require('./models/DigiLocker');
    const dlCount = await DigiLocker.countDocuments();
    console.log('DigiLocker entries:', dlCount);
    
    // Test Application model  
    const Application = require('./models/Application');
    const appCount = await Application.countDocuments();
    console.log('Application entries:', appCount);
    
    // Test specific lookup
    const testDL = await DigiLocker.findOne({ digilockerID: 'DL123456789' });
    console.log('Test DigiLocker lookup:', !!testDL);
    
    const testApp = await Application.findOne({ digilocker: 'DL123456789' });
    console.log('Test Application lookup:', !!testApp);
    
    if (testApp) {
      console.log('Application details:');
      console.log('  - ID:', testApp.digilocker);
      console.log('  - Name:', testApp.fullName);
      console.log('  - Status:', testApp.applicationStatus);
      console.log('  - Learner Test:', testApp.learnerTestCompleted);
    }
    
    console.log('All database connections working properly!');
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Connection closed');
  }
}

testConnection();