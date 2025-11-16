const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const DigiLockerService = require('../services/digilockerService');
const otpVerificationService = require('../services/otpVerificationService');
const DailyBooking = require('../models/DailyBooking');

router.post('/otp/generate', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const result = await otpVerificationService.generateOTPForPhone(phone);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        otp: result.otp,
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

router.post('/verify-digilocker', async (req, res) => {
  try {
    const { digilocker } = req.body;

    if (!digilocker) {
      return res.status(400).json({
        success: false,
        message: 'DigiLocker ID is required'
      });
    }

    const verificationResult = await DigiLockerService.simulateVerification(digilocker.trim());

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

    const existingApplication = await Application.findOne({ digilocker });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this DigiLocker ID. Please check your dashboard for the current status.'
      });
    }

    const digilockerData = await DigiLockerService.getUserData(digilocker);
    if (!digilockerData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DigiLocker ID. Please verify your DigiLocker ID first.'
      });
    }

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

    const isRegistrationOnly = registrationComplete && !colorTestDate && !learnerTestDate;

    if (isRegistrationOnly) {
      if (!digilocker || !email || !address || !state || !district || !pincode || !applicationType) {
        return res.status(400).json({
          success: false,
          message: 'Please provide: email, address, state, district, pincode, and vehicle type'
        });
      }
    } else {
      if (!digilocker || !email || !address || !state || !district || !pincode || !applicationType || !colorTestDate || !learnerTestDate) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided including test dates'
        });
      }
    }

    let existingApplication = await Application.findOne({ digilocker });
    
    if (existingApplication && !isRegistrationOnly) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this DigiLocker ID.'
      });
    }

    const digilockerData = await DigiLockerService.getUserData(digilocker);
    if (!digilockerData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DigiLocker ID. Please verify your DigiLocker ID first.'
      });
    }

    if (existingApplication) {
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

router.post('/book-slots', async (req, res) => {
  try {
    const { digilocker, colorTestDate, learnerTestDate } = req.body;

    if (!digilocker || !colorTestDate || !learnerTestDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const colorDate = new Date(colorTestDate);
    const learnerDate = new Date(learnerTestDate);
    
    if (learnerDate <= colorDate) {
      return res.status(400).json({
        success: false,
        message: 'Learner test date must be after color test date'
      });
    }

    let application = await Application.findOne({ digilocker });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found. Please register first.'
      });
    }
    
    if (application.colorTestDate && application.learnerTestDate) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked your slots. Please check your dashboard.'
      });
    }
    const colorAvailability = await DailyBooking.checkAvailability(colorTestDate, 'colorVision');
    if (!colorAvailability.available) {
      return res.status(400).json({
        success: false,
        message: colorAvailability.reason || 'Color test slots full for this date'
      });
    }
    const learnerAvailability = await DailyBooking.checkAvailability(learnerTestDate, 'learnerTest');
    if (!learnerAvailability.available) {
      return res.status(400).json({
        success: false,
        message: learnerAvailability.reason || 'Learner test slots full for this date'
      });
    }
    try {
      await DailyBooking.bookSlot(colorTestDate, 'colorVision', digilocker);
      await DailyBooking.bookSlot(learnerTestDate, 'learnerTest', digilocker);
    } catch (bookingError) {
      return res.status(400).json({
        success: false,
        message: bookingError.message || 'Failed to book slots'
      });
    }
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

router.post('/complete-color-test', async (req, res) => {
  try {
    const { applicationNumber, digiLockerId, score, passed } = req.body;

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

    if (!passed || score < 70) {
      return res.status(400).json({
        success: false,
        passed: false,
        score: score,
        message: `Test failed with ${score.toFixed(1)}% score. You need 70% to pass. Please try again.`
      });
    }

    // Store color vision test images if provided
    if (req.body.capturedImages && Array.isArray(req.body.capturedImages)) {
      application.colorVisionTestImages = req.body.capturedImages.map(img => ({
        imageData: img,
        capturedAt: new Date()
      }));
    }

    application.colorVisionTestCompleted = true;
    application.colorVisionTestDate = new Date();
    await application.save();

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

function evaluateColourTestResult() {
  return { passed: true };
}

async function sendTestCompletionNotification(application) {
  return true;
}

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

router.get('/calendar-availability', async (req, res) => {
  try {
    const { testType, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    
    const bookings = await DailyBooking.find({
      date: { $gte: start, $lte: end }
    });
    
    const dateArray = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateArray.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const availabilityMap = {};
    
    dateArray.forEach(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const dayOfWeek = date.getUTCDay();
      
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isSunday || isSaturday;
      
      const booking = bookings.find(b => 
        new Date(b.date).toISOString().split('T')[0] === dateStr
      );

      const bookedSlots = booking ? (Array.isArray(booking.bookedSlots) ? booking.bookedSlots.length : (booking.bookedSlots || 0)) : 0;
      const maxSlots = booking ? (booking.maxSlots || 5) : 5;
      const availableSlots = maxSlots - bookedSlots;
      
      let status = 'available';
      let color = 'green';
      
      if (isWeekend || booking?.isHoliday) {
        status = 'holiday';
        color = 'red';
      } else if (availableSlots === 0) {
        status = 'unavailable';
        color = 'red';
      } else if (bookedSlots > 0 && availableSlots > 0) {
        status = 'partially-filled';
        color = 'orange';
      }
      
      let holidayName = null;
      if (isWeekend) {
        holidayName = isSunday ? 'Sunday' : 'Saturday';
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
        isHoliday: isWeekend || booking?.isHoliday,
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

    if (!application.learnerTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Learner test must be completed before downloading learner license'
      });
    }

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

    if (!application.roadTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Road test must be completed before downloading driving license'
      });
    }

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

    if (application.applicationStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Application must be submitted before taking tests'
      });
    }

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

    if (!application.colorVisionTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Color vision test must be completed first'
      });
    }

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

    if (!application.learnerLicenseDownloaded) {
      return res.status(400).json({
        success: false,
        message: 'Learner license must be downloaded before road test'
      });
    }

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

    if (!application.learnerLicenseDownloaded) {
      return res.status(400).json({
        success: false,
        message: 'Learner license must be downloaded before road test'
      });
    }

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

    if (!application.colorVisionTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Color vision test must be completed first'
      });
    }

    if (application.learnerTestCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Learner test already completed'
      });
    }

    if (passed) {
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

router.post('/complete-payment', async (req, res) => {
  try {
    const { digilocker, paymentReference, amount } = req.body;
    
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
        message: 'Application not found'
      });
    }

    application.paymentStatus = 'completed';
    application.paymentCompleted = true;
    application.paymentReference = paymentReference;
    application.paymentAmount = amount;
    
    await application.save();

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        paymentStatus: application.paymentStatus,
        paymentReference: application.paymentReference
      }
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
});

