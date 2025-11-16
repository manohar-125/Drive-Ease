import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [allCandidates, setAllCandidates] = useState([]);
  const [verifiedCandidates, setVerifiedCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('verification'); // 'verification' or 'evaluation'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supervisorData, setSupervisorData] = useState(null);

  useEffect(() => {
    // Check if supervisor is logged in
    const storedData = localStorage.getItem('supervisorData');
    if (!storedData) {
      navigate('/supervisor/login');
      return;
    }
    setSupervisorData(JSON.parse(storedData));
    fetchAllCandidates();
  }, [navigate]);

  const fetchAllCandidates = async () => {
    try {
      setLoading(true);
      
      // Fetch all road test candidates
      const allResponse = await axios.get('http://localhost:5001/api/supervisor/all-road-test-candidates');
      if (allResponse.data.success) {
        setAllCandidates(allResponse.data.data);
      }
      
      // Fetch verified candidates for evaluation
      const verifiedResponse = await axios.get('http://localhost:5001/api/supervisor/verified-candidates');
      if (verifiedResponse.data.success) {
        setVerifiedCandidates(verifiedResponse.data.data);
      }
    } catch (error) {
      setError('Failed to load candidates');
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supervisorData');
    navigate('/supervisor/login');
  };

  const handleVerifyCandidate = (applicationNumber) => {
    navigate(`/supervisor/verify/${applicationNumber}`);
  };

  const handleEvaluateCandidate = (applicationNumber) => {
    navigate(`/supervisor/evaluate/${applicationNumber}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'scheduled': { label: 'Scheduled', className: 'status-scheduled' },
      'verified': { label: 'Verified', className: 'status-verified' },
      'evaluated': { label: 'Evaluated', className: 'status-evaluated' },
      'passed': { label: 'Passed', className: 'status-passed' },
      'failed': { label: 'Failed', className: 'status-failed' }
    };
    const statusInfo = statusMap[status] || statusMap['scheduled'];
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const getCandidatesForTab = () => {
    return activeTab === 'verification' ? allCandidates : verifiedCandidates;
  };

  return (
    <div className="supervisor-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">👮</span>
            <div>
              <h1>RTO Officer</h1>
              <p>Road Test Verification Dashboard</p>
            </div>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="user-name">{supervisorData?.name || 'RTO Officer'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <span className="tab-icon">🔍</span>
            Verification
            <span className="tab-count">{allCandidates.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            <span className="tab-icon">📝</span>
            Evaluation
            <span className="tab-count">{verifiedCandidates.length}</span>
          </button>
        </div>

        <div className="content-header">
          <div className="header-left">
            <h2>{activeTab === 'verification' ? 'Candidates for Verification' : 'Verified Candidates - Ready for Evaluation'}</h2>
            <p className="date-info">
              📅 {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-number">{getCandidatesForTab().length}</span>
              <span className="stat-label">{activeTab === 'verification' ? 'Total Candidates' : 'Ready for Evaluation'}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading candidates...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchAllCandidates} className="retry-btn">
              Retry
            </button>
          </div>
        ) : getCandidatesForTab().length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No Candidates Found</h3>
            <p>
              {activeTab === 'verification' 
                ? 'There are no candidates who have applied for road test.' 
                : 'There are no verified candidates ready for evaluation.'}
            </p>
          </div>
        ) : (
          <div className="candidates-grid">
            {getCandidatesForTab().map((candidate) => (
              <div key={candidate.applicationNumber} className="candidate-card">
                <div className="card-header">
                  <div className="candidate-info">
                    <h3>{candidate.fullName}</h3>
                    <p className="application-number">#{candidate.applicationNumber}</p>
                  </div>
                  {getStatusBadge(candidate.roadTestStatus)}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="info-label">🕒 Time Slot:</span>
                    <span className="info-value">{candidate.roadTestSlot}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📞 Phone:</span>
                    <span className="info-value">{candidate.phoneNumber || candidate.phone || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">✉️ Email:</span>
                    <span className="info-value">{candidate.email}</span>
                  </div>
                  {candidate.roadTestScore && (
                    <div className="info-row">
                      <span className="info-label">📊 Score:</span>
                      <span className="info-value">{candidate.roadTestScore}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {activeTab === 'verification' ? (
                    candidate.roadTestStatus === 'verified' || candidate.roadTestStatus === 'evaluated' || candidate.roadTestStatus === 'passed' || candidate.roadTestStatus === 'failed' ? (
                      <button className="verify-btn verified-btn" disabled>
                        ✓ Verified
                      </button>
                    ) : (
                      <button 
                        className="verify-btn"
                        onClick={() => handleVerifyCandidate(candidate.applicationNumber)}
                      >
                        Verify Candidate
                      </button>
                    )
                  ) : (
                    <button 
                      className="evaluate-btn"
                      onClick={() => handleEvaluateCandidate(candidate.applicationNumber)}
                    >
                      Evaluate Road Test
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;
