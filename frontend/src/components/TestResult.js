import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestResult.css';

const TestResult = () => {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchResult = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/learner-test/result/${applicationNumber}`
      );
      
      setResult(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load result');
      setIsLoading(false);
    }
  };
  
  const handleDownloadLicense = () => {
    window.open(
      `http://localhost:5001/api/learner-test/download-license/${applicationNumber}`,
      '_blank'
    );
  };
  
  const handleGoToDashboard = () => {
    navigate(`/dashboard/${applicationNumber}`);
  };
  
  if (isLoading) {
    return (
      <div className="test-result-container">
        <div className="loading">Loading results...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="test-result-container">
        <div className="error-message">{error}</div>
        <button onClick={handleGoToDashboard} className="btn-dashboard">
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
  const isPassed = result.passed;
  
  return (
    <div className="test-result-container">
      <div className="result-card">
        <button className="btn-top-dashboard" onClick={handleGoToDashboard} aria-label="Go to Dashboard">Go To Dashboard</button>
        {/* Result Header */}
        <div className={`result-header ${isPassed ? 'passed' : 'failed'}`}>
          <div className="result-icon">
            {isPassed ? 'PASSED' : 'FAILED'}
          </div>
          <h1>{isPassed ? 'Congratulations!' : 'Test Not Passed'}</h1>
          <p className="result-message">
            {isPassed 
              ? 'You have successfully passed the learner test!' 
              : 'Don\'t worry! You can retry from the dashboard.'}
          </p>
        </div>
        
        {/* Score Display */}
        <div className="score-section">
          <div className="score-circle">
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={isPassed ? '#4CAF50' : '#ff4444'}
                strokeWidth="20"
                strokeDasharray={`${(percentage / 100) * 565.48} 565.48`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="score-text">
              <div className="score-number">{result.score}</div>
              <div className="score-total">out of {result.totalQuestions}</div>
              <div className="score-percentage">{percentage}%</div>
            </div>
          </div>
          
          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Correct Answers:</span>
              <span className="detail-value correct">{result.score}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Wrong Answers:</span>
              <span className="detail-value wrong">{result.totalQuestions - result.score}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pass Score Required:</span>
              <span className="detail-value">21 (70%)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Violations:</span>
              <span className="detail-value">{result.violationsCount || 0}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Taken:</span>
              <span className="detail-value">{Math.floor((result.timeTaken || 0) / 60)}m {(result.timeTaken || 0) % 60}s</span>
            </div>
          </div>
        </div>
        
        {/* License Information (if passed) */}
        {isPassed && result.licenseNumber && (
          <div className="license-section">
            <div className="license-info">
              <h3>Your Learner License</h3>
              <div className="license-number" style={{ marginBottom: '15px' }}>
                <span className="license-label">License Type:</span>
                <span className="license-value" style={{ letterSpacing: '1px' }}>{result.applicationType || result.licenseType || 'Not specified'}</span>
              </div>
              <div className="license-number">
                <span className="license-label">License Number:</span>
                <span className="license-value">{result.licenseNumber}</span>
              </div>
              <p className="license-note">
                * Valid for 6 months from issue date<br />
                * Download your license from the dashboard
              </p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="action-buttons">
          {isPassed ? (
            <>
              <button onClick={handleDownloadLicense} className="btn-download">
                Download License
              </button>
              <button onClick={handleGoToDashboard} className="btn-dashboard">
                Go to Dashboard
              </button>
            </>
          ) : (
            <button onClick={handleGoToDashboard} className="btn-dashboard">
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResult;
