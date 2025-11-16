const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    index: true
  },
  testType: {
    type: String,
    required: true,
    enum: ['learner', 'color', 'road'],
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['passed', 'failed', 'in_progress']
  },
  violationsCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  scheduledDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
testSchema.index({ applicationNumber: 1, testType: 1, attemptNumber: -1 });

module.exports = mongoose.model('Test', testSchema);
