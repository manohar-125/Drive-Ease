import React, { useState } from 'react';
import './ColorVisionTestInstructions.css';

const ColorVisionTestInstructions = ({ onStart, onCancel }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="instructions-overlay">
      <div className="instructions-container">
        <div className="instructions-header">
          <h2>Color Vision Test Instructions</h2>
          <p className="test-subtitle">Please read carefully before starting</p>
        </div>

        <div className="instructions-content">
          <div className="instruction-section">
            <div className="section-icon">📋</div>
            <h3>Test Overview</h3>
            <ul>
              <li>You will be shown <strong>10 Ishihara color plates</strong></li>
              <li>Each plate contains a number hidden in colored dots</li>
              <li>Select the correct number from the given options</li>
              <li>Time limit: <strong>10 minutes</strong> for all questions</li>
            </ul>
          </div>

          <div className="instruction-section">
            <div className="section-icon">👀</div>
            <h3>How to Take the Test</h3>
            <ul>
              <li>Look carefully at each colored pattern</li>
              <li>Identify the number you see in the image</li>
              <li>Click on your answer from the 4 options provided</li>
              <li>Click "Next Question" to proceed</li>
            </ul>
          </div>

          <div className="instruction-section">
            <div className="section-icon">✅</div>
            <h3>Passing Criteria</h3>
            <ul>
              <li>You need to score <strong>70% or above</strong> to pass</li>
              <li>That means at least <strong>7 out of 10</strong> correct answers</li>
              <li>Result will be shown immediately after completion</li>
            </ul>
          </div>

          <div className="instruction-section warning-section">
            <div className="section-icon">⚠️</div>
            <h3>Important Notes</h3>
            <ul>
              <li>Adjust screen brightness if needed</li>
              <li>Do not use color filters or night mode</li>
              <li>If timer runs out, test will auto-submit</li>
              <li>Make sure you have a stable internet connection</li>
            </ul>
          </div>
        </div>

        <div className="instructions-footer">
          <div className="consent-section">
            <label className="consent-checkbox">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>I have read and understood all the instructions</span>
            </label>
          </div>

          <div className="action-buttons">
            <button className="btn-cancel-instructions" onClick={onCancel}>
              Cancel
            </button>
            <button 
              className="btn-start-test" 
              onClick={onStart}
              disabled={!agreed}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorVisionTestInstructions;
