import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './RoadTestEvaluation.css';
import ConfirmationModal from './ConfirmationModal';

const RoadTestEvaluation = () => {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  
  const evaluationQuestions = [
    { id: 1, question: 'Vehicle Control and Handling', description: 'Ability to control vehicle smoothly' },
    { id: 2, question: 'Traffic Rules Compliance', description: 'Following traffic signals and road signs' },
    { id: 3, question: 'Lane Discipline', description: 'Maintaining proper lane position' },
    { id: 4, question: 'Speed Management', description: 'Appropriate speed for road conditions' },
    { id: 5, question: 'Awareness and Observation', description: 'Checking mirrors and blind spots' },
    { id: 6, question: 'Use of Indicators', description: 'Proper signaling before maneuvers' },
    { id: 7, question: 'Parking Skills', description: 'Parallel and reverse parking ability' },
    { id: 8, question: 'Emergency Response', description: 'Handling unexpected situations' },
    { id: 9, question: 'Smooth Braking', description: 'Progressive and controlled braking' },
    { id: 10, question: 'Overall Driving Confidence', description: 'General confidence and composure' }
  ];

  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/supervisor/candidate/${applicationNumber}`);
        if (response.data.success) {
          setCandidate(response.data.data);
          
          // Check if candidate is verified
          if (response.data.data.roadTestStatus !== 'verified') {
            alert('Candidate must be verified before evaluation');
            navigate('/supervisor/dashboard');
          }
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
  }, [applicationNumber, navigate]);

  const handleRatingChange = (questionId, rating) => {
    setRatings({
      ...ratings,
      [questionId]: rating
    });
  };

  const calculateStats = () => {
    const ratedQuestions = Object.keys(ratings).length;
    const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    const maxPossible = ratedQuestions * 5;
    const percentage = maxPossible > 0 ? (totalRating / maxPossible * 100).toFixed(1) : 0;
    
    return {
      ratedQuestions,
      totalRating,
      maxPossible,
      percentage,
      allAnswered: ratedQuestions === evaluationQuestions.length
    };
  };

  const handleSubmit = async () => {
    const stats = calculateStats();
    
    if (!stats.allAnswered) {
      alert('Please rate all questions before submitting');
      return;
    }

    const confirmed = window.confirm(
      `You are about to submit the evaluation:\n\n` +
      `Total Score: ${stats.totalRating}/${stats.maxPossible}\n` +
      `Percentage: ${stats.percentage}%\n\n` +
      `Candidate will ${stats.percentage >= 60 ? 'PASS' : 'FAIL'} (Passing: 60%)\n\n` +
      `Are you sure?`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      
      const evaluations = evaluationQuestions.map(q => ({
        question: q.question,
        rating: ratings[q.id]
      }));

      const response = await axios.post('http://localhost:5001/api/supervisor/evaluate-candidate', {
        applicationNumber,
        evaluations
      });

      if (response.data.success) {
        setConfirmationData({
          applicationNumber: applicationNumber,
          fullName: response.data.data.fullName,
          score: response.data.data.totalScore,
          maxScore: response.data.data.maxScore,
          percentage: response.data.data.percentage,
          passed: response.data.data.passed
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit evaluation');
      console.error('Error submitting evaluation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="evaluation-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidate details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evaluation-container">
      <div className="evaluation-header">
        <button onClick={() => navigate('/supervisor/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Road Test Evaluation</h1>
      </div>

      <div className="evaluation-content">
        {/* Candidate Info */}
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
              <span className="label">Status:</span>
              <span className="value status-verified">✓ Verified</span>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="score-summary">
          <div className="summary-item">
            <span className="summary-label">Questions Rated</span>
            <span className="summary-value">{stats.ratedQuestions}/{evaluationQuestions.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Current Score</span>
            <span className="summary-value">{stats.totalRating}/{stats.maxPossible}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Percentage</span>
            <span className={`summary-value ${stats.percentage >= 60 ? 'pass' : 'fail'}`}>
              {stats.percentage}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Expected Result</span>
            <span className={`summary-value ${stats.percentage >= 60 ? 'pass' : 'fail'}`}>
              {stats.allAnswered ? (stats.percentage >= 60 ? '✅ PASS' : '❌ FAIL') : 'Incomplete'}
            </span>
          </div>
        </div>

        {/* Evaluation Questions */}
        <div className="evaluation-questions">
          <h3>Rate Each Parameter (1 = Poor, 5 = Excellent)</h3>
          {evaluationQuestions.map((q) => (
            <div key={q.id} className="question-card">
              <div className="question-header">
                <div className="question-info">
                  <h4>{q.id}. {q.question}</h4>
                  <p className="question-desc">{q.description}</p>
                </div>
                {ratings[q.id] && (
                  <div className="selected-rating">
                    {ratings[q.id]}/5
                  </div>
                )}
              </div>
              
              <div className="rating-buttons">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={`rating-btn ${ratings[q.id] === rating ? 'selected' : ''}`}
                    onClick={() => handleRatingChange(q.id, rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="submit-section">
          <div className="submit-warning">
            <p>⚠️ Passing Score: 60% (Minimum {Math.ceil(evaluationQuestions.length * 5 * 0.6)} points)</p>
            <p>Please ensure all ratings are accurate before submission. This action cannot be undone.</p>
          </div>
          <button 
            className="submit-evaluation-btn"
            onClick={handleSubmit}
            disabled={!stats.allAnswered || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          navigate('/supervisor/dashboard');
        }}
        type="evaluation"
        data={confirmationData}
      />
    </div>
  );
};

export default RoadTestEvaluation;
