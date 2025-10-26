// In-memory OTP storage (for demo purposes)
// In production, use Redis or a database
const otpStore = new Map();

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired OTPs (older than 10 minutes)
function cleanupExpiredOTPs() {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.timestamp > tenMinutes) {
      otpStore.delete(phone);
    }
  }
}

// Generate and store OTP for phone verification
async function generateOTPForPhone(phone) {
  try {
    // Clean up expired OTPs
    cleanupExpiredOTPs();
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Store OTP in memory with timestamp
    otpStore.set(phone, {
      otp,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      otp, // In real implementation, this would be sent via SMS
      message: `OTP ${otp} generated for phone ${phone}. Valid for 10 minutes.`
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      message: 'Failed to generate OTP. Please try again.'
    };
  }
}

// Verify OTP for phone number
async function verifyOTPForPhone(phone, otp) {
  try {
    // Clean up expired OTPs
    cleanupExpiredOTPs();
    
    // Get OTP data for this phone
    const otpData = otpStore.get(phone);
    
    if (!otpData) {
      return {
        success: false,
        message: 'Invalid OTP or phone number'
      };
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
    
    // Check if OTP is expired (10 minutes)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - otpData.timestamp > tenMinutes) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // OTP is valid, delete it from store
    otpStore.delete(phone);
    
    return {
      success: true,
      message: 'Phone number verified successfully'
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    };
  }
}

module.exports = {
  generateOTPForPhone,
  verifyOTPForPhone,
  cleanupExpiredOTPs
};