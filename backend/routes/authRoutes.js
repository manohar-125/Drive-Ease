const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Application = require('../models/Application');
const DigiLocker = require('../models/DigiLocker');
const DigiLockerService = require('../services/digilockerService');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/photos/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.digilockerID}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, and PNG formats are allowed'));
    }
    cb(null, true);
  }
});

router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const { password, digilockerID, email, phone, address, licenseType, photoData } = req.body;
    
    // Support both file upload and Base64
    const hasPhoto = req.file || photoData;
    
    if (!password || !digilockerID || !email || !phone || !address || !licenseType || !hasPhoto) {
      return res.status(400).json({
        success: false,
        message: 'All fields including photo are required'
      });
    }

    const existingApplication = await Application.findOne({ digilocker: digilockerID });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID already registered. A user can only register once.'
      });
    }

    const digilockerData = await DigiLockerService.getUserData(digilockerID);
    if (!digilockerData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DigiLocker ID'
      });
    }

    const application = new Application({
      password,
      digilocker: digilockerID,
      isDigilockerVerified: true,
      fullName: digilockerData.fullName,
      fatherName: digilockerData.fatherName,
      dateOfBirth: digilockerData.dateOfBirth,
      gender: digilockerData.gender,
      phone,
      isPhoneVerified: true,
      email,
      address,
      state: digilockerData.state || '',
      district: digilockerData.city || '',
      pincode: digilockerData.pincode || '',
      applicationType: licenseType,
      photoPath: req.file ? req.file.path : null,
      photoData: photoData || null, // Store Base64 image
      photoUploaded: true,
      photoUploadDate: new Date(),
      registrationComplete: true,
      colorTestDate: null,
      learnerTestDate: null,
      colorVisionTestCompleted: false,
      learnerTestCompleted: false,
      roadTestCompleted: false,
      paymentStatus: 'pending',
      applicationStatus: 'draft'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your Application Number is your username.',
      data: {
        applicationNumber: application.applicationNumber,
        fullName: application.fullName,
        email: application.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { applicationNumber, password } = req.body;

    if (!applicationNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Application Number and password are required'
      });
    }

    const application = await Application.findOne({ applicationNumber });

    if (!application) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, application.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const digilockerData = await DigiLocker.findOne({ digilockerID: application.digilocker });

    const responseData = {
      applicationNumber: application.applicationNumber,
      fullName: application.fullName,
      email: application.email,
      digilockerID: application.digilocker,
      userData: digilockerData ? {
        fullName: digilockerData.fullName,
        dateOfBirth: digilockerData.dateOfBirth,
        gender: digilockerData.gender,
        bloodGroup: digilockerData.bloodGroup,
        fatherName: digilockerData.fatherName
      } : {},
      hasExistingApplication: true,
      applicationData: application
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: responseData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

module.exports = router;