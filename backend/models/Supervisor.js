const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
  supervisorId: {
    type: String,
    required: true,
    unique: true,
    default: 'supervisor'
  },
  password: {
    type: String,
    required: true,
    default: '123456'
  },
  name: {
    type: String,
    default: 'RTO Officer'
  },
  role: {
    type: String,
    default: 'supervisor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supervisor', supervisorSchema);
