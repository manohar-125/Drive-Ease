import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ApplicationDashboard.css';
import TestDateSelector from './TestDateSelector';
import ColorVisionTest from './ColorVisionTest';
import ColorVisionTestInstructions from './ColorVisionTestInstructions';
import RoadTestApplication from './RoadTestApplication';
import ConfirmationModal from './ConfirmationModal';

const ApplicationDashboard = ({ userSession, onLogout }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showColorTest, setShowColorTest] = useState(false);
  const [showColorInstructions, setShowColorInstructions] = useState(false);
  const [showRoadTestApplication, setShowRoadTestApplication] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasShownResultModal, setHasShownResultModal] = useState(false);
  
  const userData = userSession?.userData || {};
  const digiLockerId = userSession?.digiLockerId || '';
  const username = userData.fullName || 'User';
  
  const [formData, setFormData] = useState({
    colorTestDate: '',
    learnerTestDate: '',
    colorTestPassed: false,
    learnerTestPassed: false,
    learnerTestStatus: 'not_taken',
    learnerTestScore: null,
    learnerTestAttempts: 0,
    learnerLicenseNumber: null,
    roadTestDate: null,
    roadTestSlot: null,
    roadTestStatus: null,
    roadTestPassed: null,
    roadTestScore: null,
    verificationPhoto: null,
    applicationType: ''
  });
  
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [applicationNumber, setApplicationNumber] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState('');
  const [confirmationData, setConfirmationData] = useState(null);

  // Load initial data and refresh when returning from test
  useEffect(() => {
    const loadApplicationData = async () => {
      if (userSession?.hasExistingApplication && digiLockerId) {
        // ALWAYS fetch fresh data from backend to ensure we have latest payment/test status
        let appData = userSession.applicationData; // Fallback to session data
        
        try {
          // Always fetch fresh data from backend
          // Fetch by DigiLocker ID (correct route)
          const response = await axios.get(`http://localhost:5001/api/applications/user/${digiLockerId}`);
          if (response.data.data) {
            appData = response.data.data;
          }
          localStorage.removeItem('learnerTestCompleted'); // Clear any flags
        } catch (error) {
          console.error('Error fetching fresh application data:', error);
        }
        
        setFormData({
          colorTestDate: appData.colorTestDate || '',
          learnerTestDate: appData.learnerTestDate || '',
          colorTestPassed: appData.colorVisionTestCompleted || false,
          learnerTestPassed: appData.learnerTestCompleted || false,
          learnerTestStatus: appData.learnerTestStatus || 'not_taken',
          learnerTestScore: appData.learnerTestScore || null,
          learnerTestAttempts: appData.learnerTestAttempts || 0,
          learnerLicenseNumber: appData.learnerLicenseNumber || null,
          roadTestDate: appData.roadTestDate || null,
          roadTestSlot: appData.roadTestSlot || null,
          roadTestStatus: appData.roadTestStatus || null,
          roadTestPassed: appData.roadTestPassed !== null ? appData.roadTestPassed : null,
          roadTestScore: appData.roadTestScore || null,
          verificationPhoto: appData.verificationPhoto || null,
          applicationType: appData.applicationType || userSession?.applicationData?.applicationType || ''
        });
        
        setApplicationNumber(appData.applicationNumber || '');
        
        // Set payment completed status from database
        if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
          setPaymentCompleted(true);
        }
        
        const completed = [];
        if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
          completed.push(1);
        }
        if (appData.colorVisionTestCompleted) {
          completed.push(2);
        }
        if (appData.learnerTestStatus === 'passed') {
          completed.push(3);
        }
        if (appData.roadTestDate && appData.roadTestSlot) {
          completed.push(4);
        }
        
        setCompletedSteps(completed);
        
        let calculatedProgress = 0;
        if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
          calculatedProgress = 20;
        }
        if (appData.colorVisionTestCompleted) {
          calculatedProgress = 35;
        }
        if (appData.learnerTestStatus === 'passed') {
          calculatedProgress = 50;
        }
        if (appData.roadTestDate && appData.roadTestSlot) {
          calculatedProgress = 70;
        }
        if (appData.roadTestPassed === true) {
          calculatedProgress = 100;
          completed.push(5);
        } else if (appData.roadTestPassed === false) {
          calculatedProgress = 75;
        }
        setProgress(calculatedProgress);
        
        const nextIncompleteStep = completed.length < 2 ? completed.length + 1 : 2;
        setCurrentStep(nextIncompleteStep);
      }
    };
    
    loadApplicationData();
  }, [userSession, digiLockerId]);

  const isStepUnlocked = (step) => {
    if (step === 1) return true;
    return completedSteps.includes(step - 1);
  };

  const completeCurrentStep = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  // Show evaluation result modal when roadTestPassed changes
  useEffect(() => {
    if (!hasShownResultModal && (formData.roadTestPassed === true || formData.roadTestPassed === false)) {
      setConfirmationData({
        applicationNumber: applicationNumber,
        testDate: formData.roadTestDate ? new Date(formData.roadTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
        score: formData.roadTestScore || 0,
        percentage: formData.roadTestScore ? Math.round((formData.roadTestScore / 50) * 100) : 0,
        passed: formData.roadTestPassed
      });
      setConfirmationType('evaluationResult');
      setShowConfirmation(true);
      setHasShownResultModal(true);
    }
  }, [formData.roadTestPassed, formData.roadTestDate, formData.roadTestScore, applicationNumber, hasShownResultModal]);

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
        
        const paymentReferenceNumber = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);
        
        try {
          await axios.post('http://localhost:5001/api/applications/complete-payment', {
            digilocker: digiLockerId,
            paymentReference: paymentReferenceNumber,
            amount: amount
          });
        } catch (paymentError) {
          console.error('Payment status update FAILED:', paymentError);
          alert('Warning: Payment status update failed. Please contact support.');
          return; // Don't show success modal if payment failed
        }
        
        setConfirmationData({
          applicationNumber: applicationNumber,
          colorTestDate: new Date(formData.colorTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          learnerTestDate: new Date(formData.learnerTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          paymentReference: paymentReferenceNumber,
          amountPaid: amount,
          applicationType: vehicleType
        });
        setConfirmationType('payment');
        setShowConfirmation(true);
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
    setShowColorInstructions(true);
    setShowDashboard(false);
  };

  const startColorTest = () => {
    setShowColorInstructions(false);
    setShowColorTest(true);
  };

  const cancelColorInstructions = () => {
    setShowColorInstructions(false);
    setShowDashboard(true);
  };

  const handleTestComplete = async (result) => {
    setShowColorTest(false);
    setShowDashboard(true);
    
    if (result.score >= 70) {
      setFormData(prev => ({ ...prev, colorTestPassed: true }));
      setProgress(35);
      completeCurrentStep(2);
      
      // Refresh application data to get updated status
      try {
        const response = await axios.get(`http://localhost:5001/api/applications/user/${digiLockerId}`);
        if (response.data.data) {
          const appData = response.data.data;
          setFormData(prev => ({
            ...prev,
            colorTestPassed: appData.colorVisionTestCompleted || false,
            learnerTestPassed: appData.learnerTestCompleted || false,
            learnerTestStatus: appData.learnerTestStatus || 'not_taken',
            learnerTestScore: appData.learnerTestScore || null,
            learnerTestAttempts: appData.learnerTestAttempts || 0,
            learnerLicenseNumber: appData.learnerLicenseNumber || null
          }));
        }
      } catch (error) {
        console.error('Error refreshing application data:', error);
      }
      
      setConfirmationData({
        applicationNumber: applicationNumber,
        testDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      });
      setConfirmationType('colorTest');
      setShowConfirmation(true);
    } else {
      alert(`Test Failed. Score: ${result.score.toFixed(1)}%. You need 70% to pass.`);
    }
  };

  const cancelTest = () => {
    setShowColorTest(false);
    setShowColorInstructions(false);
    setShowDashboard(true);
  };

  const takeLearnerTest = () => {
    if (!formData.colorTestPassed) {
      alert('You must complete the Color Vision Test first before taking the Learner Test.');
      return;
    }
    
    if (!applicationNumber) {
      alert('Application number not found. Please refresh the page and try again.');
      console.error('Missing application number:', { applicationNumber, digiLockerId });
      return;
    }
    
    navigate(`/learner-test-instructions/${applicationNumber}`);
  };

  const applyForRoadTest = () => {
    if (formData.learnerTestStatus !== 'passed') {
      alert('You must pass the Learner License Test before applying for Road Test.');
      return;
    }
    
    if (!applicationNumber) {
      alert('Application number not found. Please refresh the page and try again.');
      return;
    }
    
    setShowRoadTestApplication(true);
    setShowDashboard(false);
  };

    const handleRoadTestComplete = async (result) => {
    setShowRoadTestApplication(false);
    setShowDashboard(true);
    
    if (result.success) {
      // Refresh data from backend to get latest state
      await refreshDashboardData();
      
      setConfirmationData({
        applicationNumber: applicationNumber,
        roadTestDate: new Date(result.roadTestDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        roadTestSlot: result.roadTestSlot,
        applicationType: formData.applicationType || userSession?.applicationData?.applicationType || 'Not specified'
      });
      setConfirmationType('roadTestBooking');
      setShowConfirmation(true);
    }
  };

  const cancelRoadTestApplication = () => {
    setShowRoadTestApplication(false);
    setShowDashboard(true);
  };

  // Refresh dashboard data after test completion
  const refreshDashboardData = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/applications/user/${digiLockerId}`);
      if (response.data.data) {
        const appData = response.data.data;
        
        setFormData({
          colorTestDate: appData.colorTestDate || '',
          learnerTestDate: appData.learnerTestDate || '',
          colorTestPassed: appData.colorVisionTestCompleted || false,
          learnerTestPassed: appData.learnerTestCompleted || false,
          learnerTestStatus: appData.learnerTestStatus || 'not_taken',
          learnerTestScore: appData.learnerTestScore || null,
          learnerTestAttempts: appData.learnerTestAttempts || 0,
          learnerLicenseNumber: appData.learnerLicenseNumber || null,
          roadTestDate: appData.roadTestDate || null,
          roadTestSlot: appData.roadTestSlot || null
        });
        
        const completed = [];
        if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
          completed.push(1);
        }
        if (appData.colorVisionTestCompleted) {
          completed.push(2);
        }
        if (appData.learnerTestStatus === 'passed') {
          completed.push(3);
        }
        if (appData.roadTestDate && appData.roadTestSlot) {
          completed.push(4);
        }
        setCompletedSteps(completed);
        
        let calculatedProgress = 0;
        if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
          calculatedProgress = 20;
        }
        if (appData.colorVisionTestCompleted) {
          calculatedProgress = 35;
        }
        if (appData.learnerTestStatus === 'passed') {
          calculatedProgress = 50;
        }
        if (appData.roadTestDate && appData.roadTestSlot) {
          calculatedProgress = 70;
        }
        setProgress(calculatedProgress);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  }, [digiLockerId]);

  // Listen for storage events (from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'learnerTestCompleted') {
        refreshDashboardData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [digiLockerId, refreshDashboardData]);

  const handleDownloadLicense = () => {
    window.open(
      `http://localhost:5001/api/learner-test/download-license/${applicationNumber}`,
      '_blank'
    );
  };

  const handleDownloadDrivingLicense = () => {
    window.open(
      `http://localhost:5001/api/learner-test/download-driving-license/${applicationNumber}`,
      '_blank'
    );
  };

  return (
    <div className={`dashboard-container ${showColorTest || showRoadTestApplication ? 'test-active' : ''}`}>
      {showColorInstructions && (
        <ColorVisionTestInstructions 
          onStart={startColorTest}
          onCancel={cancelColorInstructions}
        />
      )}

      {showColorTest && (
        <ColorVisionTest
          applicationNumber={applicationNumber}
          digiLockerId={digiLockerId}
          fullName={username}
          onTestComplete={handleTestComplete}
          onCancel={cancelTest}
        />
      )}

      {showRoadTestApplication && (
        <RoadTestApplication
          applicationNumber={applicationNumber}
          digiLockerId={digiLockerId}
          onComplete={handleRoadTestComplete}
          onCancel={cancelRoadTestApplication}
        />
      )}

      {!showColorTest && !showColorInstructions && !showRoadTestApplication && (
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
                  const isLocked = false; // All steps can be unlocked now

                  return (
                    <div
                      key={step.id}
                      className={`step-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : (isUnlocked && !isCompleted ? 'unlocked' : 'locked')} ${isCurrent && !isLocked ? 'current' : ''}`}
                      onClick={() => {
                        if (!isLocked && isUnlocked && !isCompleted) {
                          if (step.id === 1) {
                            setCurrentStep(1);
                            setShowDashboard(false);
                          } else if (step.id === 2) {
                            takeColorTest();
                          } else if (step.id === 3) {
                            takeLearnerTest();
                          } else if (step.id === 4) {
                            applyForRoadTest();
                          }
                        }
                      }}
                      style={{ cursor: (isLocked || !isUnlocked || isCompleted) ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="step-content-card">
                        <div className="step-header">
                          <h3>Step {step.id}</h3>
                          {(isLocked || !isUnlocked) && <span className="lock-badge">LOCKED</span>}
                        </div>
                        <h4>{step.title}</h4>
                        <p>{step.desc}</p>
                        {isCompleted ? (
                          step.id === 4 && formData.roadTestDate && formData.roadTestSlot ? (
                            <div className="scheduled-info">
                              <span className="status-text completed-text">✓ Scheduled</span>
                              <p className="scheduled-details">
                                <strong>{new Date(formData.roadTestDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong><br />
                                at <strong>{formData.roadTestSlot}</strong>
                              </p>
                            </div>
                          ) : (
                            <span className="status-text completed-text">Completed</span>
                          )
                        ) : isLocked ? (
                          <span className="status-text locked-text">Coming Soon</span>
                        ) : isCurrent ? (
                          <button className="start-btn">
                            {step.id === 3 && formData.learnerTestStatus === 'failed' 
                              ? 'Retry Test' 
                              : step.id === 4 
                                ? 'Apply Now' 
                                : 'Start Now'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Road Test Result Section */}
              {(formData.roadTestPassed === true || formData.roadTestPassed === false) && (
                <div className="road-test-result-section">
                  <div className={`result-card ${formData.roadTestPassed ? 'passed' : 'failed'}`}>
                    <div className="result-icon">
                      {formData.roadTestPassed ? '🎉' : '😔'}
                    </div>
                    <div className="result-info-text">
                      <h3>Road Test {formData.roadTestPassed ? 'PASSED' : 'FAILED'}</h3>
                      {formData.roadTestScore !== null && formData.roadTestScore !== undefined && (
                        <p className="result-score">Score: {formData.roadTestScore}/50</p>
                      )}
                      {formData.roadTestPassed ? (
                        <p>Congratulations! You have successfully passed the road test.</p>
                      ) : (
                        <p>Unfortunately, you did not pass this time. Please practice more and try again.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Download Learner License Button */}
              {formData.learnerTestStatus === 'passed' && formData.learnerLicenseNumber && (
                <div className="license-download-section">
                  <div className="license-card">
                    <div className="license-icon">📜 Learner's License</div>
                    <div className="license-info-text">
                      <h3>Click on "Get License" to Download Your Learner's License</h3>
                      <p>License Number: <strong>{formData.learnerLicenseNumber}</strong></p>
                      <p className="license-score">Test Score: {formData.learnerTestScore}/30</p>
                    </div>
                    <button onClick={handleDownloadLicense} className="download-license-btn">
                      Get License 
                    </button>
                  </div>
                </div>
              )}

              {/* Download Driving License Button */}
              {formData.roadTestPassed === true && (
                <div className="license-download-section">
                  <div className="license-card driving-license">
                    <div className="license-icon">🚗 Driving License</div>
                    <div className="license-info-text">
                      <h3>Congratulations! Download Your Full Driving License</h3>
                      <p>You have successfully completed all tests</p>
                      {formData.roadTestScore && (
                        <p className="license-score">Road Test Score: {formData.roadTestScore}/50</p>
                      )}
                    </div>
                    <button onClick={handleDownloadDrivingLicense} className="download-license-btn driving">
                      Get Driving License 🎊
                    </button>
                  </div>
                </div>
              )}
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
                
                {currentStep === 1 && !completedSteps.includes(1) && (
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
                          Color vision test passed!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(currentStep === 3 || currentStep === 4) && (
                  <div className="step-content locked-content">
                    <h2>{currentStep === 3 ? 'Learner License Test' : 'Road Test Application'}</h2>
                    <div className="coming-soon-message">
                      <div className="coming-soon-icon">LOCKED</div>
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

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={async () => {
          setShowConfirmation(false);
          setPaymentCompleted(true);
          
          // Reload application data from backend to get updated status
          try {
            const response = await axios.get(`http://localhost:5001/api/applications/user/${digiLockerId}`);
            if (response.data.data) {
              const appData = response.data.data;
              
              setFormData({
                colorTestDate: appData.colorTestDate || '',
                learnerTestDate: appData.learnerTestDate || '',
                colorTestPassed: appData.colorVisionTestCompleted || false,
                learnerTestPassed: appData.learnerTestCompleted || false,
                learnerTestStatus: appData.learnerTestStatus || 'not_taken',
                learnerTestScore: appData.learnerTestScore || null,
                learnerTestAttempts: appData.learnerTestAttempts || 0,
                learnerLicenseNumber: appData.learnerLicenseNumber || null,
                roadTestDate: appData.roadTestDate || null,
                roadTestSlot: appData.roadTestSlot || null,
                roadTestStatus: appData.roadTestStatus || null,
                roadTestPassed: appData.roadTestPassed !== null ? appData.roadTestPassed : null,
                roadTestScore: appData.roadTestScore || null,
                verificationPhoto: appData.verificationPhoto || null
              });
              
              // Update completed steps based on fresh data
              const completed = [];
              if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
                completed.push(1);
              }
              if (appData.colorVisionTestCompleted) {
                completed.push(2);
              }
              if (appData.learnerTestStatus === 'passed') {
                completed.push(3);
              }
              if (appData.roadTestDate && appData.roadTestSlot) {
                completed.push(4);
              }
              setCompletedSteps(completed);
              
              let calculatedProgress = 0;
              if (appData.paymentStatus === 'completed' || appData.paymentCompleted) {
                calculatedProgress = 20;
              }
              if (appData.colorVisionTestCompleted) {
                calculatedProgress = 35;
              }
              if (appData.learnerTestStatus === 'passed') {
                calculatedProgress = 50;
              }
              if (appData.roadTestDate && appData.roadTestSlot) {
                calculatedProgress = 70;
              }
              if (appData.roadTestPassed === true) {
                calculatedProgress = 100;
                completed.push(5);
              } else if (appData.roadTestPassed === false) {
                calculatedProgress = 75;
              }
              setProgress(calculatedProgress);
              
              const nextIncompleteStep = completed.length < 2 ? completed.length + 1 : 2;
              setCurrentStep(nextIncompleteStep);
            }
          } catch (error) {
            console.error('Error reloading application data:', error);
          }
          
          setShowDashboard(true);
        }}
        type={confirmationType}
        data={confirmationData}
      />
    </div>
  );
};

export default ApplicationDashboard;
