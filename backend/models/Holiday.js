const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['national', 'regional', 'special'],
    default: 'national'
  }
}, {
  timestamps: true
});

// Add index for faster date queries
holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
