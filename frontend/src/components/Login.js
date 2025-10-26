import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [digiLockerId, setDigiLockerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!digiLockerId.trim()) {
      setError('Please enter your DigiLocker ID');
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying DigiLocker ID:', digiLockerId);
      const response = await axios.post('http://localhost:5001/api/applications/verify-digilocker', {
        digilocker: digiLockerId.trim()
      });

      console.log('DigiLocker verification response:', response.data);

      if (response.data.success) {
        // Pass user data to parent component
        onLoginSuccess({
          digiLockerId: digiLockerId.trim(),
          userData: response.data.userData,
          eligibility: response.data.eligibility,
          hasExistingApplication: response.data.hasExistingApplication,
          applicationData: response.data.applicationData
        });
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error verifying DigiLocker ID:', err);
      setError(
        err.response?.data?.message || 
        'Unable to verify DigiLocker ID. Please check your ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="digilocker-login-container">
      <div className="digilocker-login-card">
        <div className="login-header">
          <div className="logo-section">
            <h1>Drive-Ease</h1>
          </div>
          <p className="tagline">Online Driving License Application Portal</p>
        </div>

        <div className="login-content">
          <h2>Welcome</h2>
          <p className="instruction-text">
            Enter your DigiLocker ID to access your driving license application
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="digiLockerId">DigiLocker ID</label>
              <input
                type="text"
                id="digiLockerId"
                value={digiLockerId}
                onChange={(e) => setDigiLockerId(e.target.value)}
                placeholder="Enter your DigiLocker ID"
                className={error ? 'error' : ''}
                disabled={loading}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <div className="help-section">
            <p>Don't have a DigiLocker ID?</p>
            <a href="https://digilocker.gov.in" target="_blank" rel="noopener noreferrer">
              Create DigiLocker Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
