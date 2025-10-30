const mongoose = require('mongoose');
const DigiLocker = require('./models/DigiLocker');
require('dotenv').config();

// Sample DigiLocker data that will be stored in database
const digilockerData = [
  {
    digilockerID: "DL123456789",
    fullName: "Rahul Sharma",
    fatherName: "Suresh Sharma",
    dateOfBirth: "1995-03-15",
    gender: "Male",
    phone: "9876543210",
    email: "rahul.sharma@gmail.com",
    address: "123 MG Road, Sector 14",
    city: "Gurgaon",
    state: "Haryana",
    pincode: "122001"
  },
  {
    digilockerID: "DL987654321",
    fullName: "Priya Patel",
    fatherName: "Ramesh Patel",
    dateOfBirth: "1998-07-22",
    gender: "Female",
    phone: "8765432109",
    email: "priya.patel@yahoo.com",
    address: "456 SG Highway, Bopal",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380058"
  },
  {
    digilockerID: "DL456789123",
    fullName: "Arjun Kumar",
    fatherName: "Mohan Kumar",
    dateOfBirth: "1992-11-08",
    gender: "Male",
    phone: "7654321098",
    email: "arjun.kumar@hotmail.com",
    address: "789 Brigade Road, MG Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001"
  },
  {
    digilockerID: "DL321654987",
    fullName: "Sneha Reddy",
    fatherName: "Venkat Reddy",
    dateOfBirth: "1996-05-12",
    gender: "Female",
    phone: "6543210987",
    email: "sneha.reddy@gmail.com",
    address: "321 Banjara Hills, Road No 12",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500034"
  },
  {
    digilockerID: "DL789123456",
    fullName: "Vikram Singh",
    fatherName: "Rajesh Singh",
    dateOfBirth: "1994-09-30",
    gender: "Male",
    phone: "5432109876",
    email: "vikram.singh@rediffmail.com",
    address: "567 Connaught Place, CP",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001"
  },
  {
    digilockerID: "DL654987321",
    fullName: "Ananya Gupta",
    fatherName: "Ashok Gupta",
    dateOfBirth: "1999-12-18",
    gender: "Female",
    phone: "4321098765",
    email: "ananya.gupta@outlook.com",
    address: "890 Park Street, Central Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700016"
  },
  {
    digilockerID: "DL147258369",
    fullName: "Rohan Joshi",
    fatherName: "Prakash Joshi",
    dateOfBirth: "1993-04-25",
    gender: "Male",
    phone: "3210987654",
    email: "rohan.joshi@gmail.com",
    address: "234 FC Road, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411005"
  },
  {
    digilockerID: "DL963852741",
    fullName: "Kavya Nair",
    fatherName: "Suresh Nair",
    dateOfBirth: "1997-08-14",
    gender: "Female",
    phone: "2109876543",
    email: "kavya.nair@yahoo.in",
    address: "678 Marine Drive, Fort Kochi",
    city: "Kochi",
    state: "Kerala",
    pincode: "682001"
  },
  {
    digilockerID: "DL852741963",
    fullName: "Aditya Agarwal",
    fatherName: "Rajesh Agarwal",
    dateOfBirth: "1991-06-07",
    gender: "Male",
    phone: "1098765432",
    email: "aditya.agarwal@gmail.com",
    address: "345 MI Road, C-Scheme",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001"
  },
  {
    digilockerID: "DL741852963",
    fullName: "Meera Iyer",
    fatherName: "Krishnan Iyer",
    dateOfBirth: "2000-01-28",
    gender: "Female",
    phone: "0987654321",
    email: "meera.iyer@rediff.com",
    address: "456 T Nagar, South Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600017"
  }
];

async function populateDigiLockerDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drive-ease');
    console.log('Connected to MongoDB');

    // Clear existing data
    await DigiLocker.deleteMany({});
    console.log('Cleared existing DigiLocker data');

    // Insert new data
    const result = await DigiLocker.insertMany(digilockerData);
    console.log(`Successfully inserted ${result.length} DigiLocker records`);

    // Display the inserted data
    console.log('\nInserted DigiLocker Records:');
    result.forEach((record, index) => {
      console.log(`${index + 1}. ${record.digilockerID} - ${record.fullName}`);
    });

    console.log('\nDigiLocker database population completed!');
    
  } catch (error) {
    console.error('Error populating DigiLocker database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the population script
populateDigiLockerDatabase();