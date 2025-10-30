const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const DigiLockerService = require('../services/digilockerService');
const otpVerificationService = require('../services/otpVerificationService');
const Holiday = require('../models/Holiday');
const DailyBooking = require('../models/DailyBooking');

// Generate OTP for phone verification
router.post('/otp/generate', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone number format (Indian mobile number)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const result = await otpVerificationService.generateOTPForPhone(phone);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        otp: result.otp, // In production, this should not be sent to frontend
        displayMessage: `OTP for verification: ${result.otp}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP for phone verification
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const result = await otpVerificationService.verifyOTPForPhone(phone, otp);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/verify-digilocker
// @desc    Verify DigiLocker ID and get user data
// @access  Public
router.post('/verify-digilocker', async (req, res) => {
  try {
    const { digilocker } = req.body;

    if (!digilocker) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    // First verify the DigiLocker ID exists in the system
    const verificationResult = await DigiLockerService.simulateVerification(digilocker.trim());

    // Check if user has an existing application (this is fine, they can still access dashboard)
    const existingApplication = await Application.findOne({ digilocker: digilocker.trim() });
    
    res.json({
      success: true,
      message: verificationResult.message,
      userData: verificationResult.userData,
      eligibility: verificationResult.eligibility,
      hasExistingApplication: !!existingApplication,
      applicationData: existingApplication || null
    });

  } catch (error) {
    console.error('Error verifying DigiLocker:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'DigiLocker verification failed'
    });
  }
});

// @route   POST /api/applications
// @desc    Submit new driving license application
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      digilocker,
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      state,
      district,
      pincode,
      applicationType,
      colorTestDate,
      learnerTestDate,
      isDigilockerVerified,
      isPhoneVerified,
      photoUploaded
    } = req.body;

    // Check if application with this DigiLocker ID already exists
    const existingApplication = await Application.findOne({ digilocker });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this DigiLocker ID. Please check your dashboard for the current status.'
      });
    }

    // Verify that the DigiLocker ID was already verified and get the verified data
    const digilockerData = await DigiLockerService.getUserData(digilocker);
    if (!digilockerData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DigiLocker ID. Please verify your DigiLocker ID first.'
      });
    }

    // Create new application with all required data
    const application = new Application({
      digilocker,
      isDigilockerVerified: isDigilockerVerified || true,
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      phone,
      isPhoneVerified: isPhoneVerified || false,
      email,
      address,
      state,
      district,
      pincode,
      applicationType,
      colorTestDate,
      learnerTestDate,
      photoUploaded: photoUploaded || false,
      applicationStatus: 'submitted',
      submissionDate: new Date()
    });

    const savedApplication = await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationNumber: savedApplication.applicationNumber,
        _id: savedApplication._id,
        email: savedApplication.email,
        applicationStatus: savedApplication.applicationStatus,
        submissionDate: savedApplication.submissionDate
      }
    });

  } catch (error) {
    console.error('Error creating application:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while submitting application'
    });
  }
});

// @route   GET /api/applications/valid-digilocker-ids

// @route   POST /api/applications/submit
// @desc    Submit enhanced application flow
// @access  Public
router.post('/submit', async (req, res) => {
  try {
    const {
      digilocker,
      phone,
      email,
      address,
      state,
      district,
      pincode,
      applicationType,
      colorTestDate,
      learnerTestDate,
      registrationComplete
    } = req.body;

    // For registration step (Step 1), we don't need test dates
    const isRegistrationOnly = registrationComplete && !colorTestDate && !learnerTestDate;

    // Validate required fields based on submission type
    if (isRegistrationOnly) {
      // Step 1: Registration validation - only basic fields required
      if (!digilocker || !email || !address || !state || !district || !pincode || !applicationType) {
        return res.status(400).json({
          success: false,
          message: 'Please provide: email, address, state, district, pincode, and vehicle type'
        });
      }
    } else {
      // Full application validation (when booking slots)
      if (!digilocker || !email || !address || !state || !district || !pincode || !applicationType || !colorTestDate || !learnerTestDate) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided including test dates'
        });
      }
    }

    // Check if application with this DigiLocker ID already exists
    let existingApplication = await Application.findOne({ digilocker });
    
    if (existingApplication && !isRegistrationOnly) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this DigiLocker ID.'
      });
    }

    // Get verified DigiLocker data
    const digilockerData = await DigiLockerService.getUserData(digilocker);
    if (!digilockerData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DigiLocker ID. Please verify your DigiLocker ID first.'
      });
    }

    if (existingApplication) {
      // Update existing application with registration data
      existingApplication.phone = phone;
      existingApplication.email = email;
      existingApplication.address = address;
      existingApplication.state = state;
      existingApplication.district = district;
      existingApplication.pincode = pincode;
      existingApplication.isPhoneVerified = true;
      existingApplication.photoUploaded = true;
      existingApplication.applicationStatus = 'registration_complete';
      
      if (applicationType) existingApplication.applicationType = applicationType;
      if (colorTestDate) existingApplication.colorTestDate = new Date(colorTestDate);
      if (learnerTestDate) existingApplication.learnerTestDate = new Date(learnerTestDate);
      
      await existingApplication.save();
      
      return res.json({
        success: true,
        message: 'Registration updated successfully',
        applicationNumber: existingApplication.applicationNumber,
        application: existingApplication
      });
    }

    // Create new application
    const applicationData = {
      digilocker,
      isDigilockerVerified: true,
      fullName: digilockerData.fullName,
      fatherName: digilockerData.fatherName,
      dateOfBirth: digilockerData.dateOfBirth,
      gender: digilockerData.gender,
      phone,
      isPhoneVerified: true,
      email,
      address,
      state,
      district,
      pincode,
      photoUploaded: true,
      registrationComplete: isRegistrationOnly || false,
      submissionDate: new Date()
    };

    // Add optional fields only if provided
    if (!isRegistrationOnly) {
      applicationData.applicationType = applicationType || 'Two Wheeler';
      applicationData.applicationStatus = 'submitted';
    } else {
      applicationData.applicationType = applicationType || 'Two Wheeler';
      applicationData.applicationStatus = 'registration_complete';
    }
    
    if (colorTestDate) {
      applicationData.colorTestDate = new Date(colorTestDate);
    }
    if (learnerTestDate) {
      applicationData.learnerTestDate = new Date(learnerTestDate);
    }

    const application = new Application(applicationData);

    // Slots are now managed through the SlotBooking model in the /book-slots endpoint
    // No need to book here during registration

    const savedApplication = await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationNumber: savedApplication.applicationNumber,
      data: {
        _id: savedApplication._id,
        applicationNumber: savedApplication.applicationNumber,
        email: savedApplication.email,
        applicationStatus: savedApplication.applicationStatus,
        submissionDate: savedApplication.submissionDate,
        colorTestDate: savedApplication.colorTestDate,
        learnerTestDate: savedApplication.learnerTestDate
      }
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while submitting application'
    });
  }
});

// @route   POST /api/applications/book-slots
// @desc    Book test slots
// @access  Public
router.post('/book-slots', async (req, res) => {
  try {
    const { digilocker, colorTestDate, learnerTestDate } = req.body;

    if (!digilocker || !colorTestDate || !learnerTestDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate that learner test is after color test
    const colorDate = new Date(colorTestDate);
    const learnerDate = new Date(learnerTestDate);
    
    if (learnerDate <= colorDate) {
      return res.status(400).json({
        success: false,
        message: 'Learner test date must be after color test date'
      });
    }

    // Find application
    const application = await Application.findOne({ digilocker });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check availability for color test
    const colorAvailability = await DailyBooking.checkAvailability(colorTestDate, 'colorVision');
    if (!colorAvailability.available) {
      return res.status(400).json({
        success: false,
        message: colorAvailability.reason || 'Color test slots full for this date'
      });
    }
    
    // Check availability for learner test
    const learnerAvailability = await DailyBooking.checkAvailability(learnerTestDate, 'learnerTest');
    if (!learnerAvailability.available) {
      return res.status(400).json({
        success: false,
        message: learnerAvailability.reason || 'Learner test slots full for this date'
      });
    }

    // Book both slots
    try {
      await DailyBooking.bookSlot(colorTestDate, 'colorVision', digilocker);
      await DailyBooking.bookSlot(learnerTestDate, 'learnerTest', digilocker);
    } catch (bookingError) {
      return res.status(400).json({
        success: false,
        message: bookingError.message || 'Failed to book slots'
      });
    }

    // Update application with test dates
    application.colorTestDate = new Date(colorTestDate);
    application.learnerTestDate = new Date(learnerTestDate);
    application.applicationStatus = 'slots_booked';

    await application.save();

    res.json({
      success: true,
      message: 'Slots booked successfully',
      application
    });
  } catch (error) {
    console.error('Error booking slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking slots'
    });
  }
});

// @route   POST /api/applications/complete-color-test
// @desc    Complete color vision test (Step 3)
// @access  Public
router.post('/complete-color-test', async (req, res) => {
  try {
    const { applicationNumber, digiLockerId, score, passed } = req.body;

    // Find application
    const application = await Application.findOne({ 
      applicationNumber,
      digilocker: digiLockerId 
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Precondition checks
    if (!application.paymentCompleted || application.paymentStatus !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Payment not completed. Please complete payment before attempting the test.'
      });
    }

    if (application.colorVisionTestCompleted) {
      return res.status(409).json({
        success: false,
        message: 'Color vision test already attempted.'
      });
    }

    // Check if user passed (70% required)
    if (!passed || score < 70) {
      // Test failed - don't mark as completed, allow retry
      return res.status(400).json({
        success: false,
        passed: false,
        score: score,
        message: `Test failed with ${score.toFixed(1)}% score. You need 70% to pass. Please try again.`
      });
    }

    // Mark test as completed (only if passed)
    application.colorVisionTestCompleted = true;
    application.colorVisionTestDate = new Date();
    await application.save();

    // Send notification (non-blocking)
    sendTestCompletionNotification(application).catch(err => 
      console.error('Notification failed:', err)
    );

    res.json({
      success: true,
      applicationNumber: application.applicationNumber,
      colorVisionTestCompleted: true,
      colorVisionTestDate: application.colorVisionTestDate,
      score: score,
      message: `Congratulations! Color vision test passed with ${score.toFixed(1)}% score. You are qualified for the learner test.`
    });

  } catch (error) {
    console.error('Error completing color test:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing test completion'
    });
  }
});

// Helper: Evaluate color test result (auto-pass for now, hook for future logic)
function evaluateColourTestResult() {
  // Future: implement actual test logic here
  return { passed: true };
}

async function sendTestCompletionNotification(application) {
  // Future: implement email/SMS service
  return true;
}

// @route   GET /api/applications/valid-digilocker-ids
// @desc    Get all valid DigiLocker IDs
// @access  Public
router.get('/valid-digilocker-ids', async (req, res) => {
  try {
    const validIDs = await DigiLockerService.getAllValidIDs();
    res.json({
      success: true,
      message: 'Valid DigiLocker IDs',
      data: validIDs
    });
  } catch (error) {
    console.error('Error fetching valid IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching valid IDs'
    });
  }
});

// @route   GET /api/applications/digilocker-records
// @desc    Get all DigiLocker records (for admin purposes)
// @access  Public (should be protected in production)
router.get('/digilocker-records', async (req, res) => {
  try {
    const records = await DigiLockerService.getAllRecords();
    res.json({
      success: true,
      count: records.length,
      message: 'DigiLocker records retrieved successfully',
      data: records
    });
  } catch (error) {
    console.error('Error fetching DigiLocker records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DigiLocker records'
    });
  }
});

// @route   GET /api/applications
// @desc    Get all applications (admin only)
// @access  Public (should be protected in real app)
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find()
      .select('-__v')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
});

// @route   GET /api/applications/calendar-availability
// @desc    Get availability for calendar dates
// @access  Public
router.get('/calendar-availability', async (req, res) => {
  try {
    const { testType, startDate, endDate } = req.query;
    
    // Default to 60 days range
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    
    const holidays = await Holiday.find({
      date: { $gte: start, $lte: end }
    });
    
    // Get all bookings in the range using DailyBooking
    const bookings = await DailyBooking.find({
      date: { $gte: start, $lte: end }
    });
    
    // Create availability map
    const dateArray = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateArray.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const availabilityMap = {};
    
    dateArray.forEach(dateStr => {
      // Parse date in UTC to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const dayOfWeek = date.getUTCDay();
      
      // Check if it's a holiday
      const isHoliday = holidays.some(h => 
        h.date.toISOString().split('T')[0] === dateStr
      );
      
      // Check if it's Sunday (0) or Saturday (6)
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isSunday || isSaturday;
      
      // Get booking for this date
      const booking = bookings.find(b => 
        b.date.toISOString().split('T')[0] === dateStr
      );
      
      const bookingField = testType === 'learnerTest' ? 'learnerTestBookings' : 'colorVisionBookings';
      const bookedSlots = booking ? (booking[bookingField] || 0) : 0;
      const maxSlots = 5;
      const availableSlots = maxSlots - bookedSlots;
      
      let status = 'available';
      let color = 'green';
      
      if (isHoliday || isWeekend || booking?.isHoliday) {
        status = 'holiday';
        color = 'red';
      } else if (availableSlots === 0) {
        status = 'unavailable';
        color = 'red';
      } else if (bookedSlots > 0 && availableSlots > 0) {
        status = 'partially-filled';
        color = 'orange';
      }
      
      const holidayObj = holidays.find(h => h.date.toISOString().split('T')[0] === dateStr);
      let holidayName = null;
      if (isWeekend) {
        holidayName = isSunday ? 'Sunday' : 'Saturday';
      } else if (holidayObj) {
        holidayName = holidayObj.name;
      } else if (booking?.isHoliday) {
        holidayName = booking.holidayReason;
      }
      
      availabilityMap[dateStr] = {
        date: dateStr,
        status,
        color,
        availableSlots,
        maxSlots,
        bookedSlots,
        isHoliday: isHoliday || isWeekend || booking?.isHoliday,
        holidayName
      };
    });
    
    res.json({
      success: true,
      data: availabilityMap
    });
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability'
    });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findOne({
      applicationId: req.params.id
    }).select('-__v');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
});

// @route   POST /api/applications/:id/payment
// @desc    Process payment (dummy payment)
// @access  Public
router.post('/:id/payment', async (req, res) => {
  try {
    const application = await Application.findOne({
      applicationId: req.params.id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Process payment
    application.paymentStatus = 'completed';
    await application.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: application.transactionId,
        paymentStatus: application.paymentStatus,
        amount: application.paymentAmount
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Public (should be protected for admin only)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findOneAndUpdate(
      { applicationId: req.params.id },
      { applicationStatus: status, updatedAt: Date.now() },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId: application.applicationId,
        applicationStatus: application.applicationStatus
      }
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
});

// @route   GET /api/applications/user/:digilockerID
// @desc    Get user's application data by DigiLocker ID
// @access  Public
router.get('/user/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    res.json({
      success: true,
      message: 'Application data retrieved successfully',
      data: application
    });
  } catch (error) {
    console.error('Error fetching user application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application data'
    });
  }
});

// @route   PUT /api/applications/download-learner/:digilockerID
// @desc    Mark learner license as downloaded
// @access  Public
router.put('/download-learner/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if learner test is completed
    if (!application.learnerTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Learner test must be completed before downloading learner license'
      });
    }

    // Update download status
    application.learnerLicenseDownloaded = true;
    application.learnerLicenseDownloadDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Learner license download recorded successfully',
      data: {
        learnerLicenseDownloaded: application.learnerLicenseDownloaded,
        learnerLicenseDownloadDate: application.learnerLicenseDownloadDate
      }
    });
  } catch (error) {
    console.error('Error recording learner license download:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording download'
    });
  }
});

// @route   PUT /api/applications/download-license/:digilockerID
// @desc    Mark driving license as downloaded
// @access  Public
router.put('/download-license/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if road test is completed
    if (!application.roadTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Road test must be completed before downloading driving license'
      });
    }

    // Update download status
    application.drivingLicenseDownloaded = true;
    application.drivingLicenseDownloadDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Driving license download recorded successfully',
      data: {
        drivingLicenseDownloaded: application.drivingLicenseDownloaded,
        drivingLicenseDownloadDate: application.drivingLicenseDownloadDate
      }
    });
  } catch (error) {
    console.error('Error recording driving license download:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording download'
    });
  }
});

// @route   PUT /api/applications/complete-color-vision/:digilockerID
// @desc    Mark color vision test as completed
// @access  Public
router.put('/complete-color-vision/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if application is submitted
    if (application.applicationStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Application must be submitted before taking tests'
      });
    }

    // Update color vision test status
    application.colorVisionTestCompleted = true;
    application.colorVisionTestDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Color vision test completed successfully',
      data: {
        colorVisionTestCompleted: application.colorVisionTestCompleted,
        colorVisionTestDate: application.colorVisionTestDate
      }
    });
  } catch (error) {
    console.error('Error completing color vision test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating test status'
    });
  }
});

// @route   PUT /api/applications/complete-learner-test/:digilockerID
// @desc    Mark learner test as completed
// @access  Public
router.put('/complete-learner-test/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if color vision test is completed
    if (!application.colorVisionTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Color vision test must be completed first'
      });
    }

    // Update learner test status
    application.learnerTestCompleted = true;
    application.learnerTestDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Learner test completed successfully',
      data: {
        learnerTestCompleted: application.learnerTestCompleted,
        learnerTestDate: application.learnerTestDate
      }
    });
  } catch (error) {
    console.error('Error completing learner test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating test status'
    });
  }
});

// @route   PUT /api/applications/complete-road-test/:digilockerID
// @desc    Mark road test as completed
// @access  Public
router.put('/complete-road-test/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if learner license is downloaded
    if (!application.learnerLicenseDownloaded) {
      return res.status(400).json({
        success: false,
        message: 'Learner license must be downloaded before road test'
      });
    }

    // Update road test status
    application.roadTestCompleted = true;
    application.roadTestDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Road test completed successfully',
      data: {
        roadTestCompleted: application.roadTestCompleted,
        roadTestDate: application.roadTestDate
      }
    });
  } catch (error) {
    console.error('Error completing road test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating test status'
    });
  }
});

// @route   PUT /api/applications/complete-road-test/:digilockerID
// @desc    Mark road test as completed
// @access  Public
router.put('/complete-road-test/:digilockerID', async (req, res) => {
  try {
    const { digilockerID } = req.params;
    
    if (!digilockerID) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker: digilockerID });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if learner license is downloaded
    if (!application.learnerLicenseDownloaded) {
      return res.status(400).json({
        success: false,
        message: 'Learner license must be downloaded before road test'
      });
    }

    // Update road test status
    application.roadTestCompleted = true;
    application.roadTestDate = new Date();
    
    await application.save();

    res.json({
      success: true,
      message: 'Road test completed successfully',
      data: {
        roadTestCompleted: application.roadTestCompleted,
        roadTestDate: application.roadTestDate
      }
    });
  } catch (error) {
    console.error('Error completing road test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating test status'
    });
  }
});

// @route   POST /api/applications/learner-test-result
// @desc    Submit learner test result
// @access  Public
router.post('/learner-test-result', async (req, res) => {
  try {
    const { digilocker, passed } = req.body;
    
    if (!digilocker) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if color vision test is completed
    if (!application.colorVisionTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Color vision test must be completed first'
      });
    }

    // Check if already completed
    if (application.learnerTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Learner test already completed'
      });
    }

    if (passed) {
      // Update learner test status
      application.learnerTestCompleted = true;
      application.learnerTestDate = new Date();
      await application.save();

      res.json({
        success: true,
        message: 'Learner test completed successfully',
        data: {
          learnerTestCompleted: application.learnerTestCompleted,
          learnerTestDate: application.learnerTestDate
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Learner test failed. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error submitting learner test result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing test result'
    });
  }
});

// @route   POST /api/applications/apply-road-test
// @desc    Apply for road test
// @access  Public
router.post('/apply-road-test', async (req, res) => {
  try {
    const { digilocker } = req.body;
    
    if (!digilocker) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const application = await Application.findOne({ digilocker });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this DigiLocker ID'
      });
    }

    // Check if learner test is completed
    if (!application.learnerTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Learner test must be completed before applying for road test'
      });
    }

    // Update application status to indicate road test application
    application.applicationStatus = 'completed';
    await application.save();

    res.json({
      success: true,
      message: 'Road test application submitted successfully',
      data: {
        applicationNumber: application.applicationNumber,
        applicationStatus: application.applicationStatus
      }
    });
  } catch (error) {
    console.error('Error applying for road test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying for road test'
    });
  }
});

// OLD ROUTES USING DailyBooking - COMMENTED OUT
/*
// @route   GET /api/applications/calendar/:year/:month
// @desc    Get calendar data for a specific month
// @access  Public
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({
        success: false,
        message: 'Valid year and month are required'
      });
    }
    
    const calendar = await DailyBooking.getMonthlyCalendar(parseInt(year), parseInt(month));
    
    res.json({
      success: true,
      message: 'Calendar data retrieved successfully',
      data: {
        year: parseInt(year),
        month: parseInt(month),
        calendar: calendar
      }
    });
  } catch (error) {
    console.error('Error getting calendar data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving calendar data'
    });
  }
});

// @route   GET /api/applications/availability/:date/:testType
// @desc    Check availability for a specific date and test type
// @access  Public
router.get('/availability/:date/:testType', async (req, res) => {
  try {
    const { date, testType } = req.params;
    
    if (!date || !testType) {
      return res.status(400).json({
        success: false,
        message: 'Date and test type are required'
      });
    }
    
    // Allow both colorVision and learnerTest types
    const validTestTypes = ['colorVision', 'learnerTest'];
    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test type. Must be colorVision or learnerTest'
      });
    }
    
    const availability = await DailyBooking.checkAvailability(date, testType);
    
    res.json({
      success: true,
      message: 'Availability checked successfully',
      data: {
        date: date,
        testType: testType,
        ...availability
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability'
    });
  }
});

// @route   POST /api/applications/book-slot
// @desc    Book a test slot for a specific date
// @access  Public
router.post('/book-slot', async (req, res) => {
  try {
    const { digilockerID, date, testType } = req.body;
    
    if (!digilockerID || !date || !testType) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID, date, and test type are required'
      });
    }
    
    // Allow both colorVision and learnerTest types
    const validTestTypes = ['colorVision', 'learnerTest'];
    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test type. Must be colorVision or learnerTest'
      });
    }
    
    // Check if application exists
    const application = await Application.findOne({ digilocker: digilockerID });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Book the slot
    const booking = await DailyBooking.bookSlot(date, testType, digilockerID);
    
    // Update application with booked date
    const dateField = testType === 'colorVision' ? 'colorTestDate' : 'learnerTestDate';
    application[dateField] = new Date(date);
    await application.save();
    
    res.json({
      success: true,
      message: `${testType === 'colorVision' ? 'Color vision' : 'Learner'} test slot booked successfully`,
      data: {
        date: date,
        testType: testType,
        remaining: booking[`${testType}Bookings`] ? 5 - booking[`${testType}Bookings`] : 4
      }
    });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error while booking slot'
    });
  }
});

// @route   POST /api/applications/set-holiday
// @desc    Mark a date as holiday (Admin function)
// @access  Public (should be Admin in production)
router.post('/set-holiday', async (req, res) => {
  try {
    const { date, isHoliday, reason } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const booking = await DailyBooking.findOneAndUpdate(
      { date: new Date(date) },
      {
        $set: {
          isHoliday: !!isHoliday,
          holidayReason: isHoliday ? reason : null
        },
        $setOnInsert: { date: new Date(date) }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: `Date ${isHoliday ? 'marked as holiday' : 'unmarked as holiday'}`,
      data: {
        date: date,
        isHoliday: booking.isHoliday,
        reason: booking.holidayReason
      }
    });
  } catch (error) {
    console.error('Error setting holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting holiday'
    });
  }
});
*/

// @route   POST /api/applications/holidays
// @desc    Add a holiday
// @access  Admin
router.post('/holidays', async (req, res) => {
  try {
    const { date, name, type } = req.body;
    
    const holiday = new Holiday({
      date: new Date(date),
      name,
      type: type || 'national'
    });
    
    await holiday.save();
    
    res.json({
      success: true,
      message: 'Holiday added successfully',
      data: holiday
    });
  } catch (error) {
    console.error('Error adding holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding holiday'
    });
  }
});

module.exports = router;