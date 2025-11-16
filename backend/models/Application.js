const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const ApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  
  digilocker: {
    type: String,
    required: [true, 'DigiLocker ID is required'],
    unique: true,
    trim: true
  },
  isDigilockerVerified: {
    type: Boolean,
    default: false
  },
  
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  fatherName: {
    type: String,
    required: [true, 'Father name is required'],
    trim: true,
    maxlength: [100, 'Father name cannot exceed 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneOTP: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'PIN code is required'],
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: 'PIN code must be 6 digits'
    }
  },
  
  applicationType: {
    type: String,
    required: false,
    enum: ['Two Wheeler', 'Four Wheeler', 'Two Cum Four Wheeler', 'Heavy Vehicle', 'Light Motor Vehicle']
  },
  
  colorTestDate: {
    type: Date,
    required: false
  },
  learnerTestDate: {
    type: Date,
    required: false
  },
  
  photoPath: {
    type: String,
    default: null
  },
  photoData: {
    type: String, // Base64 encoded image
    default: null
  },
  photoUploaded: {
    type: Boolean,
    default: false
  },
  photoUploadDate: {
    type: Date,
    default: null
  },
  
  // Color vision test images
  colorVisionTestImages: [{
    imageData: String, // Base64 encoded image
    capturedAt: Date
  }],
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentCompleted: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentAmount: {
    type: Number,
    default: 500
  },
  paymentReference: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  colorVisionTestCompleted: {
    type: Boolean,
    default: false
  },
  colorVisionTestDate: {
    type: Date,
    default: null
  },
  learnerTestCompleted: {
    type: Boolean,
    default: false
  },
  learnerTestDate: {
    type: Date,
    default: null
  },
  learnerTestStatus: {
    type: String,
    enum: ['not_taken', 'in_progress', 'passed', 'failed'],
    default: 'not_taken'
  },
  learnerTestScore: {
    type: Number,
    default: null
  },
  learnerTestPassDate: {
    type: Date,
    default: null
  },
  learnerTestAttempts: {
    type: Number,
    default: 0
  },
  learnerLicenseNumber: {
    type: String,
    default: null,
    sparse: true
  },
  learnerLicenseIssueDate: {
    type: Date,
    default: null
  },
  learnerLicenseExpiryDate: {
    type: Date,
    default: null
  },
  roadTestCompleted: {
    type: Boolean,
    default: false
  },
  roadTestDate: {
    type: Date,
    default: null
  },
  roadTestSlot: {
    type: String,
    default: null
  },
  roadTestStatus: {
    type: String,
    enum: ['scheduled', 'verified', 'evaluated', 'passed', 'failed'],
    default: undefined
  },
  verificationOTP: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationPhoto: {
    type: String,
    default: null
  },
  roadTestScore: {
    type: Number,
    default: null
  },
  roadTestEvaluationQuestions: [{
    question: String,
    rating: Number
  }],
  roadTestEvaluated: {
    type: Boolean,
    default: false
  },
  roadTestEvaluatedAt: {
    type: Date,
    default: null
  },
  roadTestPassed: {
    type: Boolean,
    default: null
  },
  
  learnerLicenseDownloaded: {
    type: Boolean,
    default: false
  },
  learnerLicenseDownloadDate: {
    type: Date,
    default: null
  },
  drivingLicenseDownloaded: {
    type: Boolean,
    default: false
  },
  drivingLicenseDownloadDate: {
    type: Date,
    default: null
  },
  
  applicationStatus: {
    type: String,
    enum: ['draft', 'registration_complete', 'slots_booked', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'road_test_scheduled'],
    default: 'draft'
  }
});

ApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = 'APP' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

ApplicationSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

ApplicationSchema.pre('save', function(next) {
  if (this.paymentStatus === 'completed' && !this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

ApplicationSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Application', ApplicationSchema);