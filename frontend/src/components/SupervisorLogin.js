import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SupervisorLogin.css';

const SupervisorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    supervisorId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/supervisor/login', formData);
      
      if (response.data.success) {
        // Store supervisor info in localStorage
        localStorage.setItem('supervisorData', JSON.stringify(response.data.data));
        navigate('/supervisor/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supervisor-login-container">
      <div className="supervisor-login-card">
        <div className="login-header">
          <h1>Supervisor Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="supervisorId">Supervisor ID</label>
            <input
              type="text"
              id="supervisorId"
              name="supervisorId"
              value={formData.supervisorId}
              onChange={handleChange}
              placeholder="Enter supervisor ID"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <div className="back-to-home">
          <button onClick={() => navigate('/')} className="back-btn">
            Login as Candidate
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorLogin;
