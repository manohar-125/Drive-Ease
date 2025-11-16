const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Test = require('../models/Test');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const DigiLockerService = require('../services/digiLockerService');

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to generate learner license number
async function generateLearnerLicenseNumber() {
  const year = new Date().getFullYear();
  
  // Find the highest license number for current year
  const lastLicense = await Application.findOne({
    learnerLicenseNumber: new RegExp(`^LL${year}`)
  }).sort({ learnerLicenseNumber: -1 });
  
  let sequenceNumber = 1;
  if (lastLicense && lastLicense.learnerLicenseNumber) {
    const lastSequence = parseInt(lastLicense.learnerLicenseNumber.slice(-4));
    sequenceNumber = lastSequence + 1;
  }
  
  // Format: LL2025XXXX (4 digits)
  return `LL${year}${sequenceNumber.toString().padStart(4, '0')}`;
}

// GET /api/learner-test/candidate-info/:applicationNumber
// Get candidate information for instructions page
router.get('/candidate-info/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    const application = await Application.findOne({ applicationNumber });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({
      applicationNumber: application.applicationNumber,
      fullName: application.fullName,
      fatherName: application.fatherName,
      dateOfBirth: application.dateOfBirth,
      applicationType: application.applicationType,
      colorVisionTestCompleted: application.colorVisionTestCompleted,
      paymentCompleted: application.paymentCompleted
    });
    
  } catch (error) {
    console.error('Error fetching candidate info:', error);
    res.status(500).json({ message: 'Error fetching candidate information', error: error.message });
  }
});

// GET /api/learner-test/questions/:applicationNumber
// Fetch 30 random questions for the test
router.get('/questions/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    // Find the application
    const application = await Application.findOne({ applicationNumber });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check prerequisites
    if (!application.colorVisionTestCompleted) {
      return res.status(403).json({ 
        message: 'You must complete the Color Vision Test first before taking the Learner Test' 
      });
    }
    
    if (!application.paymentCompleted) {
      return res.status(403).json({ 
        message: 'Payment must be completed before taking the test' 
      });
    }
    
    // Check if already passed
    if (application.learnerTestStatus === 'passed') {
      return res.status(400).json({ 
        message: 'You have already passed the learner test',
        licenseNumber: application.learnerLicenseNumber
      });
    }
    
    // Load questions from JSON file
    const questionsPath = path.join(__dirname, '../data/learnerTestQuestions.json');
    const questionsData = await fs.readFile(questionsPath, 'utf-8');
    const allQuestions = JSON.parse(questionsData);
    
    // Separate questions by type
    const signQuestions = allQuestions.filter(q => q.hasImage === true);
    const theoreticalQuestions = allQuestions.filter(q => q.hasImage === false);
    
    // Shuffle each category
    const shuffledSignQuestions = shuffleArray(signQuestions);
    const shuffledTheoreticalQuestions = shuffleArray(theoreticalQuestions);
    
    // Select 20 sign questions and 10 theoretical questions
    const selectedSignQuestions = shuffledSignQuestions.slice(0, 20);
    const selectedTheoreticalQuestions = shuffledTheoreticalQuestions.slice(0, 10);
    
    // Combine and shuffle the final set
    const selectedQuestions = shuffleArray([...selectedSignQuestions, ...selectedTheoreticalQuestions]);
    
    // Remove correct answers before sending to frontend
    const questionsForTest = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      hasImage: q.hasImage,
      imagePath: q.imagePath,
      imageData: q.imageData || null, // Include Base64 image data if available
      category: q.category
    }));
    
    // Update application status
    await Application.updateOne(
      { applicationNumber },
      { $set: { learnerTestStatus: 'in_progress' } }
    );
    
    res.json({
      questions: questionsForTest,
      totalQuestions: 30,
      timeLimit: 20, // 20 minutes
      passScore: 21 // 70% of 30
    });
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// POST /api/learner-test/submit
// Submit test answers and calculate score
router.post('/submit', async (req, res) => {
  try {
    const { applicationNumber, answers, violations, timeTaken, startedAt } = req.body;
    
    // Find the application
    const application = await Application.findOne({ applicationNumber });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Load questions to verify answers
    const questionsPath = path.join(__dirname, '../data/learnerTestQuestions.json');
    const questionsData = await fs.readFile(questionsPath, 'utf-8');
    const allQuestions = JSON.parse(questionsData);
    
    // Validate answers array
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }
    
    // Calculate score - only count answered questions (userAnswer !== -1)
    let correctAnswers = 0;
    let attemptedQuestions = 0;
    
    answers.forEach(answer => {
      if (answer.userAnswer !== -1) {
        attemptedQuestions++;
        const question = allQuestions.find(q => q.id === answer.questionId);
        const isCorrect = question && question.correctAnswer === answer.userAnswer;
        if (isCorrect) correctAnswers++;
      }
    });
    
    const score = correctAnswers;
    const passed = score >= 21; // 70% of 30
    
    // Increment attempt counter
    application.learnerTestAttempts = (application.learnerTestAttempts || 0) + 1;
    
    // Save test attempt summary to Test collection
    const testAttempt = new Test({
      applicationNumber,
      testType: 'learner',
      attemptNumber: application.learnerTestAttempts,
      score,
      totalQuestions: 30,
      status: passed ? 'passed' : 'failed',
      violationsCount: violations ? violations.length : 0,
      startedAt: startedAt || new Date(),
      completedAt: new Date(),
      timeTaken: timeTaken || 0
    });
    
    await testAttempt.save();
    
    // Update application based on result
    const updateData = {
      learnerTestScore: score,
      learnerTestCompleted: passed,
      learnerTestStatus: passed ? 'passed' : 'failed',
      learnerTestAttempts: application.learnerTestAttempts
    };
    
    if (passed) {
      // Generate learner license number
      const licenseNumber = await generateLearnerLicenseNumber();
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months validity
      
      updateData.learnerLicenseNumber = licenseNumber;
      updateData.learnerLicenseIssueDate = issueDate;
      updateData.learnerLicenseExpiryDate = expiryDate;
      updateData.learnerTestPassDate = issueDate;
      updateData.learnerTestDate = issueDate;
    }
    
    await Application.updateOne(
      { applicationNumber },
      { $set: updateData }
    );
    
    res.json({
      success: true,
      passed,
      score,
      totalQuestions: 30,
      attemptedQuestions,
      passScore: 21,
      attemptNumber: application.learnerTestAttempts,
      licenseNumber: passed ? updateData.learnerLicenseNumber : null,
      message: passed 
        ? 'Congratulations! You have passed the learner test.' 
        : 'You did not pass. Please try again from the dashboard.'
    });
    
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error submitting test', error: error.message });
  }
});

