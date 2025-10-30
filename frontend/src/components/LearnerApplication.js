import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DateSelector from './DateSelector';
import './LearnerApplication.css';

const LearnerApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    applicationType: '',
    colorTestDate: '',
    learnerTestDate: ''
  });

  // Status states
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  
  // Page states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  
  // Other states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Calculate payment fees based on application type
  const getPaymentFees = (applicationType) => {
    const fees = {
      'Two Wheeler': 500,
      'Four Wheeler': 1000,
      'Two Cum Four Wheeler': 800,
      'Heavy Vehicle': 1500,
      'Light Motor Vehicle': 1200
    };
    return fees[applicationType] || 500;
  };

  useEffect(() => {
    // Get user data from navigation state
    if (location.state && location.state.userData) {
      setUserData(location.state.userData);
      checkExistingApplication(location.state.userData.digilockerID);
    } else {
      // Redirect to home if no user data
      navigate('/');
    }
  }, [location, navigate]);

  // Check if user has already applied
  const checkExistingApplication = async (digilockerID) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/applications/user/${digilockerID}`);
      if (response.data.success) {
        // User has already applied, redirect to dashboard
        alert('You have already applied for learner license. Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              userData: userData || location.state.userData,
              completedSteps: ['apply-learner'],
              testDates: {
                colorTestDate: response.data.data.colorTestDate,
                learnerTestDate: response.data.data.learnerTestDate
              }
            } 
          });
        }, 2000);
      }
    } catch (error) {
      // No existing application found, user can proceed with new application
      console.log('No existing application found, user can apply');
    }
  };

  // Upload photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Simple validation
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsPhotoUploaded(true);
    alert('Photo uploaded successfully!');
  };

  // Generate OTP for phone verification
  const generateOTP = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setErrors({ phone: 'Please enter valid 10-digit phone number' });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setErrors({ phone: 'Phone number should start with 6-9 and be 10 digits' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/generate', {
        phone: formData.phone
      });

      setGeneratedOTP(response.data.otp);
      setShowOTP(true);
      setErrors({});
      alert(`OTP generated: ${response.data.otp}`);
    } catch (error) {
      setErrors({ phone: 'Failed to generate OTP' });
    }
    setIsLoading(false);
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!enteredOTP) {
      alert('Please enter OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/verify', {
        phone: formData.phone,
        otp: enteredOTP
      });

      if (response.data.success) {
        setIsPhoneVerified(true);
        setShowOTP(false);
        alert('Phone number verified successfully!');
      }
    } catch (error) {
      alert('Invalid OTP. Please try again.');
    }
    setIsLoading(false);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    
    if (!isPhotoUploaded) newErrors.photo = 'Please upload photo';
    if (!isPhoneVerified) newErrors.phone = 'Please verify phone number';
    if (!formData.email || !validateEmail(formData.email)) newErrors.email = 'Please enter valid email';
    if (!formData.address.trim()) newErrors.address = 'Please enter address';
    if (!formData.state.trim()) newErrors.state = 'Please enter state';
    if (!formData.district.trim()) newErrors.district = 'Please enter district';
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Please enter valid 6-digit pincode';
    if (!formData.applicationType) newErrors.applicationType = 'Please select application type';
    if (!formData.colorTestDate) newErrors.colorTestDate = 'Please select color test date';
    if (!formData.learnerTestDate) newErrors.learnerTestDate = 'Please select learner test date';
    if (!agreementAccepted) newErrors.agreement = 'Please accept the terms and conditions';
    
    // Validate learner test date is after color test date
    if (formData.colorTestDate && formData.learnerTestDate) {
      if (new Date(formData.learnerTestDate) <= new Date(formData.colorTestDate)) {
        newErrors.learnerTestDate = 'Learner test date must be after color test date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Submit application to backend
      const applicationData = {
        digilocker: userData.digilockerID,
        fullName: userData.fullName,
        fatherName: userData.fatherName,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        applicationType: formData.applicationType,
        colorTestDate: formData.colorTestDate,
        learnerTestDate: formData.learnerTestDate,
        isDigilockerVerified: true,
        isPhoneVerified: isPhoneVerified,
        photoUploaded: isPhotoUploaded
      };

      const response = await axios.post('http://localhost:5001/api/applications/', applicationData);

      if (response.data.success) {
        const regNumber = response.data.data.applicationNumber || 'REG' + Date.now();
        setRegistrationNumber(regNumber);
        setShowPaymentPage(true);
        setLoading(false);
      } else {
        setErrors({ submit: response.data.message });
        setLoading(false);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const backendErrors = {};
          error.response.data.errors.forEach(err => {
            backendErrors.submit = err;
          });
          setErrors(backendErrors);
        } else {
          setErrors({ submit: error.response.data.message });
        }
      } else {
        setErrors({ submit: 'Failed to submit application. Please try again.' });
      }
      setLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    setLoading(true);
    
    // Process payment
    setTimeout(() => {
      const txnNumber = 'TXN' + Date.now();
      setTransactionNumber(txnNumber);
      setShowPaymentPage(false);
      setShowSuccessPage(true);
      setLoading(false);
    }, 2000);
  };

  const goBackToDashboard = () => {
    navigate('/dashboard', { 
      state: { 
        userData: userData,
        completedSteps: ['apply-learner'],
        testDates: {
          colorTestDate: formData.colorTestDate,
          learnerTestDate: formData.learnerTestDate
        }
      } 
    });
  };

  // Success Page
  if (showSuccessPage) {
    return (
      <div className="success-page">
        <div className="success-container">
          <h2>Application Submitted Successfully!</h2>
          <div className="success-details">
            <p><strong>Application Number:</strong> {registrationNumber}</p>
            <p><strong>Transaction Number:</strong> {transactionNumber}</p>
            <p><strong>Status:</strong> Learner License Application Submitted</p>
          </div>
          <div className="success-actions">
            <button 
              className="btn-primary" 
              onClick={goBackToDashboard}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Page
  if (showPaymentPage) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <h2>Payment Details</h2>
          <div className="payment-info">
            <p><strong>Application Type:</strong> {formData.applicationType}</p>
            <p><strong>Payment Amount:</strong> ₹{getPaymentFees(formData.applicationType)}</p>
            <p><strong>Application for:</strong> Learner License</p>
          </div>
          <div className="payment-buttons">
            <button 
              className="btn-primary" 
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${getPaymentFees(formData.applicationType)}`}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowPaymentPage(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="learner-application">
      <div className="application-header">
        <button className="back-btn" onClick={goBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h2>Learner License Application</h2>
      </div>

      <div className="application-content">
        <div className="user-info-card">
          <h3>Verified Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Full Name:</span>
              <span className="value">{userData.fullName}</span>
            </div>
            <div className="info-item">
              <span className="label">Father's Name:</span>
              <span className="value">{userData.fatherName}</span>
            </div>
            <div className="info-item">
              <span className="label">Date of Birth:</span>
              <span className="value">
                {new Date(userData.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Gender:</span>
              <span className="value">{userData.gender}</span>
            </div>
            <div className="info-item">
              <span className="label">DigiLocker ID:</span>
              <span className="value">{userData.digilockerID}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {/* Photo Upload */}
          <div className="form-section">
            <h3>Upload Photo</h3>
            <div className="form-group">
              <label>Upload Recent Photo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isPhotoUploaded}
              />
              {isPhotoUploaded && <span className="success">Photo uploaded</span>}
              {errors.photo && <span className="error">{errors.photo}</span>}
            </div>
          </div>

          {/* Phone Verification */}
          <div className="form-section">
            <h3>Phone Verification</h3>
            <div className="form-group">
              <label>Phone Number:</label>
              <div className="input-with-button">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                  disabled={isPhoneVerified}
                />
                <button
                  type="button"
                  onClick={generateOTP}
                  disabled={isPhoneVerified || showOTP || isLoading}
                  className="btn-verify"
                >
                  {isPhoneVerified ? 'Verified' : 'Verify'}
                </button>
              </div>
              {errors.phone && <span className="error">{errors.phone}</span>}

              {/* OTP Input */}
              {showOTP && (
                <div className="otp-section">
                  <p>OTP sent: <strong>{generatedOTP}</strong></p>
                  <div className="input-with-button">
                    <input
                      type="text"
                      value={enteredOTP}
                      onChange={(e) => setEnteredOTP(e.target.value)}
                      placeholder="Enter OTP"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      onClick={verifyOTP}
                      disabled={isLoading}
                      className="btn-verify"
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h3>Additional Information</h3>
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Address:</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address"
                rows="3"
              />
              {errors.address && <span className="error">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State:</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
                {errors.state && <span className="error">{errors.state}</span>}
              </div>

              <div className="form-group">
                <label>District:</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                />
                {errors.district && <span className="error">{errors.district}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>PIN Code:</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Enter 6-digit PIN code"
                maxLength="6"
              />
              {errors.pincode && <span className="error">{errors.pincode}</span>}
            </div>
          </div>

          {/* Application Details */}
          <div className="form-section">
            <h3>Application Details</h3>
            
            <div className="form-group">
              <label>Application Type:</label>
              <select
                name="applicationType"
                value={formData.applicationType}
                onChange={handleChange}
              >
                <option value="">Select Application Type</option>
                <option value="Two Wheeler">Two Wheeler</option>
                <option value="Four Wheeler">Four Wheeler</option>
                <option value="Two Cum Four Wheeler">Two Cum Four Wheeler</option>
                <option value="Heavy Vehicle">Heavy Vehicle</option>
                <option value="Light Motor Vehicle">Light Motor Vehicle</option>
              </select>
              {errors.applicationType && <span className="error">{errors.applicationType}</span>}
            </div>

            {/* Test Date Selection */}
            <div className="form-section">
              <h3>Select Test Dates</h3>
              <p className="section-description">
                Choose available dates for your tests. Each test has a maximum of 5 slots per day.
              </p>
              
              <DateSelector
                testType="colorVision"
                userData={userData}
                selectedDate={formData.colorTestDate}
                onDateSelected={(date) => {
                  setFormData(prev => ({
                    ...prev,
                    colorTestDate: date.toISOString().split('T')[0]
                  }));
                  setErrors(prev => ({ ...prev, colorTestDate: '' }));
                }}
              />
              
              {formData.colorTestDate && (
                <DateSelector
                  testType="learnerTest"
                  userData={userData}
                  selectedDate={formData.learnerTestDate}
                  onDateSelected={(date) => {
                    setFormData(prev => ({
                      ...prev,
                      learnerTestDate: date.toISOString().split('T')[0]
                    }));
                    setErrors(prev => ({ ...prev, learnerTestDate: '' }));
                  }}
                />
              )}
              
              {errors.colorTestDate && <div className="error-message">{errors.colorTestDate}</div>}
              {errors.learnerTestDate && <div className="error-message">{errors.learnerTestDate}</div>}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="form-section">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                />
                I agree to the terms and conditions and declare that all information provided is correct.
              </label>
              {errors.agreement && <span className="error">{errors.agreement}</span>}
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !isPhotoUploaded || !isPhoneVerified || !agreementAccepted}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={goBackToDashboard}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
          
          {errors.submit && <div className="error submit-error">{errors.submit}</div>}
        </form>
      </div>
    </div>
  );
};

export default LearnerApplication;