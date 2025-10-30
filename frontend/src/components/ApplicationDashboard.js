import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestDateSelector from './TestDateSelector';
import ColorVisionTest from './ColorVisionTest';
import './ApplicationDashboard.css';

const ApplicationDashboard = ({ userSession, onLogout }) => {
  const [showDashboard, setShowDashboard] = useState(true); // Show dashboard menu by default
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showColorTest, setShowColorTest] = useState(false);
  
  const userData = userSession?.userData || {};
  const digiLockerId = userSession?.digiLockerId || '';
  
  // Form data for registration
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    photo: null,
    vehicleType: '',
    colorTestDate: '',
    learnerTestDate: '',
    colorTestPassed: false,
    learnerTestPassed: false
  });

  // Verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // OTP states
  const [showOTP, setShowOTP] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [applicationNumber, setApplicationNumber] = useState('');

  // Load existing application if any
  useEffect(() => {
    if (userSession?.hasExistingApplication && userSession?.applicationData) {
      const appData = userSession.applicationData;
      
      setFormData({
        phone: appData.phone || '',
        email: appData.email || '',
        address: appData.address || '',
        state: appData.state || '',
        district: appData.district || '',
        pincode: appData.pincode || '',
        photo: null,
        vehicleType: appData.applicationType || '',
        colorTestDate: appData.colorTestDate || '',
        learnerTestDate: appData.learnerTestDate || '',
        colorTestPassed: appData.colorVisionTestCompleted || false,
        learnerTestPassed: appData.learnerTestCompleted || false
      });
      
      setApplicationNumber(appData.applicationNumber || '');
      
      const completed = [];
      
      if (appData.applicationStatus && ['registration_complete', 'slots_booked', 'submitted', 'under_review', 'approved', 'rejected', 'completed'].includes(appData.applicationStatus)) {
        completed.push(1);
        setPhoneVerified(true);
        setPhotoUploaded(true);
      }
      
      if (appData.colorTestDate && appData.learnerTestDate && appData.paymentStatus === 'completed') {
        completed.push(2);
      }
      
      if (appData.colorVisionTestCompleted) {
        completed.push(3);
      }
      
      if (appData.learnerTestCompleted) {
        completed.push(4);
      }
      
      if (appData.roadTestCompleted || appData.applicationStatus === 'completed') {
        completed.push(5);
      }
      
      setCompletedSteps(completed);
      
      const nextIncompleteStep = completed.length < 5 ? completed.length + 1 : 5;
      setCurrentStep(nextIncompleteStep);
    }
  }, [userSession]);

  // Check if step is unlocked
  const isStepUnlocked = (step) => {
    if (step === 1) return true;
    return completedSteps.includes(step - 1);
  };

  // Complete step without auto-navigation
  const completeCurrentStep = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ photo: 'Only JPG, JPEG, and PNG formats are allowed' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ photo: 'Image size must be less than 10MB' });
      return;
    }

    setFormData(prev => ({ ...prev, photo: file }));
    setPhotoUploaded(true);
    setErrors(prev => ({ ...prev, photo: '' }));
  };

  // Generate OTP
  const generateOTP = async () => {
    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      setErrors({ phone: 'Enter valid 10-digit mobile number' });
      return;
    }

    setOtpLoading(true);
    setErrors(prev => ({ ...prev, phone: '' }));

    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/generate', {
        phone: formData.phone
      });

      if (response.data.success) {
        setShowOTP(true);
        alert(`OTP: ${response.data.otp}`);
      }
    } catch (error) {
      setErrors({ phone: 'Failed to send OTP. Try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!enteredOTP) {
      setErrors({ otp: 'Enter OTP' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/verify', {
        phone: formData.phone,
        otp: enteredOTP
      });

      if (response.data.success) {
        setPhoneVerified(true);
        setShowOTP(false);
        setEnteredOTP('');
        setErrors(prev => ({ ...prev, otp: '' }));
      }
    } catch (error) {
      setErrors({ otp: 'Invalid OTP' });
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Complete Registration
  const completeRegistration = async () => {
    const newErrors = {};
    
    // Photo and phone are optional - removed from validation
    
    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Select vehicle type';
    }
    if (!formData.email) {
      newErrors.email = 'Email required';
    }
    if (!formData.address) {
      newErrors.address = 'Address required';
    }
    if (!formData.state) {
      newErrors.state = 'State required';
    }
    if (!formData.district) {
      newErrors.district = 'District required';
    }
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Valid 6-digit pincode required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const missingFields = Object.keys(newErrors).join(', ');
      setErrors({ ...newErrors, submit: `Please fill: ${missingFields}` });
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        digilocker: digiLockerId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        applicationType: formData.vehicleType,
        registrationComplete: true
      };

      const response = await axios.post('http://localhost:5001/api/applications/submit', registrationData);

      if (response.data.success) {
        setApplicationNumber(response.data.applicationNumber);
        setShowSuccessMessage(true);
        // Auto-hide success message and go back to dashboard after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
          completeCurrentStep(1);
          setShowDashboard(true); // Go back to dashboard
        }, 5000);
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate payment amount based on vehicle type
  const calculatePaymentAmount = (vehicleType) => {
    const amounts = {
      'Two Wheeler': 500,
      'Four Wheeler': 1000,
      'Two Cum Four Wheeler': 1200,
      'Light Motor Vehicle': 1500,
      'Heavy Vehicle': 2000
    };
    return amounts[vehicleType] || 500;
  };

  // STEP 2: Book Slot for Color Vision + Learner Test and Process Payment
  const bookSlotsAndPay = async () => {
    const newErrors = {};
    
    if (!formData.colorTestDate) newErrors.colorTestDate = 'Select color test date';
    if (!formData.learnerTestDate) newErrors.learnerTestDate = 'Select learner test date';
    
    // Validate that learner test is after color test
    if (formData.colorTestDate && formData.learnerTestDate) {
      const colorDate = new Date(formData.colorTestDate);
      const learnerDate = new Date(formData.learnerTestDate);
      
      if (learnerDate <= colorDate) {
        newErrors.learnerTestDate = 'Learner test date must be after color test date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Book slots
      const bookingResponse = await axios.post('http://localhost:5001/api/applications/book-slots', {
        digilocker: digiLockerId,
        colorTestDate: formData.colorTestDate,
        learnerTestDate: formData.learnerTestDate
      });

      if (bookingResponse.data.success) {
        // Calculate payment amount
        const amount = calculatePaymentAmount(formData.vehicleType);
        setPaymentAmount(amount);
        
        // Process dummy payment
        const paymentResponse = await axios.post('http://localhost:5001/api/payments', {
          applicationNumber: applicationNumber,
          amount: amount,
          vehicleType: formData.vehicleType
        });

        if (paymentResponse.data.success) {
          setPaymentReference(paymentResponse.data.paymentReferenceNumber);
          setShowPaymentModal(true);
          completeCurrentStep(2);
        }
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Booking or payment failed' });
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Take Color Vision Test
  const takeColorTest = () => {
    setShowColorTest(true);
    setShowDashboard(false);
  };

  // Handle test completion
  const handleTestComplete = (result) => {
    setShowColorTest(false);
    setShowDashboard(true);
    
    if (result.success && result.passed) {
      setFormData(prev => ({ ...prev, colorTestPassed: true }));
      completeCurrentStep(3);
      alert(`✅ ${result.message}\n\nScore: ${result.score.toFixed(1)}%`);
    } else {
      alert(`❌ Test Failed\n\nScore: ${result.score.toFixed(1)}%\nYou need 70% to pass.\n\n${result.message || 'Please try again.'}`);
    }
  };

  // Handle test cancellation
  const handleTestCancel = () => {
    if (window.confirm('Are you sure you want to cancel the test? Your progress will be lost.')) {
      setShowColorTest(false);
      setShowDashboard(true);
    }
  };

  // STEP 4: Take Learner Test
  const takeLearnerTest = async () => {
    setLoading(true);
    
    try {
      // Simulate learner test
      const passed = Math.random() > 0.2; // 80% pass rate
      
      const response = await axios.post('http://localhost:5001/api/applications/learner-test-result', {
        digilocker: digiLockerId,
        passed: passed
      });

      if (response.data.success && passed) {
        setFormData(prev => ({ ...prev, learnerTestPassed: true }));
        completeCurrentStep(4);
      } else {
        setErrors({ test: 'Learner test failed. Please retry.' });
      }
    } catch (error) {
      setErrors({ test: 'Test submission failed' });
    } finally {
      setLoading(false);
    }
  };

  // STEP 5: Apply for Road Test
  const applyForRoadTest = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5001/api/applications/apply-road-test', {
        digilocker: digiLockerId
      });

      if (response.data.success) {
        completeCurrentStep(5);
        alert('Road test application submitted successfully!');
      }
    } catch (error) {
      setErrors({ submit: 'Road test application failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Color Vision Test Interface */}
      {showColorTest && (
        <ColorVisionTest
          applicationNumber={applicationNumber}
          digiLockerId={digiLockerId}
          onTestComplete={handleTestComplete}
          onCancel={handleTestCancel}
        />
      )}

      {/* Main Dashboard - Hidden when test is active */}
      {!showColorTest && (
        <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Drive-Ease</h1>
          </div>
          <div className="user-info">
            <div className="user-details">
              <p className="user-name">{userData.fullName}</p>
              <p className="user-id">DigiLocker: {digiLockerId}</p>
            </div>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>

      {/* Dashboard Menu View */}
      {showDashboard ? (
        <div className="dashboard-menu">
          <div className="welcome-section">
            <h2>Welcome, {userData.fullName}!</h2>
            <p>Complete the following steps to apply for your driving license</p>
          </div>

          <div className="steps-grid">
            {[
              { id: 1, title: 'Registration', desc: 'Complete profile & upload photo' },
              { id: 2, title: 'Book Slot & Payment', desc: 'Book test slots & make payment' },
              { id: 3, title: 'Colour Vision Test', desc: 'Attend colour vision test' },
              { id: 4, title: 'Learner Test', desc: 'Complete learner test' },
              { id: 5, title: 'Apply for Road Test', desc: 'Submit road test application' }
            ].map(step => {
              const isCompleted = completedSteps.includes(step.id);
              const isUnlocked = isStepUnlocked(step.id);
              const isCurrent = isUnlocked && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={`step-card ${isCompleted ? 'completed' : ''} ${isUnlocked && !isCompleted ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  onClick={() => {
                    if (isUnlocked && !isCompleted) {
                      setCurrentStep(step.id);
                      setShowDashboard(false);
                    }
                  }}
                  style={{ cursor: (isUnlocked && !isCompleted) ? 'pointer' : 'not-allowed' }}
                >
                  <div className="step-content-card">
                    <div className="step-header">
                      <h3>Step {step.id}</h3>
                      {isCompleted && <span className="check-badge">✓</span>}
                      {!isUnlocked && <span className="lock-badge">🔒</span>}
                    </div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                    {isCurrent && <button className="start-btn">Start Now</button>}
                    {isCompleted && <span className="status-text completed-text">Completed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          {/* Back to Dashboard Button */}
          <div className="back-to-dashboard">
            <button onClick={() => setShowDashboard(true)} className="back-btn">
              Back to Dashboard
            </button>
          </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Error Alert */}
        {errors.submit && (
          <div className="alert-error">
            <span className="alert-icon">!</span>
            <span className="alert-message">{errors.submit}</span>
            <button className="alert-close" onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}>×</button>
          </div>
        )}
        
        {/* STEP 1: Registration */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Step 1: Complete Registration</h2>
            <p className="step-description">Upload your photo and provide contact details</p>

            <div className="form-section">
              <div className="user-info-display">
                <h3>Personal Information (from DigiLocker)</h3>
                <div className="user-info-grid">
                  <div className="info-card">
                    <div className="info-label">Full Name</div>
                    <div className="info-value">{userData.fullName || 'N/A'}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Date of Birth</div>
                    <div className="info-value">{userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Gender</div>
                    <div className="info-value">{userData.gender || 'N/A'}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Blood Group</div>
                    <div className="info-value">{userData.bloodGroup || 'N/A'}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Father's Name</div>
                    <div className="info-value">{userData.fatherName || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label>Upload Photo (Optional - Max 10MB, JPG/PNG/JPEG only)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoUpload}
                  className={errors.photo ? 'error' : ''}
                />
                {photoUploaded && <span className="success-text">Photo uploaded</span>}
                {errors.photo && <span className="error-text">{errors.photo}</span>}
              </div>

              {/* Vehicle Type */}
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className={errors.vehicleType ? 'error' : ''}
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Four Wheeler">Four Wheeler (Car)</option>
                  <option value="Two Cum Four Wheeler">Two Cum Four Wheeler</option>
                  <option value="Light Motor Vehicle">Light Motor Vehicle (LMV)</option>
                  <option value="Heavy Vehicle">Heavy Vehicle</option>
                </select>
                {errors.vehicleType && <span className="error-text">{errors.vehicleType}</span>}
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label>Mobile Number (Optional)</label>
                <div className="phone-verification">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit mobile number"
                    disabled={phoneVerified}
                    className={errors.phone ? 'error' : ''}
                  />
                  {!phoneVerified && (
                    <button
                      onClick={generateOTP}
                      disabled={otpLoading || !formData.phone}
                      className="verify-btn"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                  {phoneVerified && <span className="success-text">Verified</span>}
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              {/* OTP Input */}
              {showOTP && !phoneVerified && (
                <div className="form-group">
                  <label>Enter OTP *</label>
                  <div className="otp-verification">
                    <input
                      type="text"
                      value={enteredOTP}
                      onChange={(e) => setEnteredOTP(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      className={errors.otp ? 'error' : ''}
                    />
                    <button onClick={verifyOTP} disabled={loading} className="verify-btn">
                      Verify OTP
                    </button>
                  </div>
                  {errors.otp && <span className="error-text">{errors.otp}</span>}
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* Address */}
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  rows="3"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              {/* State, District, Pincode */}
              <div className="form-row">
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className={errors.state ? 'error' : ''}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label>District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="District"
                    className={errors.district ? 'error' : ''}
                  />
                  {errors.district && <span className="error-text">{errors.district}</span>}
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength="6"
                    className={errors.pincode ? 'error' : ''}
                  />
                  {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                </div>
              </div>

              <button
                onClick={completeRegistration}
                disabled={loading}
                className="primary-btn"
              >
                {loading ? 'Submitting...' : 'Complete Registration'}
              </button>

              {/* Success Message */}
              {showSuccessMessage && applicationNumber && (
                <div className="success-modal">
                  <div className="success-modal-content">
                    <div className="success-icon">✓</div>
                    <h3>Registration Successful!</h3>
                    <p className="success-message">Your application has been registered successfully.</p>
                    <div className="application-number-display">
                      <label>Application Number:</label>
                      <span className="app-number">{applicationNumber}</span>
                    </div>
                    <p className="redirect-message">Redirecting to next step in 5 seconds...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Slot Booking */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Step 2: Book Test Slots</h2>
            <p className="step-description">Select dates for your color vision and learner tests</p>

            <div className="form-section">
              <div className="form-group">
                <label>Color Vision Test Date *</label>
                <TestDateSelector
                  selectedDate={formData.colorTestDate}
                  onDateSelect={(date) => setFormData(prev => ({ ...prev, colorTestDate: date }))}
                  minDaysFromNow={1}
                  testType="colorVision"
                />
                {errors.colorTestDate && <span className="error-text">{errors.colorTestDate}</span>}
              </div>

              <div className="form-group">
                <label>Learner Test Date *</label>
                <TestDateSelector
                  selectedDate={formData.learnerTestDate}
                  onDateSelect={(date) => setFormData(prev => ({ ...prev, learnerTestDate: date }))}
                  minDaysFromNow={2}
                  testType="learnerTest"
                />
                {errors.learnerTestDate && <span className="error-text">{errors.learnerTestDate}</span>}
              </div>

              {/* Payment Details */}
              <div className="payment-preview">
                <h4>Payment Details</h4>
                <div className="payment-info">
                  <div className="payment-row">
                    <span>Vehicle Type:</span>
                    <strong>{formData.vehicleType}</strong>
                  </div>
                  <div className="payment-row">
                    <span>Application Fee:</span>
                    <strong>₹{calculatePaymentAmount(formData.vehicleType)}</strong>
                  </div>
                </div>
              </div>

              {errors.submit && <div className="error-message">{errors.submit}</div>}

              <button
                onClick={bookSlotsAndPay}
                disabled={loading}
                className="primary-btn"
              >
                {loading ? 'Processing...' : 'Book Slots & Proceed to Payment'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Color Vision Test */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>Step 3: Color Vision Test</h2>
            <p className="step-description">Take your color vision test</p>

            <div className="test-section">
              <div className="test-info">
                <p>Test Date: {formData.colorTestDate ? new Date(formData.colorTestDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not selected'}</p>
                <p>Please arrive 15 minutes before your test time</p>
                <p>Test will be conducted online</p>
              </div>

              {!formData.colorTestPassed && (
                <>
                  {errors.test && <div className="error-message">{errors.test}</div>}
                  <button
                    onClick={takeColorTest}
                    disabled={loading}
                    className="primary-btn"
                  >
                    {loading ? 'Processing...' : 'Start Color Vision Test'}
                  </button>
                </>
              )}

              {formData.colorTestPassed && (
                <div className="success-message">
                  ✓ Color vision test passed! Proceeding to learner test.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Learner Test */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>Step 4: Learner License Test</h2>
            <p className="step-description">Take your learner's license written test</p>

            <div className="test-section">
              <div className="test-info">
                <p>Test Date: {formData.learnerTestDate ? new Date(formData.learnerTestDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not selected'}</p>
                <p>Test consists of multiple choice questions</p>
                <p>Duration: 30 minutes</p>
                <p>Passing Score: 60%</p>
              </div>

              {!formData.learnerTestPassed && (
                <>
                  {errors.test && <div className="error-message">{errors.test}</div>}
                  <button
                    onClick={takeLearnerTest}
                    disabled={loading}
                    className="primary-btn"
                  >
                    {loading ? 'Processing...' : 'Start Learner Test'}
                  </button>
                </>
              )}

              {formData.learnerTestPassed && (
                <div className="success-message">
                  ✓ Learner test passed! You can now apply for road test.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Road Test Application */}
        {currentStep === 5 && (
          <div className="step-content">
            <h2>Step 5: Apply for Road Test</h2>
            <p className="step-description">Submit your road test application</p>

            <div className="road-test-section">
              <div className="completion-summary">
                <h3>✓ Completed Steps:</h3>
                <ul>
                  <li>✓ Registration Complete</li>
                  <li>✓ Test Slots Booked</li>
                  <li>✓ Color Vision Test Passed</li>
                  <li>✓ Learner Test Passed</li>
                </ul>
              </div>

              <div className="test-info">
                <p>🎯 You are now eligible for the road test</p>
                <p>🚗 A driving examiner will test your practical driving skills</p>
                <p>📱 You will be notified of your road test date via SMS/Email</p>
              </div>

              {!completedSteps.includes(5) && (
                <>
                  {errors.submit && <div className="error-message">{errors.submit}</div>}
                  <button
                    onClick={applyForRoadTest}
                    disabled={loading}
                    className="primary-btn"
                  >
                    {loading ? 'Submitting...' : 'Apply for Road Test'}
                  </button>
                </>
              )}

              {completedSteps.includes(5) && (
                <div className="success-message">
                  <h3>Congratulations!</h3>
                  <p>Your road test application has been submitted successfully.</p>
                  <p>Application Number: <strong>{applicationNumber}</strong></p>
                  <p>You will receive further instructions via email and SMS.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      )}
      </div>
      )}

      {/* Payment Success Modal - Moved outside step conditions */}
      {showPaymentModal && (
        <div className="success-modal">
          <div className="success-modal-content">
            <div className="success-icon">✓</div>
            <h3>Booking & Payment Successful!</h3>
            <p className="success-message">Your test slots have been booked and payment processed successfully.</p>
            <div className="payment-details-box">
              <div className="detail-item">
                <label>Application Number:</label>
                <span className="detail-value">{applicationNumber}</span>
              </div>
              <div className="detail-item">
                <label>Color Test Date:</label>
                <span className="detail-value">{formData.colorTestDate && new Date(formData.colorTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="detail-item">
                <label>Learner Test Date:</label>
                <span className="detail-value">{formData.learnerTestDate && new Date(formData.learnerTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="detail-item">
                <label>Payment Reference:</label>
                <span className="detail-value">{paymentReference}</span>
              </div>
              <div className="detail-item">
                <label>Amount Paid:</label>
                <span className="detail-value">₹{paymentAmount}</span>
              </div>
            </div>
            <button 
              className="primary-btn" 
              onClick={() => {
                setShowPaymentModal(false);
                setShowDashboard(true);
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ApplicationDashboard;
