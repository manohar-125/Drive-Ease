const mongoose = require('mongoose');

const DailyBookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  testType: {
    type: String,
    enum: ['colorVision', 'learnerTest', 'road'],
    required: true
  },
  maxSlots: {
    type: Number,
    default: 50
  },
  // detailed booked slot entries
  bookedSlots: [{
    applicationNumber: String,
    timeSlot: String,
    applicantName: String,
    bookedAt: Date
  }],
  availableSlots: {
    type: Number,
    default: 50
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  holidayName: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

DailyBookingSchema.index({ date: 1, testType: 1 });

// Static method to check availability
DailyBookingSchema.statics.checkAvailability = async function(date, testType) {
  let booking = await this.findOne({ date, testType });

  if (!booking) {
    // Create new booking entry if it doesn't exist
    booking = await this.create({
      date,
      testType,
      maxSlots: 50,
      bookedSlots: [],
      availableSlots: 50,
      isHoliday: false
    });
  }

  if (booking.isHoliday) {
    return { available: false, reason: 'Holiday' };
  }

  const bookedCount = Array.isArray(booking.bookedSlots) ? booking.bookedSlots.length : (booking.bookedSlots || 0);
  if (booking.availableSlots <= 0 || bookedCount >= booking.maxSlots) {
    return { available: false, reason: 'No slots available' };
  }

  return {
    available: true,
    availableSlots: booking.availableSlots,
    maxSlots: booking.maxSlots,
    bookedSlots: bookedCount
  };
};

// Static method to book a slot
DailyBookingSchema.statics.bookSlot = async function(date, testType, digilockerID, timeSlot = null, applicantName = null) {
  let booking = await this.findOne({ date, testType });

  if (!booking) {
    // Create new booking entry if it doesn't exist
    booking = await this.create({
      date,
      testType,
      maxSlots: 50,
      bookedSlots: [],
      availableSlots: 50,
      isHoliday: false
    });
  }

  if (booking.isHoliday) {
    throw new Error('Cannot book on holiday');
  }

  const bookedCount = Array.isArray(booking.bookedSlots) ? booking.bookedSlots.length : (booking.bookedSlots || 0);
  if (booking.availableSlots <= 0 || bookedCount >= booking.maxSlots) {
    throw new Error('No slots available');
  }

  // Add a detailed booked slot
  booking.bookedSlots.push({
    applicationNumber: digilockerID,
    timeSlot,
    applicantName,
    bookedAt: new Date()
  });

  booking.availableSlots = Math.max(0, booking.maxSlots - booking.bookedSlots.length);
  await booking.save();

  return booking;
};

module.exports = mongoose.model('DailyBooking', DailyBookingSchema);
