import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplicationForm.css';

const ApplicationForm = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the enhanced application flow
    navigate('/enhanced-application');
  }, [navigate]);

  return (
    <div className="digilocker-verification">
      <div className="verification-container">
        <div className="header-section">
          <h1>Drive Ease</h1>
          <p>Online Driving License Application System</p>
          <p>Redirecting to application...</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;