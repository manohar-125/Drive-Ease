import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LearnerTest.css';

const LearnerTest = () => {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [testStartTime, setTestStartTime] = useState(null);
  const [violations, setViolations] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Camera state
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);
  
  // Submit test to backend
  const submitTest = useCallback(async () => {
    try {
      stopCamera();
      
      // Prepare answers array
      const answersArray = questions.map(q => ({
        questionId: q.id,
        userAnswer: answers[q.id] !== undefined ? answers[q.id] : -1
      }));
      
      const timeTaken = Math.floor((new Date() - testStartTime) / 1000);
      
      await axios.post(
        'http://localhost:5001/api/learner-test/submit',
        {
          applicationNumber,
          answers: answersArray,
          violations,
          timeTaken,
          startedAt: testStartTime
        }
      );
      
      // Navigate to result page
      navigate(`/test-result/${applicationNumber}`);
      
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit test';
      setError(errorMessage);
      alert('Error submitting test: ' + errorMessage);
    }
  }, [stopCamera, questions, answers, testStartTime, applicationNumber, violations, navigate]);
  
  // Auto-submit (time up or too many violations)
  const handleAutoSubmit = useCallback(async () => {
    await submitTest();
  }, [submitTest]);
  
  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
    setTestStartTime(new Date());
    
    // Add visibility change listener for tab switching
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Start camera only when questions are loaded
  useEffect(() => {
    if (!isLoading && questions.length > 0 && !error) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, questions.length, error]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, handleAutoSubmit]);
  
  // Fetch questions from backend
  const fetchQuestions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/learner-test/questions/${applicationNumber}`
      );
      
      setQuestions(response.data.questions);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions');
      setIsLoading(false);
    }
  };
  
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      addViolation('camera_off');
      showWarningMessage('Camera access denied. Please enable camera to continue.');
    }
  };
  
  // Handle tab switching
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setViolations(prev => {
        const newViolation = {
          type: 'tab_switch',
          timestamp: new Date()
        };
        const updatedViolations = [...prev, newViolation];
        
        // Auto-submit immediately when violations reach 3
        if (updatedViolations.length >= 3) {
          showWarningMessage('Too many violations! Test auto-submitted.');
          setTimeout(() => handleAutoSubmit(), 1000);
        } else {
          showWarningMessage(`Warning: Tab switching detected! (${updatedViolations.length}/3 violations)`);
        }
        
        return updatedViolations;
      });
    }
  };
  
  // Add violation
  const addViolation = (type) => {
    const newViolation = {
      type,
      timestamp: new Date()
    };
    setViolations(prev => [...prev, newViolation]);
  };
  
  // Show warning message
  const showWarningMessage = (message) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    });
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Jump to specific question
  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  // Submit test
  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) {
      return;
    }
    
    await submitTest();
  };
  
  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return <div className="learner-test-container"><div className="loading">Loading test...</div></div>;
  }
  
  if (error) {
    return (
      <div className="learner-test-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(`/dashboard/${applicationNumber}`)} className="btn-back">
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  
  return (
    <div className="learner-test-container">
      {/* Warning Message */}
      {showWarning && (
        <div className="warning-banner">
          {warningMessage}
        </div>
      )}
      
      {/* Header */}
      <div className="test-header">
        <div className="test-info">
          <h2>Learner's License Test</h2>
          <p>Application: {applicationNumber}</p>
        </div>
        <div className="header-actions">
          <div className="test-timer">
            <span className={timeLeft < 300 ? 'time-warning' : ''}>
              Time: {formatTime(timeLeft)}
            </span>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel the test? Your progress will be lost.')) {
                stopCamera();
                navigate(`/dashboard/${applicationNumber}`);
              }
            }}
            className="btn-cancel-test"
          >
            Cancel Test
          </button>
        </div>
      </div>
      
      <div className="test-content">
        {/* Sidebar - Question Navigator */}
        <div className="question-navigator">
          <h3>Questions</h3>
          <div className="question-grid">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`question-btn ${index === currentQuestionIndex ? 'active' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
                onClick={() => handleQuestionJump(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="progress-info">
            <p>Answered: {answeredCount} / {questions.length}</p>
            <p>Warnings: {violations.length} / 3</p>
          </div>
          
          {/* Camera Feed */}
          <div className="camera-section">
            <h4>Camera Monitor</h4>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="camera-feed"
            />
          </div>
        </div>
        
        {/* Main Question Area */}
        <div className="question-area">
          <div className="question-header">
            <span className="question-number">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="question-category">{currentQuestion.category.replace('_', ' ')}</span>
          </div>
          
          <div className="question-content">
            {currentQuestion.hasImage && (currentQuestion.imageData || currentQuestion.imagePath) && (
              <div className="question-image">
                <img 
                  src={currentQuestion.imageData || `http://localhost:5001/api/test-images/${currentQuestion.imagePath}`}
                  alt="Traffic Sign"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            
            <h3 className="question-text">{currentQuestion.question}</h3>
            
            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <label 
                  key={index}
                  className={`option-label ${answers[currentQuestion.id] === index ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === index}
                    onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="btn-nav"
            >
              Previous
            </button>
            
            <button 
              onClick={handleSubmit}
              className="btn-submit"
            >
              Submit Test
            </button>
            
            <button 
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="btn-nav"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerTest;
