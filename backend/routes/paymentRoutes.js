const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// @route   POST /api/payments
// @desc    Process dummy payment
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { applicationNumber, amount, vehicleType } = req.body;

    if (!applicationNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Application number and amount are required'
      });
    }

    // Find and update application payment status
    const application = await Application.findOne({ applicationNumber });
    if (application) {
      application.paymentStatus = 'completed';
      application.paymentCompleted = true;
      application.paymentAmount = amount;
      application.paymentDate = new Date();
      application.applicationStatus = 'submitted';
      application.status = 'submitted';
      await application.save();
    }

    // Generate payment reference number
    const paymentReferenceNumber = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      paymentReferenceNumber: paymentReferenceNumber,
      amount: amount
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
});

module.exports = router;
