import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ApplicationStatus.css';

const ApplicationStatus = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplication = async () => {
    try {
      const response = await axios.get(`/api/applications/${id}`);
      if (response.data.success) {
        setApplication(response.data.data);
      }
    } catch (error) {
      setError('Application not found or error loading data');
    }
    setLoading(false);
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    try {
      const response = await axios.post(`/api/applications/${id}/payment`);
      if (response.data.success) {
        setApplication(prev => ({
          ...prev,
          paymentStatus: 'completed',
          transactionId: response.data.data.transactionId
        }));
      }
    } catch (error) {
      setError('Payment processing failed. Please try again.');
    }
    setPaymentProcessing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#667eea';
      case 'under_review': return '#ed8936';
      case 'approved': return '#48bb78';
      case 'rejected': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'Application Submitted';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown Status';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading application details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>Application Not Found</h2>
          <p>The application with ID {id} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="status-container">
        <div className="header">
          <h1>Application Status</h1>
          <div className="application-id">
            Application ID: <span>{application.applicationId}</span>
          </div>
        </div>

        <div className="status-badge" style={{ backgroundColor: getStatusColor(application.status) }}>
          {getStatusText(application.status)}
        </div>

        <div className="application-details">
          <div className="section">
            <h3>Personal Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Full Name:</label>
                <span>{application.fullName}</span>
              </div>
              <div className="detail-item">
                <label>Father's Name:</label>
                <span>{application.fatherName}</span>
              </div>
              <div className="detail-item">
                <label>Date of Birth:</label>
                <span>{new Date(application.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{application.phone}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{application.email}</span>
              </div>
              <div className="detail-item">
                <label>DigiLocker ID:</label>
                <span>{application.digilocker}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Address Information</h3>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label>Address:</label>
                <span>{application.address}</span>
              </div>
              <div className="detail-item">
                <label>City:</label>
                <span>{application.city}</span>
              </div>
              <div className="detail-item">
                <label>State:</label>
                <span>{application.state}</span>
              </div>
              <div className="detail-item">
                <label>Pincode:</label>
                <span>{application.pincode}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Test Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Color Test Date:</label>
                <span>{new Date(application.colorTestDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <label>Learner Test Date:</label>
                <span>{new Date(application.learnerTestDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Verification & Payment</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>DigiLocker Verification:</label>
                <span className={`verification-status ${application.isDigilockerVerified ? 'verified' : 'pending'}`}>
                  {application.isDigilockerVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="detail-item">
                <label>Payment Status:</label>
                <span className={`payment-status ${application.paymentStatus}`}>
                  {application.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              {application.transactionId && (
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>{application.transactionId}</span>
                </div>
              )}
              <div className="detail-item">
                <label>Application Fee:</label>
                <span>₹{application.paymentAmount}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Application Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Application ID:</label>
                <span>{application.applicationId}</span>
              </div>
              <div className="detail-item">
                <label>DigiLocker ID:</label>
                <span>{application.digilocker}</span>
              </div>
              <div className="detail-item">
                <label>Current Status:</label>
                <span className="status-text" style={{ color: getStatusColor(application.status) }}>
                  {getStatusText(application.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {application.paymentStatus === 'pending' && (
          <div className="payment-section">
            <h3>Complete Payment</h3>
            <p>Please complete the payment of ₹{application.paymentAmount} to proceed with your application.</p>
            <button 
              className="payment-btn"
              onClick={processPayment}
              disabled={paymentProcessing}
            >
              {paymentProcessing ? 'Processing Payment...' : `Pay ₹${application.paymentAmount}`}
            </button>
          </div>
        )}

        <div className="next-steps">
          <h3>Next Steps</h3>
          <div className="steps-list">
            {application.paymentStatus === 'pending' && (
              <div className="step pending">
                <span className="step-number">1</span>
                <span className="step-text">Complete payment of ₹{application.paymentAmount}</span>
              </div>
            )}
            <div className={`step ${application.paymentStatus === 'completed' ? 'current' : 'pending'}`}>
              <span className="step-number">{application.paymentStatus === 'pending' ? '2' : '1'}</span>
              <span className="step-text">Application under review by RTO</span>
            </div>
            <div className="step pending">
              <span className="step-number">{application.paymentStatus === 'pending' ? '3' : '2'}</span>
              <span className="step-text">Document verification</span>
            </div>
            <div className="step pending">
              <span className="step-number">{application.paymentStatus === 'pending' ? '4' : '3'}</span>
              <span className="step-text">Take scheduled tests</span>
            </div>
            <div className="step pending">
              <span className="step-number">{application.paymentStatus === 'pending' ? '5' : '4'}</span>
              <span className="step-text">License issuance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;