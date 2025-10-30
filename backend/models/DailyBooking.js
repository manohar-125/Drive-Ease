const mongoose = require('mongoose');

const DailyBookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  colorVisionBookings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  learnerTestBookings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  holidayReason: {
    type: String,
    default: null
  },
  // Track which applications are booked for this date
  colorVisionApplications: [{
    type: String, // DigiLocker IDs
    ref: 'Application'
  }],
  learnerTestApplications: [{
    type: String,
    ref: 'Application'
  }]
}, {
  timestamps: true
});

// Index for efficient date queries
DailyBookingSchema.index({ date: 1 });

// Static method to check availability for a specific date and test type
DailyBookingSchema.statics.checkAvailability = async function(date, testType) {
  const booking = await this.findOne({ date: new Date(date) });
  
  if (!booking) {
    return { available: true, remaining: 5 };
  }
  
  if (booking.isHoliday) {
    return { available: false, remaining: 0, reason: 'Holiday' };
  }
  
  // Handle both colorVision and learnerTest
  const field = `${testType}Bookings`;
  const current = booking[field] || 0;
  const remaining = 5 - current;
  
  return {
    available: remaining > 0,
    remaining: remaining,
    current: current
  };
};

// Static method to book a slot
DailyBookingSchema.statics.bookSlot = async function(date, testType, digilockerID) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const booking = await this.findOneAndUpdate(
      { date: new Date(date) },
      { $setOnInsert: { date: new Date(date) } },
      { upsert: true, new: true, session }
    );
    
    if (booking.isHoliday) {
      throw new Error('Cannot book on holidays');
    }
    
    const bookingField = `${testType}Bookings`;
    const applicationField = `${testType}Applications`;
    
    if (booking[bookingField] >= 5) {
      throw new Error('No slots available for this date');
    }
    
    // Check if already booked
    if (booking[applicationField].includes(digilockerID)) {
      throw new Error('Already booked for this date');
    }
    
    // Update booking count and add application
    booking[bookingField] += 1;
    booking[applicationField].push(digilockerID);
    
    await booking.save({ session });
    await session.commitTransaction();
    
    return booking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to get calendar data for a month
DailyBookingSchema.statics.getMonthlyCalendar = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const bookings = await this.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const calendar = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const booking = bookings.find(b => 
      b.date.toISOString().split('T')[0] === dateStr
    );
    
    let status = 'available'; // green
    let details = {
      colorVision: { available: 5, booked: 0 },
      learnerTest: { available: 5, booked: 0 }
    };
    
    if (booking) {
      if (booking.isHoliday) {
        status = 'holiday'; // blue
      } else {
        const totalBooked = (booking.colorVisionBookings || 0) + (booking.learnerTestBookings || 0);
        if (totalBooked >= 10) { // All slots full (5 + 5)
          status = 'unavailable'; // red
        } else if (totalBooked > 0) {
          status = 'partial'; // yellow/orange
        }
        
        details = {
          colorVision: { available: 5 - (booking.colorVisionBookings || 0), booked: booking.colorVisionBookings || 0 },
          learnerTest: { available: 5 - (booking.learnerTestBookings || 0), booked: booking.learnerTestBookings || 0 }
        };
      }
    }
    
    calendar.push({
      date: new Date(currentDate),
      dateStr: dateStr,
      status: status,
      details: details,
      isHoliday: booking?.isHoliday || false,
      holidayReason: booking?.holidayReason || null
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return calendar;
};

module.exports = mongoose.model('DailyBooking', DailyBookingSchema);