// GET /api/learner-test/result/:applicationNumber
// Get latest test result
router.get('/result/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    const application = await Application.findOne({ applicationNumber });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Get latest test attempt
    const latestTest = await Test.findOne({ applicationNumber, testType: 'learner' })
      .sort({ attemptNumber: -1 });
    
    if (!latestTest) {
      return res.status(404).json({ message: 'No test attempts found' });
    }
    
    res.json({
      score: latestTest.score,
      totalQuestions: latestTest.totalQuestions,
      status: latestTest.status,
      passed: latestTest.status === 'passed',
      attemptNumber: latestTest.attemptNumber,
      completedAt: latestTest.completedAt,
      violationsCount: latestTest.violationsCount,
      timeTaken: latestTest.timeTaken,
      licenseNumber: application.learnerLicenseNumber
    });
    
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
});

// GET /api/learner-test/download-license/:applicationNumber
// Download learner license PDF
router.get('/download-license/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    const application = await Application.findOne({ applicationNumber });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.learnerTestStatus !== 'passed') {
      return res.status(403).json({ message: 'Learner test not passed yet' });
    }
    
    // Backfill missing core identity fields from DigiLocker if absent
    let updated = false;
    if (!application.fullName || !application.fatherName || !application.dateOfBirth || !application.gender || !application.address) {
      try {
        const digiData = await DigiLockerService.getUserData(application.digilocker);
        if (digiData) {
          if (!application.fullName && digiData.fullName) { application.fullName = digiData.fullName; updated = true; }
          if (!application.fatherName && digiData.fatherName) { application.fatherName = digiData.fatherName; updated = true; }
          if (!application.dateOfBirth && digiData.dateOfBirth) { application.dateOfBirth = new Date(digiData.dateOfBirth); updated = true; }
          if (!application.gender && digiData.gender) { application.gender = digiData.gender; updated = true; }
          if (!application.address && digiData.address) { application.address = digiData.address; updated = true; }
          if (!application.state && digiData.state) { application.state = digiData.state; updated = true; }
          if (!application.district && digiData.city) { application.district = digiData.city; updated = true; }
          if (!application.pincode && digiData.pincode) { application.pincode = digiData.pincode; updated = true; }
        }
      } catch (digErr) {
        console.error('Failed to backfill DigiLocker data:', digErr.message);
      }
    }
    if (updated) {
      try { await application.save({ validateBeforeSave: false }); } catch (saveErr) { console.error('Failed to persist backfilled data:', saveErr.message); }
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=learner-license-${applicationNumber}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Draw border
    doc.rect(30, 30, 535, 750).stroke();
    
    // Add header with logo/title
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#1a5490')
       .text("LEARNER'S DRIVING LICENSE", 50, 60, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica').fillColor('#666666')
       .text('GOVERNMENT OF INDIA', 50, 95, { align: 'center' });
    
    // Draw separator line
    doc.moveTo(50, 120).lineTo(545, 120).stroke();
    
    // Add applicant photo if available
    let photoAdded = false;
    try {
      let imageBuffer = null;
      if (application.photoData) {
        const base64Data = application.photoData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (application.photoPath) {
        const photoAbsolute = path.join(__dirname, '../', application.photoPath);
        try { imageBuffer = await fs.readFile(photoAbsolute); } catch (fErr) { console.error('Photo file read error:', fErr.message); }
      }
      if (imageBuffer) {
        doc.rect(440, 140, 110, 130).stroke();
        doc.image(imageBuffer, 445, 145, { width: 100, height: 120, fit: [100, 120] });
        photoAdded = true;
      }
    } catch (photoError) {
      console.error('Error processing photo for PDF:', photoError.message);
    }
    if (!photoAdded) {
      doc.rect(440, 140, 110, 130).stroke();
      doc.fontSize(10).fillColor('#999999').text('No Photo', 460, 200);
    }
    
    // Reset position and color for content
    doc.fillColor('#000000');
    let yPosition = 150;
    
    // License Details Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5490')
       .text('License Information', 50, yPosition);
    yPosition += 25;
    
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text('License Number:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${application.learnerLicenseNumber || 'N/A'}`);
    yPosition += 20;
    
    const issueDate = application.learnerLicenseIssueDate 
      ? new Date(application.learnerLicenseIssueDate).toLocaleDateString('en-IN')
      : 'N/A';
    doc.font('Helvetica').text('Issue Date:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${issueDate}`);
    yPosition += 20;
    
    const expiryDate = application.learnerLicenseExpiryDate 
      ? new Date(application.learnerLicenseExpiryDate).toLocaleDateString('en-IN')
      : 'N/A';
    doc.font('Helvetica').text('Expiry Date:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${expiryDate}`);
    yPosition += 35;
    
    // Personal Details Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5490')
       .text('Personal Information', 50, yPosition);
    yPosition += 25;
    
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text('Name:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${application.fullName}`);
    yPosition += 20;
    
    doc.font('Helvetica').text("Father's Name:", 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${application.fatherName || 'N/A'}`);
    yPosition += 20;
    
    const dob = application.dateOfBirth 
      ? new Date(application.dateOfBirth).toLocaleDateString('en-IN')
      : 'N/A';
    doc.font('Helvetica').text('Date of Birth:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${dob}`);
    yPosition += 20;
    
    doc.font('Helvetica').text('Gender:', 50, yPosition, { continued: true })
       .font('Helvetica-Bold').text(` ${application.gender || 'N/A'}`);
    yPosition += 35;
    
    // Address Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5490')
       .text('Address', 50, yPosition);
    yPosition += 25;
    
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    const safeAddress = application.address || 'Address Not Available';
    doc.text(safeAddress, 50, yPosition, { width: 380 });
    // Use a constant vertical increment; avoid relying on .length (may be undefined)
    yPosition += 40;
    const locationLine = `${application.district || 'District N/A'}, ${application.state || 'State N/A'} - ${application.pincode || 'PIN N/A'}`;
    doc.text(locationLine, 50, yPosition);
    yPosition += 35;
    
    // Vehicle Class Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5490')
       .text('Vehicle Class', 50, yPosition);
    yPosition += 25;
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
    doc.text(application.applicationType || 'Not specified', 50, yPosition);
    
    // Footer section
    doc.moveTo(50, 700).lineTo(545, 700).stroke();
    
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('This is a computer-generated learner license. Valid for 6 months from the date of issue.', 
             50, 710, { align: 'center', width: 495 });
    doc.text('Practice driving with a licensed driver only. Keep this license with you while driving.', 
             50, 725, { align: 'center', width: 495 });
    
    doc.fontSize(8).text(`Downloaded on: ${new Date().toLocaleDateString('en-IN')}`, 
                        50, 750, { align: 'center', width: 495 });
    
    // Finalize PDF
    doc.end();
    
    // Update download status
    application.learnerLicenseDownloaded = true;
    application.learnerLicenseDownloadDate = new Date();
    await application.save({ validateBeforeSave: false });
    
  } catch (error) {
    console.error('Error generating license PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating license PDF', error: error.message });
    }
  }
});

module.exports = router;
