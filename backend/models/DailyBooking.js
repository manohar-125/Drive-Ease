const mongoose = require('mongoose');

const DailyBookingSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },
  testType: {
    type: String,
    enum: ['colorVision', 'learnerTest'],
    required: true
  },
  totalSlots: {
    type: Number,
    default: 50
  },
  bookedSlots: {
    type: Number,
    default: 0
  },
  availableSlots: {
    type: Number,
    default: 50
  },
  isHoliday: {
    type: Boolean,
    default: false
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
      totalSlots: 50,
      bookedSlots: 0,
      availableSlots: 50,
      isHoliday: false
    });
  }
  
  if (booking.isHoliday) {
    return { available: false, reason: 'Holiday' };
  }
  
  if (booking.availableSlots <= 0) {
    return { available: false, reason: 'No slots available' };
  }
  
  return { 
    available: true, 
    availableSlots: booking.availableSlots,
    totalSlots: booking.totalSlots,
    bookedSlots: booking.bookedSlots
  };
};

// Static method to book a slot
DailyBookingSchema.statics.bookSlot = async function(date, testType, digilockerID) {
  let booking = await this.findOne({ date, testType });
  
  if (!booking) {
    // Create new booking entry if it doesn't exist
    booking = await this.create({
      date,
      testType,
      totalSlots: 50,
      bookedSlots: 0,
      availableSlots: 50,
      isHoliday: false
    });
  }
  
  if (booking.isHoliday) {
    throw new Error('Cannot book on holiday');
  }
  
  if (booking.availableSlots <= 0) {
    throw new Error('No slots available');
  }
  
  // Update booking
  booking.bookedSlots += 1;
  booking.availableSlots -= 1;
  await booking.save();
  
  return booking;
};

module.exports = mongoose.model('DailyBooking', DailyBookingSchema);
