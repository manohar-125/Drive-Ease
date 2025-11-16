import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LearnerTestInstructions.css';

const LearnerTestInstructions = () => {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();
  
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchCandidateInfo();
  }, []);
  
  const fetchCandidateInfo = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/learner-test/candidate-info/${applicationNumber}`
      );
      
      setCandidateInfo(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate information');
      setIsLoading(false);
    }
  };
  
  const handleStartTest = () => {
    navigate(`/learner-test/${applicationNumber}`);
  };
  
  const handleBack = () => {
    navigate(`/dashboard/${applicationNumber}`);
  };
  
  if (isLoading) {
    return (
      <div className="instructions-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="instructions-container">
        <div className="error-message">{error}</div>
        <button onClick={handleBack} className="btn-back">
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="instructions-container">
      <div className="instructions-card">
        {/* Header */}
        <div className="instructions-header">
          <h1>Learner's License Test - Instructions</h1>
          <p>Please read all instructions carefully before starting the test</p>
        </div>
        
        {/* Candidate Details */}
        <div className="section">
          <h2>Candidate Details</h2>
          <div className="details-grid">
            <div className="detail-row">
              <span className="label">Application Number:</span>
              <span className="value">{candidateInfo.applicationNumber}</span>
            </div>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{candidateInfo.fullName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Father's Name:</span>
              <span className="value">{candidateInfo.fatherName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date of Birth:</span>
              <span className="value">
                {new Date(candidateInfo.dateOfBirth).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Vehicle Type:</span>
              <span className="value">{candidateInfo.applicationType}</span>
            </div>
          </div>
        </div>
        
        {/* Test Details */}
        <div className="section">
          <h2>Test Details</h2>
          <div className="test-info-grid">
            <div className="info-box">
              <div className="info-label">Total Questions</div>
              <div className="info-value">30</div>
            </div>
            <div className="info-box">
              <div className="info-label">Duration</div>
              <div className="info-value">20 Minutes</div>
            </div>
            <div className="info-box">
              <div className="info-label">Pass Score</div>
              <div className="info-value">21/30 (70%)</div>
            </div>
            <div className="info-box">
              <div className="info-label">Max Violations</div>
              <div className="info-value">3</div>
            </div>
          </div>
        </div>
        
        {/* Rules and Instructions */}
        <div className="section">
          <h2>Test Rules & Instructions</h2>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-number">1</span>
              <div className="rule-text">
                <strong>Camera Monitoring:</strong> Your camera will be active throughout the test. Ensure your face is clearly visible.
              </div>
            </div>
            
            <div className="rule-item">
              <span className="rule-number">2</span>
              <div className="rule-text">
                <strong>No Tab Switching:</strong> Do not switch tabs or leave the test window. Maximum 3 violations allowed, then test auto-submits.
              </div>
            </div>
            
            <div className="rule-item">
              <span className="rule-number">3</span>
              <div className="rule-text">
                <strong>Time Limit:</strong> Complete 30 questions in 20 minutes. Test will auto-submit when time expires.
              </div>
            </div>
            
            <div className="rule-item">
              <span className="rule-number">4</span>
              <div className="rule-text">
                <strong>Passing Criteria:</strong> Score at least 21 out of 30 (70%) to pass and receive your learner's license.
              </div>
            </div>
            
            <div className="rule-item">
              <span className="rule-number">5</span>
              <div className="rule-text">
                <strong>Navigation:</strong> Use Previous/Next buttons or click question numbers. You can change answers before submitting.
              </div>
            </div>
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="notice-box">
          <strong>Important:</strong> Make sure you are in a quiet environment with good internet connectivity. 
          Once you start the test, you cannot pause it.
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleBack} className="btn-back-action">
            Back to Dashboard
          </button>
          <button onClick={handleStartTest} className="btn-start-test">
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnerTestInstructions;
