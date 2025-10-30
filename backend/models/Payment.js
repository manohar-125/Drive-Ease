const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  applicationNumber: {
    type: String,
    required: true
  },
  paymentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Wallet'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  cardDetails: {
    cardNumber: {
      type: String,
      validate: {
        validator: function(v) {
          return /^\d{16}$/.test(v); // 16 digit card number
        },
        message: 'Card number must be 16 digits'
      }
    },
    cardHolderName: String,
    expiryMonth: {
      type: String,
      validate: {
        validator: function(v) {
          return /^(0[1-9]|1[0-2])$/.test(v); // MM format
        },
        message: 'Expiry month must be in MM format (01-12)'
      }
    },
    expiryYear: {
      type: String,
      validate: {
        validator: function(v) {
          return /^\d{4}$/.test(v); // YYYY format
        },
        message: 'Expiry year must be in YYYY format'
      }
    },
    cvv: {
      type: String,
      validate: {
        validator: function(v) {
          return /^\d{3,4}$/.test(v); // 3 or 4 digit CVV
        },
        message: 'CVV must be 3 or 4 digits'
      }
    }
  },
  upiDetails: {
    upiId: {
      type: String,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v);
        },
        message: 'Invalid UPI ID format'
      }
    }
  },
  netBankingDetails: {
    bankName: String,
    accountNumber: String
  },
  walletDetails: {
    walletProvider: {
      type: String,
      enum: ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay', 'Mobikwik']
    },
    walletNumber: String
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  notes: String
}, {
  timestamps: true
});

// Pre-save middleware to generate transaction ID and receipt number
paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate transaction ID
    if (!this.transactionId) {
      this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    
    // Generate receipt number
    if (!this.receiptNumber) {
      this.receiptNumber = 'RCP' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  }
  next();
});

// Virtual for payment fee calculation
paymentSchema.virtual('processingFee').get(function() {
  return Math.round(this.paymentAmount * 0.02); // 2% processing fee
});

// Virtual for total amount including fee
paymentSchema.virtual('totalAmount').get(function() {
  return this.paymentAmount + this.processingFee;
});

// Instance method to process payment (simulation)
paymentSchema.methods.processPayment = async function() {
  try {
    // Payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Random payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      this.paymentStatus = 'completed';
      this.paymentDate = new Date();
      await this.save();
      return {
        success: true,
        message: 'Payment processed successfully',
        transactionId: this.transactionId,
        receiptNumber: this.receiptNumber
      };
    } else {
      this.paymentStatus = 'failed';
      await this.save();
      return {
        success: false,
        message: 'Payment failed. Please try again.',
        transactionId: this.transactionId
      };
    }
  } catch (error) {
    this.paymentStatus = 'failed';
    await this.save();
    throw error;
  }
};

// Static method to get payment fees by application type
paymentSchema.statics.getPaymentFees = function(applicationType) {
  const fees = {
    'Two Wheeler': 500,
    'Four Wheeler': 1000,
    'Heavy Vehicle': 1500,
    'Transport Vehicle': 2000,
    'International Driving Permit': 1000,
    'Renewal': 300,
    'Duplicate': 200
  };
  
  return fees[applicationType] || 500; // Default fee
};

module.exports = mongoose.model('Payment', paymentSchema);