import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestDateSelector from './TestDateSelector';
import ColorVisionTest from './ColorVisionTest';
import './ApplicationDashboard.css';

const ApplicationDashboard = ({ userSession, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showColorTest, setShowColorTest] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const userData = userSession?.userData || {};
  const digiLockerId = userSession?.digiLockerId || '';
  const username = userData.fullName || 'User';
  
  const [formData, setFormData] = useState({
    colorTestDate: '',
    learnerTestDate: '',
    colorTestPassed: false,
    learnerTestPassed: false
  });
  
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [applicationNumber, setApplicationNumber] = useState('');

  useEffect(() => {
    if (userSession?.hasExistingApplication && userSession?.applicationData) {
      const appData = userSession.applicationData;
      
      setFormData({
        colorTestDate: appData.colorTestDate || '',
        learnerTestDate: appData.learnerTestDate || '',
        colorTestPassed: appData.colorVisionTestCompleted || false,
        learnerTestPassed: appData.learnerTestCompleted || false
      });
      
      setApplicationNumber(appData.applicationNumber || '');
      
      if (appData.paymentStatus === 'completed') {
        setPaymentCompleted(true);
      }
      
      const completed = [];
      if (appData.colorTestDate && appData.learnerTestDate && appData.paymentStatus === 'completed') {
        completed.push(1);
      }
      if (appData.colorVisionTestCompleted) {
        completed.push(2);
      }
      setCompletedSteps(completed);
      
      let calculatedProgress = 0;
      if (appData.colorTestDate && appData.learnerTestDate && appData.paymentStatus === 'completed') {
        calculatedProgress = 20;
      }
      if (appData.colorVisionTestCompleted) {
        calculatedProgress = 35;
      }
      setProgress(calculatedProgress);
      
      const nextIncompleteStep = completed.length < 2 ? completed.length + 1 : 2;
      setCurrentStep(nextIncompleteStep);
    }
  }, [userSession]);

  const isStepUnlocked = (step) => {
    if (step === 1) return true;
    return completedSteps.includes(step - 1);
  };

  const completeCurrentStep = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

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

  const bookSlotsAndPay = async () => {
    const newErrors = {};
    
    if (!formData.colorTestDate) newErrors.colorTestDate = 'Select color test date';
    if (!formData.learnerTestDate) newErrors.learnerTestDate = 'Select learner test date';
    
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
      const bookingResponse = await axios.post('http://localhost:5001/api/applications/book-slots', {
        digilocker: digiLockerId,
        colorTestDate: formData.colorTestDate,
        learnerTestDate: formData.learnerTestDate
      });

      if (bookingResponse.data.success) {
        const vehicleType = userSession?.applicationData?.applicationType || 'Two Wheeler';
        const amount = calculatePaymentAmount(vehicleType);
        setPaymentAmount(amount);
        
        const paymentReferenceNumber = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);
        setPaymentReference(paymentReferenceNumber);
        
        try {
          await axios.post('http://localhost:5001/api/applications/complete-payment', {
            digilocker: digiLockerId,
            paymentReference: paymentReferenceNumber,
            amount: amount
          });
        } catch (paymentError) {
          console.error('Payment status update failed:', paymentError);
        }
        
        setShowPaymentModal(true);
        setProgress(20);
        completeCurrentStep(1);
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Booking or payment failed' });
    } finally {
      setLoading(false);
    }
  };

  const takeColorTest = () => {
    if (!paymentCompleted) {
      alert('Payment not completed. Please complete payment before attempting the test.');
      return;
    }
    setShowColorTest(true);
    setShowDashboard(false);
  };

  const handleTestComplete = (result) => {
    setShowColorTest(false);
    setShowDashboard(true);
    
    if (result.score >= 70) {
      setFormData(prev => ({ ...prev, colorTestPassed: true }));
      setProgress(35);
      completeCurrentStep(2);
      alert(`Congratulations! Test Passed. Score: ${result.score.toFixed(1)}%`);
    } else {
      alert(`Test Failed. Score: ${result.score.toFixed(1)}%. You need 70% to pass.`);
    }
  };

  const cancelTest = () => {
    setShowColorTest(false);
    setShowDashboard(true);
  };

  return (
    <div className="dashboard-container">
      {showColorTest && (
        <ColorVisionTest
          applicationNumber={applicationNumber}
          digiLockerId={digiLockerId}
          onTestComplete={handleTestComplete}
          onCancel={cancelTest}
        />
      )}

      {!showColorTest && (
        <div>
          <div className="dashboard-header">
            <div className="header-content">
              <div className="logo-section">
                <h1>Drive-Ease</h1>
              </div>
              <div className="user-info">
                <div className="user-details">
                  <p className="user-name">{username}</p>
                  <p className="user-id">Application No: {applicationNumber || 'N/A'}</p>
                </div>
                <button onClick={onLogout} className="logout-btn">Logout</button>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-label">Application Progress</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-milestones">
                <div className={`milestone ${progress >= 20 ? 'reached' : ''}`}>
                  <div className="milestone-dot"></div>
                  <span className="milestone-label">Booking</span>
                </div>
                <div className={`milestone ${progress >= 35 ? 'reached' : ''}`}>
                  <div className="milestone-dot"></div>
                  <span className="milestone-label">Color Test</span>
                </div>
                <div className={`milestone ${progress >= 50 ? 'reached' : ''}`}>
                  <div className="milestone-dot"></div>
                  <span className="milestone-label">Learner Test</span>
                </div>
                <div className={`milestone ${progress >= 65 ? 'reached' : ''}`}>
                  <div className="milestone-dot"></div>
                  <span className="milestone-label">Road Test Application</span>
                </div>
                <div className={`milestone ${progress >= 100 ? 'reached' : ''}`}>
                  <div className="milestone-dot"></div>
                  <span className="milestone-label">Complete</span>
                </div>
              </div>
            </div>
          </div>

          {showDashboard ? (
            <div className="dashboard-menu">
              <div className="welcome-section">
                <h2>Welcome, {username}!</h2>
                <p>Complete the following steps to get your Driving License</p>
              </div>

              <div className="steps-grid">
                {[
                  { id: 1, title: 'Book Slot & Payment', desc: 'Book test slots & make payment' },
                  { id: 2, title: 'Colour Vision Test', desc: 'Attend colour vision test' },
                  { id: 3, title: 'Learner License Test', desc: 'Attend learner license test' },
                  { id: 4, title: 'Apply for Road Test', desc: 'Submit road test application' }
                ].map(step => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isUnlocked = isStepUnlocked(step.id);
                  const isCurrent = isUnlocked && !isCompleted;
                  const isLocked = (step.id === 3 || step.id === 4);

                  return (
                    <div
                      key={step.id}
                      className={`step-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : (isUnlocked && !isCompleted ? 'unlocked' : 'locked')} ${isCurrent && !isLocked ? 'current' : ''}`}
                      onClick={() => {
                        if (!isLocked && isUnlocked && !isCompleted) {
                          setCurrentStep(step.id);
                          setShowDashboard(false);
                        }
                      }}
                      style={{ cursor: (isLocked || !isUnlocked || isCompleted) ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="step-content-card">
                        <div className="step-header">
                          <h3>Step {step.id}</h3>
                          {isCompleted && <span className="check-badge">✓</span>}
                          {(isLocked || !isUnlocked) && <span className="lock-badge">🔒</span>}
                        </div>
                        <h4>{step.title}</h4>
                        <p>{step.desc}</p>
                        {isLocked && <span className="status-text locked-text">Coming Soon</span>}
                        {!isLocked && isCurrent && <button className="start-btn">Start Now</button>}
                        {isCompleted && <span className="status-text completed-text">Completed</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="back-to-dashboard">
                <button onClick={() => setShowDashboard(true)} className="back-btn">
                  Back to Dashboard
                </button>
              </div>

              <div className="dashboard-content">
                {errors.submit && (
                  <div className="alert-error">
                    <span className="alert-icon">!</span>
                    <span className="alert-message">{errors.submit}</span>
                    <button className="alert-close" onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}>×</button>
                  </div>
                )}
                
                {currentStep === 1 && (
                  <div className="step-content">
                    <h2>Step 1: Book Test Slots & Payment</h2>
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

                      <div className="payment-preview">
                        <h4>Payment Details</h4>
                        <div className="payment-info">
                          <div className="payment-row">
                            <span>Vehicle Type:</span>
                            <strong>{userSession?.applicationData?.applicationType || 'Not specified'}</strong>
                          </div>
                          <div className="payment-row">
                            <span>Application Fee:</span>
                            <strong>₹{calculatePaymentAmount(userSession?.applicationData?.applicationType)}</strong>
                          </div>
                        </div>
                      </div>

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

                {currentStep === 2 && (
                  <div className="step-content">
                    <h2>Step 2: Color Vision Test</h2>
                    <p className="step-description">Take your color vision test</p>

                    <div className="test-section">
                      <div className="test-info">
                        <p>Test Date: {formData.colorTestDate || 'Not selected'}</p>
                        <p>Please arrive 15 minutes before your test time</p>
                      </div>

                      {!formData.colorTestPassed && (
                        <button
                          onClick={takeColorTest}
                          disabled={loading}
                          className="primary-btn"
                        >
                          Start Color Vision Test
                        </button>
                      )}

                      {formData.colorTestPassed && (
                        <div className="success-message">
                          ✓ Color vision test passed!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(currentStep === 3 || currentStep === 4) && (
                  <div className="step-content locked-content">
                    <h2>{currentStep === 3 ? 'Learner License Test' : 'Road Test Application'}</h2>
                    <div className="coming-soon-message">
                      <div className="coming-soon-icon">🔒</div>
                      <h3>Coming Soon!</h3>
                      <p>This feature is currently under development.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showPaymentModal && (
        <div className="success-modal">
          <div className="success-modal-content">
            <div className="success-icon">✓</div>
            <h3>Booking & Payment Successful!</h3>
            <p className="success-message">Your test slots have been booked.</p>
            <div className="payment-details-box">
              <div className="detail-item">
                <label>Application Number:</label>
                <span className="detail-value">{applicationNumber}</span>
              </div>
              <div className="detail-item">
                <label>Color Test Date:</label>
                <span className="detail-value">
                  {formData.colorTestDate ? new Date(formData.colorTestDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not selected'}
                </span>
              </div>
              <div className="detail-item">
                <label>Learner Test Date:</label>
                <span className="detail-value">
                  {formData.learnerTestDate ? new Date(formData.learnerTestDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not selected'}
                </span>
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
                setPaymentCompleted(true);
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
