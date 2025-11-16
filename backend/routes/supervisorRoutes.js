const express = require('express');
const router = express.Router();
const Supervisor = require('../models/Supervisor');
const Application = require('../models/Application');
const DailyBooking = require('../models/DailyBooking');

// Initialize default supervisor if not exists
const initializeSupervisor = async () => {
  try {
    const existingSupervisor = await Supervisor.findOne({ supervisorId: 'supervisor' });
    if (!existingSupervisor) {
      await Supervisor.create({
        supervisorId: 'supervisor',
        password: '123456',
        name: 'RTO Officer',
        role: 'supervisor'
      });
      console.log('Default supervisor created');
    }
  } catch (error) {
    console.error('Error initializing supervisor:', error);
  }
};

initializeSupervisor();

// Supervisor login
router.post('/login', async (req, res) => {
  try {
    const { supervisorId, password } = req.body;

    if (!supervisorId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor ID and password are required'
      });
    }

    const supervisor = await Supervisor.findOne({ supervisorId });

    if (!supervisor || supervisor.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        supervisorId: supervisor.supervisorId,
        name: supervisor.name,
        role: supervisor.role
      }
    });
  } catch (error) {
    console.error('Error in supervisor login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get today's scheduled candidates
router.get('/today-candidates', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all applications scheduled for today
      const candidates = await Application.find({
      roadTestDate: {
        $gte: today,
        $lt: tomorrow
      },
      learnerTestStatus: 'passed'
    }).select('applicationNumber fullName roadTestDate roadTestSlot roadTestStatus photoPath photoData learnerTestPhoto digilocker phoneNumber email');

    // Format the response
    const formattedCandidates = candidates.map(candidate => ({
      applicationNumber: candidate.applicationNumber,
      fullName: candidate.fullName,
      roadTestDate: candidate.roadTestDate,
      roadTestSlot: candidate.roadTestSlot,
      roadTestStatus: candidate.roadTestStatus || 'scheduled',
      photoPath: candidate.photoPath,
      photoData: candidate.photoData,
      learnerTestPhoto: candidate.learnerTestPhoto,
        phoneNumber: candidate.phone,
      email: candidate.email,
      digilockerData: candidate.digilocker
    }));

    res.json({
      success: true,
      count: formattedCandidates.length,
      data: formattedCandidates
    });
  } catch (error) {
    console.error('Error fetching today\'s candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get candidate details for verification
router.get('/candidate/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;

    const candidate = await Application.findOne({ applicationNumber });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      data: {
        applicationNumber: candidate.applicationNumber,
        fullName: candidate.fullName,
        roadTestDate: candidate.roadTestDate,
        roadTestSlot: candidate.roadTestSlot,
        roadTestStatus: candidate.roadTestStatus || 'scheduled',
        photoPath: candidate.photoPath,
        photoData: candidate.photoData,
        learnerTestPhoto: candidate.learnerTestPhoto,
          phoneNumber: candidate.phone,
        email: candidate.email,
        digilockerData: candidate.digilocker
      }
    });
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify candidate (simulate photo matching)
router.post('/verify-candidate', async (req, res) => {
  try {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Application number is required'
      });
    }

    const candidate = await Application.findOne({ applicationNumber });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Simulate photo verification processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Always pass - dummy verification
    res.json({
      success: true,
      message: 'Photo Verification Successful',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send OTP to candidate
router.post('/send-otp', async (req, res) => {
  try {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Application number is required'
      });
    }

    const candidate = await Application.findOne({ applicationNumber });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in application (with 10 minute expiry)
    candidate.verificationOTP = otp;
    candidate.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await candidate.save({ validateBeforeSave: false });

    // Return OTP to display on screen
    res.json({
      success: true,
      message: 'OTP sent to candidate',
      otp: otp, // Display on screen for demo
        phoneNumber: candidate.phone
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { applicationNumber, otp, verificationPhoto } = req.body;

    if (!applicationNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Application number and OTP are required'
      });
    }

    const candidate = await Application.findOne({ applicationNumber });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if OTP is expired
    if (candidate.otpExpiry && new Date() > candidate.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (candidate.verificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP'
      });
    }

    // Update candidate status
    candidate.roadTestStatus = 'verified';
    candidate.verificationOTP = undefined;
    candidate.otpExpiry = undefined;
    candidate.verifiedAt = new Date();
    
    // Save verification photo (front face photo)
    if (verificationPhoto) {
      candidate.verificationPhoto = verificationPhoto;
    }
    
    await candidate.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Candidate verified successfully',
      data: {
        applicationNumber: candidate.applicationNumber,
        fullName: candidate.fullName,
        roadTestStatus: candidate.roadTestStatus
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get verified candidates for evaluation
router.get('/verified-candidates', async (req, res) => {
  try {
    const candidates = await Application.find({
      roadTestStatus: 'verified',
      learnerTestStatus: 'passed'
    }).select('applicationNumber fullName roadTestDate roadTestSlot roadTestStatus phone email verifiedAt');

    const formattedCandidates = candidates.map(candidate => ({
      applicationNumber: candidate.applicationNumber,
      fullName: candidate.fullName,
      roadTestDate: candidate.roadTestDate,
      roadTestSlot: candidate.roadTestSlot,
      roadTestStatus: candidate.roadTestStatus,
      // Provide phoneNumber alias expected by frontend
        phoneNumber: candidate.phone,
      email: candidate.email,
      verifiedAt: candidate.verifiedAt
    }));

    res.json({
      success: true,
      count: formattedCandidates.length,
      data: formattedCandidates
    });
  } catch (error) {
    console.error('Error fetching verified candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Submit road test evaluation
router.post('/evaluate-candidate', async (req, res) => {
  try {
    const { applicationNumber, evaluations } = req.body;

    if (!applicationNumber || !evaluations || !Array.isArray(evaluations)) {
      return res.status(400).json({
        success: false,
        message: 'Application number and evaluations are required'
      });
    }

    // Validate all questions are answered
    if (evaluations.some(e => !e.rating || e.rating < 1 || e.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'All questions must be answered with ratings between 1 and 5'
      });
    }

    const candidate = await Application.findOne({ applicationNumber });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    if (candidate.roadTestStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Candidate must be verified before evaluation'
      });
    }

    // Calculate total score (sum of all ratings)
    const totalScore = evaluations.reduce((sum, e) => sum + e.rating, 0);
    const maxScore = evaluations.length * 5; // Maximum possible score
    const percentage = (totalScore / maxScore) * 100;
    
    // Passing score is 60% (configurable)
    const passingPercentage = 60;
    const passed = percentage >= passingPercentage;

    // Update candidate
    candidate.roadTestEvaluationQuestions = evaluations;
    candidate.roadTestScore = totalScore;
    candidate.roadTestEvaluated = true;
    candidate.roadTestEvaluatedAt = new Date();
    candidate.roadTestPassed = passed;
    candidate.roadTestStatus = passed ? 'passed' : 'failed';
    candidate.roadTestCompleted = true;

    await candidate.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Evaluation submitted successfully. Candidate ${passed ? 'PASSED' : 'FAILED'}`,
      data: {
        applicationNumber: candidate.applicationNumber,
        fullName: candidate.fullName,
        totalScore,
        maxScore,
        percentage: percentage.toFixed(2),
        passed,
        roadTestStatus: candidate.roadTestStatus
      }
    });
  } catch (error) {
    console.error('Error evaluating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all candidates who have applied for road test
router.get('/all-road-test-candidates', async (req, res) => {
  try {
    const candidates = await Application.find({
      roadTestDate: { $exists: true, $ne: null },
      learnerTestStatus: 'passed'
    }).select('applicationNumber fullName roadTestDate roadTestSlot roadTestStatus phone email verifiedAt roadTestScore roadTestPassed');

    const formattedCandidates = candidates.map(candidate => ({
      applicationNumber: candidate.applicationNumber,
      fullName: candidate.fullName,
      roadTestDate: candidate.roadTestDate,
      roadTestSlot: candidate.roadTestSlot,
      roadTestStatus: candidate.roadTestStatus || 'scheduled',
      // Provide phoneNumber alias expected by frontend
        phoneNumber: candidate.phone,
      email: candidate.email,
      verifiedAt: candidate.verifiedAt,
      roadTestScore: candidate.roadTestScore,
      roadTestPassed: candidate.roadTestPassed
    }));

    res.json({
      success: true,
      count: formattedCandidates.length,
      data: formattedCandidates
    });
  } catch (error) {
    console.error('Error fetching road test candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
