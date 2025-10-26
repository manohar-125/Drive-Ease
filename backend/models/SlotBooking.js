const mongoose = require('mongoose');

const slotBookingSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  testType: {
    type: String,
    enum: ['colorVision', 'learnerTest'],
    required: true
  },
  bookedSlots: {
    type: Number,
    default: 0
  },
  maxSlots: {
    type: Number,
    default: 5
  },
  bookings: [{
    digiLockerId: String,
    bookedAt: Date
  }]
}, {
  timestamps: true
});

// Compound index for date and testType
slotBookingSchema.index({ date: 1, testType: 1 }, { unique: true });

module.exports = mongoose.model('SlotBooking', slotBookingSchema);
