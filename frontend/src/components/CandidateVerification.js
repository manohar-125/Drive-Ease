import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CandidateVerification.css';
import ConfirmationModal from './ConfirmationModal';

const CandidateVerification = () => {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1); // 1: Photos, 2: Camera, 3: OTP
  const [verificationStatus, setVerificationStatus] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState({
    front: null,
    left: null,
    right: null
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [currentPhotoType, setCurrentPhotoType] = useState(null);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/supervisor/candidate/${applicationNumber}`);
        if (response.data.success) {
          setCandidate(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
        alert('Failed to load candidate details');
        navigate('/supervisor/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      stopCamera();
    };
  }, [applicationNumber, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      alert('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhotoDirectly = async (photoType) => {
    setCurrentPhotoType(photoType);
    
    try {
      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            // Wait a bit for camera to stabilize
            setTimeout(resolve, 1000);
          };
        });
        
        // Capture the photo
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        
        // Store the photo
        setCapturedPhotos(prev => ({
          ...prev,
          [photoType]: photoData
        }));
        
        // Stop camera immediately
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      alert('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', error);
    }
    
    setCurrentPhotoType(null);
  };

  const retakePhoto = (photoType) => {
    setCapturedPhotos(prev => ({
      ...prev,
      [photoType]: null
    }));
  };

  const allPhotosCapture = () => {
    return capturedPhotos.front && capturedPhotos.left && capturedPhotos.right;
  };

  const verifyPhotos = async () => {
    setVerifying(true);
    setVerificationStatus('Analyzing photos...');
    
    try {
      // Simulate photo comparison
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await axios.post('http://localhost:5001/api/supervisor/verify-candidate', {
        applicationNumber
      });

      if (response.data.verified) {
        setVerificationStatus('Photo Verification Successful ✓');
        setTimeout(() => {
          setCurrentStep(3);
          setVerificationStatus('');
        }, 1500);
      } else {
        setVerificationStatus('Photo Verification Failed ✗');
      }
    } catch (error) {
      setVerificationStatus('Verification Error');
      console.error('Verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const sendOTP = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/supervisor/send-otp', {
        applicationNumber
      });

      if (response.data.success) {
        setGeneratedOTP(response.data.otp);
        setOtpSent(true);
      }
    } catch (error) {
      alert('Failed to send OTP');
      console.error('OTP error:', error);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      alert('Please enter a 6-digit OTP');
      return;
    }

    try {
      setVerifying(true);
      const response = await axios.post('http://localhost:5001/api/supervisor/verify-otp', {
        applicationNumber,
        otp,
        verificationPhoto: capturedPhotos.front // Send front face photo
      });

      if (response.data.success) {
        setConfirmationData({
          applicationNumber: applicationNumber,
          fullName: candidate?.fullName || 'N/A',
          verifiedAt: new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  const getPhotoLabel = (type) => {
    const labels = {
      front: 'Front Face Photo',
      left: 'Left Profile Photo',
      right: 'Right Profile Photo'
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="verification-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidate details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <button onClick={() => navigate('/supervisor/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Candidate Verification</h1>
      </div>

      <div className="verification-content">
        {/* Candidate Info Card */}
        <div className="candidate-info-card">
          <h2>Candidate Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{candidate?.fullName}</span>
            </div>
            <div className="info-item">
              <span className="label">Application #:</span>
              <span className="value">{candidate?.applicationNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Test Slot:</span>
              <span className="value">{candidate?.roadTestSlot}</span>
            </div>
            <div className="info-item">
              <span className="label">Phone:</span>
              <span className="value">{candidate?.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Step 1: View Stored Photos */}
        {currentStep === 1 && (
          <div className="step-container">
            <h3>Step 1: View Candidate's Previous Photos</h3>
            <div className="stored-photos">
              <div className="photo-item">
                <p className="photo-label">Application Photo</p>
                <img 
                  src={candidate?.photoData || candidate?.photoPath} 
                  alt="Application" 
                  className="stored-photo"
                />
              </div>
              {candidate?.learnerTestPhoto && (
                <div className="photo-item">
                  <p className="photo-label">Learner Test Photo</p>
                  <img 
                    src={candidate.learnerTestPhoto} 
                    alt="Learner Test" 
                    className="stored-photo"
                  />
                </div>
              )}
            </div>
            <button 
              onClick={() => setCurrentStep(2)} 
              className="next-btn"
            >
              Proceed to Live Verification →
            </button>
          </div>
        )}

        {/* Step 2: Capture Live Photos */}
        {currentStep === 2 && (
          <div className="step-container">
            <h3>Step 2: Capture Live Photos</h3>
            <p className="instruction">
              Click capture button to take photo. Camera will automatically turn off after capture.
            </p>

            <div className="camera-section">
              {/* Hidden video element for capturing */}
              <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }}></video>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

              <div className="captured-photos-grid">
                {Object.entries(capturedPhotos).map(([type, photo]) => (
                  <div key={type} className="captured-photo-item">
                    <p className="photo-label">{getPhotoLabel(type)}</p>
                    {photo ? (
                      <>
                        <img src={photo} alt={type} className="captured-photo" />
                        <button onClick={() => retakePhoto(type)} className="retake-btn">
                          ↺ Retake
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="photo-placeholder">
                          Not Captured
                        </div>
                        <button 
                          onClick={() => capturePhotoDirectly(type)} 
                          className="start-capture-btn"
                          disabled={currentPhotoType !== null}
                        >
                          {currentPhotoType === type ? '⏳ Capturing...' : `📷 Capture ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {allPhotosCapture() && (
              <div className="verification-actions">
                {verificationStatus && (
                  <div className="verification-status">{verificationStatus}</div>
                )}
                <button 
                  onClick={verifyPhotos} 
                  className="verify-photos-btn"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Photos'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {currentStep === 3 && (
          <div className="step-container">
            <h3>Step 3: OTP Verification</h3>
            <p className="instruction">
              Send OTP to candidate's registered phone number
            </p>

            {!otpSent ? (
              <button onClick={sendOTP} className="send-otp-btn">
                Send OTP to {candidate?.phoneNumber}
              </button>
            ) : (
              <div className="otp-section">
                <div className="otp-display">
                  <p>OTP sent to candidate:</p>
                  <div className="otp-code">{generatedOTP}</div>
                </div>

                <div className="otp-input-section">
                  <label>Enter OTP from Candidate</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="otp-input"
                  />
                  <button 
                    onClick={verifyOTP} 
                    className="verify-otp-btn"
                    disabled={verifying || otp.length !== 6}
                  >
                    {verifying ? 'Verifying...' : 'Verify & Complete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          navigate('/supervisor/dashboard');
        }}
        type="verification"
        data={confirmationData}
      />
    </div>
  );
};

export default CandidateVerification;
