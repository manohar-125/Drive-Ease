const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredOTPs() {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.timestamp > tenMinutes) {
      otpStore.delete(phone);
    }
  }
}

async function generateOTPForPhone(phone) {
  try {
    cleanupExpiredOTPs();
    
    const otp = generateOTP();
    
    otpStore.set(phone, {
      otp,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      otp,
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

async function verifyOTPForPhone(phone, otp) {
  try {
    cleanupExpiredOTPs();
    
    const otpData = otpStore.get(phone);
    
    if (!otpData) {
      return {
        success: false,
        message: 'Invalid OTP or phone number'
      };
    }
    
    if (otpData.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
    
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - otpData.timestamp > tenMinutes) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
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