// Apply for Road Test
router.post('/apply-road-test', async (req, res) => {
  try {
    const { applicationNumber, learnerLicenseId, roadTestDate, roadTestSlot } = req.body;

    // Validate required fields
    if (!applicationNumber || !learnerLicenseId || !roadTestDate || !roadTestSlot) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find application by applicationNumber only (digilocker already verified during registration)
    const application = await Application.findOne({
      applicationNumber
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // A-1: Check if learner license is valid (not expired)
    if (!application.learnerLicenseExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Learner License not found. Please complete the Learner Test first.'
      });
    }

    const expiryDate = new Date(application.learnerLicenseExpiryDate);
    const today = new Date();
    
    if (expiryDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Learner License expired or invalid. Applicant cannot proceed.'
      });
    }

    // A-2: Validate Road Test date is after Learner Test date
    if (application.learnerTestDate) {
      const learnerDate = new Date(application.learnerTestDate);
      const roadDate = new Date(roadTestDate);
      
      if (roadDate <= learnerDate) {
        return res.status(400).json({
          success: false,
          message: 'Road Test date must be after the Learner Test date. Applicant must choose another date.'
        });
      }
    }

    // Business Rule: Road Test must be scheduled within 6 months of learner license issue date
    if (application.learnerLicenseIssueDate) {
      const issueDate = new Date(application.learnerLicenseIssueDate);
      const sixMonthsLater = new Date(issueDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      const roadDate = new Date(roadTestDate);
      
      if (roadDate > sixMonthsLater) {
        return res.status(400).json({
          success: false,
          message: 'Road Test must be scheduled within 6 months of learner license issue date.'
        });
      }
    }

    // A-3: Check slot availability (max 5 slots per day)
    const testDate = new Date(roadTestDate);
    testDate.setHours(0, 0, 0, 0);

    let dailyBooking = await DailyBooking.findOne({
      date: testDate,
      testType: 'road'
    });

    if (!dailyBooking) {
      dailyBooking = new DailyBooking({
        date: testDate,
        testType: 'road',
        maxSlots: 5,
        bookedSlots: []
      });
    }

    // Ensure bookedSlots is an array
    if (!Array.isArray(dailyBooking.bookedSlots)) {
      dailyBooking.bookedSlots = [];
    }

    // Check if slot already exists for this time
    const slotExists = dailyBooking.bookedSlots.some(booking => booking.timeSlot === roadTestSlot);
    
    if (slotExists || dailyBooking.bookedSlots.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'No slots available for this date. Applicant must select a different date.'
      });
    }

    // Business Rule: Applicant can have only one active road test application
    // Use the same digilocker associated with the fetched application (already verified at registration)
    const existingRoadTest = await Application.findOne({
      digilocker: application.digilocker,
      roadTestDate: { $exists: true, $ne: null },
      roadTestCompleted: false
    });

    if (existingRoadTest && existingRoadTest.applicationNumber !== applicationNumber) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active road test application.'
      });
    }

    // Update application with road test details
    application.roadTestDate = testDate;
    application.roadTestSlot = roadTestSlot;
    application.applicationStatus = 'road_test_scheduled';
    await application.save({ validateBeforeSave: false });

    // Book the slot
    dailyBooking.bookedSlots.push({
      applicationNumber,
      timeSlot: roadTestSlot,
      applicantName: application.fullName
    });
    await dailyBooking.save();

    res.json({
      success: true,
      message: 'Road test application submitted successfully',
      roadTestDate: testDate,
      roadTestSlot
    });

  } catch (error) {
    console.error('Error applying for road test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

module.exports = router;