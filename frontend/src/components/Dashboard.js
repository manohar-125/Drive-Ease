import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';

import axios from 'axios';import { useNavigate, useLocation } from 'react-router-dom';

import './Dashboard.css';import axios from 'axios';

import RegistrationForm from './RegistrationForm';import './Dashboard.css';

import SlotBooking from './SlotBooking';

const Dashboard = () => {

const Dashboard = ({ userSession, onLogout }) => {  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null); // null means showing dashboard menu  const location = useLocation();

  const [completedSteps, setCompletedSteps] = useState([]);  const [userData, setUserData] = useState(null);

  const [applicationData, setApplicationData] = useState(null);  const [completedSteps, setCompletedSteps] = useState([]);

  const [applicationNumber, setApplicationNumber] = useState('');  const [testDates, setTestDates] = useState({});

    const [applicationData, setApplicationData] = useState(null);

  const userData = userSession?.userData || {};  const [loading, setLoading] = useState(true);

  const digiLockerId = userSession?.digiLockerId || '';

  useEffect(() => {

  // Load application data if exists    // Get user data from navigation state

  useEffect(() => {    if (location.state && location.state.userData) {

    loadApplicationData();      setUserData(location.state.userData);

  }, [digiLockerId]);      fetchUserApplicationData(location.state.userData.digilockerID);

    } else {

  const loadApplicationData = async () => {      // Redirect to home if no user data

    try {      navigate('/');

      const response = await axios.get(`http://localhost:5001/api/applications/${digiLockerId}`);    }

      if (response.data.success && response.data.application) {  }, [location, navigate]);

        const app = response.data.application;

        setApplicationData(app);  // Fetch user's current application status

        setApplicationNumber(app.applicationNumber || '');  const fetchUserApplicationData = async (digilockerID) => {

            try {

        // Determine completed steps based on application data      const response = await axios.get(`http://localhost:5001/api/applications/user/${digilockerID}`);

        const completed = [];      if (response.data.success && response.data.data) {

        if (app.registrationComplete) completed.push(1);        const appData = response.data.data;

        if (app.colorTestDate && app.learnerTestDate) completed.push(2);        setApplicationData(appData);

        if (app.colorTestPassed) completed.push(3);        

        if (app.learnerTestPassed) completed.push(4);        // Set completed steps based on application data

                const completed = [];

        setCompletedSteps(completed);        if (appData.applicationStatus === 'submitted' || appData.applicationStatus === 'completed') {

      }          completed.push('apply-learner');

    } catch (error) {        }

      console.log('No existing application found');        if (appData.colorVisionTestCompleted) {

    }          completed.push('color-vision-test');

  };        }

        if (appData.learnerTestCompleted) {

  const isStepUnlocked = (step) => {          completed.push('learner-test');

    if (step === 1) return true; // Registration always unlocked        }

    return completedSteps.includes(step - 1);        if (appData.learnerLicenseDownloaded) {

  };          completed.push('download-learner');

        }

  const handleStepComplete = (step) => {        if (appData.roadTestCompleted) {

    if (!completedSteps.includes(step)) {          completed.push('road-test');

      setCompletedSteps(prev => [...prev, step]);        }

    }        if (appData.drivingLicenseDownloaded) {

    loadApplicationData(); // Reload data          completed.push('download-license');

    setActiveSection(null); // Go back to dashboard        }

  };        

        setCompletedSteps(completed);

  const steps = [        

    { id: 1, title: 'Registration', icon: '📝', description: 'Complete your profile and upload documents' },        // Set test dates from application data

    { id: 2, title: 'Book Slot & Payment', icon: '📅', description: 'Book test slots and make payment' },        if (appData.colorTestDate && appData.learnerTestDate) {

    { id: 3, title: 'Colour Vision Test', icon: '🎨', description: 'Attend colour vision test' },          setTestDates({

    { id: 4, title: 'Learner Test', icon: '📖', description: 'Complete learner\'s test' },            colorTestDate: appData.colorTestDate,

    { id: 5, title: 'Apply for Road Test', icon: '🚗', description: 'Submit road test application' }            learnerTestDate: appData.learnerTestDate

  ];          });

        }

  // If a section is active, show that section      }

  if (activeSection === 1) {    } catch (error) {

    return (      console.log('No existing application found for user');

      <RegistrationForm       // This is normal for new users

        userSession={userSession}    }

        onComplete={(appNumber) => {    setLoading(false);

          setApplicationNumber(appNumber);  };

          handleStepComplete(1);

        }}  // Check if a date-based step should be active

        onBack={() => setActiveSection(null)}  const isDateBasedStepActive = (stepAction, testDate) => {

      />    if (!testDate) return false;

    );    const today = new Date();

  }    const stepDate = new Date(testDate);

    return today >= stepDate;

  if (activeSection === 2) {  };

    return (

      <SlotBooking   // Get step status based on completion and dates

        digiLockerId={digiLockerId}  const getStepStatus = (step) => {

        applicationNumber={applicationNumber}    if (completedSteps.includes(step.action)) {

        onComplete={() => handleStepComplete(2)}      return 'completed';

        onBack={() => setActiveSection(null)}    }

      />    

    );    if (step.action === 'apply-learner') {

  }      // If user has already applied, show as completed, otherwise active

      if (applicationData && applicationData.applicationStatus) {

  // Main Dashboard View        return 'completed';

  return (      }

    <div className="dashboard-container">      return 'active';

      {/* Header */}    }

      <div className="dashboard-header">    

        <div className="header-content">    if (step.action === 'color-vision-test') {

          <div className="logo-section">      if (completedSteps.includes('apply-learner')) {

            <div className="logo">🚗</div>        if (isDateBasedStepActive(step.action, testDates.colorTestDate)) {

            <h1>Drive-Ease</h1>          return 'active';

          </div>        } else {

          <div className="user-info">          return 'scheduled';

            <div className="user-details">        }

              <p className="user-name">{userData.fullName}</p>      }

              <p className="user-id">DigiLocker: {digiLockerId}</p>      return 'locked';

              {applicationNumber && <p className="app-num">App No: {applicationNumber}</p>}    }

            </div>    

            <button onClick={onLogout} className="logout-btn">    if (step.action === 'learner-test') {

              Logout      if (completedSteps.includes('color-vision-test')) {

            </button>        if (isDateBasedStepActive(step.action, testDates.learnerTestDate)) {

          </div>          return 'active';

        </div>        } else {

      </div>          return 'scheduled';

        }

      {/* Main Dashboard Content */}      }

      <div className="dashboard-main">      return 'locked';

        <div className="dashboard-welcome">    }

          <h2>Welcome, {userData.fullName}!</h2>    

          <p>Complete the following steps to apply for your driving license</p>    if (step.action === 'download-learner') {

        </div>      if (completedSteps.includes('learner-test')) {

        return 'active';

        <div className="steps-grid">      }

          {steps.map((step) => {      return 'locked';

            const isCompleted = completedSteps.includes(step.id);    }

            const isUnlocked = isStepUnlocked(step.id);    

            const isCurrent = isUnlocked && !isCompleted;    if (step.action === 'road-test') {

      if (completedSteps.includes('download-learner')) {

            return (        return 'active';

              <div      }

                key={step.id}      return 'locked';

                className={`step-card ${isCompleted ? 'completed' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}    }

                onClick={() => {    

                  if (isUnlocked) {    if (step.action === 'download-license') {

                    setActiveSection(step.id);      if (completedSteps.includes('road-test')) {

                  }        return 'active';

                }}      }

              >      return 'locked';

                <div className="step-icon">{step.icon}</div>    }

                <div className="step-content">    

                  <div className="step-header">    return 'locked';

                    <h3>Step {step.id}</h3>  };

                    {isCompleted && <span className="check-badge">✓</span>}

                    {!isUnlocked && <span className="lock-badge">🔒</span>}  // Get step message for scheduled tests

                  </div>  const getStepMessage = (step) => {

                  <h4>{step.title}</h4>    const status = getStepStatus(step);

                  <p>{step.description}</p>    if (status === 'scheduled') {

                  {isCurrent && <button className="start-btn">Start Now →</button>}      if (step.action === 'color-vision-test' && testDates.colorTestDate) {

                  {isCompleted && <span className="status-text">Completed</span>}        return `Available on ${new Date(testDates.colorTestDate).toLocaleDateString()}`;

                  {!isUnlocked && <span className="status-text">Locked</span>}      }

                </div>      if (step.action === 'learner-test' && testDates.learnerTestDate) {

              </div>        return `Available on ${new Date(testDates.learnerTestDate).toLocaleDateString()}`;

            );      }

          })}    }

        </div>    return step.description;

      </div>  };

    </div>

  );  const steps = [

};    {

      id: 1,

export default Dashboard;      title: 'Apply for Learner License',

      description: 'Submit your learner license application',
      icon: '',
      status: 'active',
      action: 'apply-learner'
    },
    {
      id: 2,
      title: 'Attempt Color Vision Test',
      description: 'Complete your color vision test',
      icon: '',
      status: 'locked',
      action: 'color-vision-test'
    },
    {
      id: 3,
      title: 'Attempt Learner Test',
      description: 'Take your theory test',
      icon: '',
      status: 'locked',
      action: 'learner-test'
    },
    {
      id: 4,
      title: 'Download Learner License',
      description: 'Get your learner license document',
      icon: '',
      status: 'locked',
      action: 'download-learner'
    },
    {
      id: 5,
      title: 'Apply for Road Test',
      description: 'Schedule your practical driving test',
      icon: '',
      status: 'locked',
      action: 'road-test'
    },
    {
      id: 6,
      title: 'Download Driving License',
      description: 'Get your full driving license',
      icon: '',
      status: 'locked',
      action: 'download-license'
    }
  ];

  const handleStepClick = (step) => {
    const stepStatus = getStepStatus(step);
    
    if (stepStatus === 'locked') {
      alert('Please complete the previous steps first');
      return;
    }
    
    if (stepStatus === 'scheduled') {
      alert(`This step will be available on ${getStepMessage(step).split('Available on ')[1]}`);
      return;
    }
    
    if (stepStatus === 'completed') {
      alert('This step has already been completed');
      return;
    }

    switch (step.action) {
      case 'apply-learner':
        // Check if user has already applied
        if (applicationData && applicationData.applicationStatus) {
          alert('You have already applied for learner license. Please proceed to the next steps.');
          return;
        }
        navigate('/learner-application', { 
          state: { userData: userData } 
        });
        break;
      case 'color-vision-test':
        handleColorVisionTest();
        break;
      case 'learner-test':
        handleLearnerTest();
        break;
      case 'road-test':
        handleRoadTest();
        break;
      case 'download-learner':
        handleDownloadLearner();
        break;
      case 'download-license':
        handleDownloadLicense();
        break;
      default:
        console.log('Unknown action:', step.action);
    }
  };

  const handleDownloadLearner = async () => {
    try {
      // Mark learner license as downloaded in database
      const response = await axios.put(`http://localhost:5001/api/applications/download-learner/${userData.digilockerID}`);
      
      if (response.data.success) {
        // Update local state
        setCompletedSteps([...completedSteps, 'download-learner']);
        
        // Create and download a dummy PDF
        const element = document.createElement('a');
        const file = new Blob(['This is a sample Learner License for ' + userData.fullName], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `learner-license-${userData.digilockerID}.pdf`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        alert('Learner License downloaded successfully!');
      } else {
        alert('Failed to download learner license. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading learner license. Please try again.');
    }
  };

  const handleDownloadLicense = async () => {
    try {
      // Mark driving license as downloaded in database
      const response = await axios.put(`http://localhost:5001/api/applications/download-license/${userData.digilockerID}`);
      
      if (response.data.success) {
        // Update local state
        setCompletedSteps([...completedSteps, 'download-license']);
        
        // Create and download a dummy PDF
        const element = document.createElement('a');
        const file = new Blob(['This is a sample Driving License for ' + userData.fullName], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `driving-license-${userData.digilockerID}.pdf`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        alert('Driving License downloaded successfully!');
      } else {
        alert('Failed to download driving license. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading driving license. Please try again.');
    }
  };

  const handleColorVisionTest = async () => {
    try {
      const confirm = window.confirm('Ready to take the Color Vision Test? Click OK to start the test.');
      if (!confirm) return;
      
      // Simulate test taking
      alert('Taking Color Vision Test... Please identify the colors shown in the patterns.');
      
      // Simulate test completion (in real app, this would be actual test logic)
      const testPassed = window.confirm('Test completed! Did you pass the Color Vision Test?');
      
      if (testPassed) {
        // Mark test as completed in backend
        const response = await axios.put(`http://localhost:5001/api/applications/complete-color-vision/${userData.digilockerID}`);
        
        if (response.data.success) {
          // Update local state
          setCompletedSteps([...completedSteps, 'color-vision-test']);
          alert('Color Vision Test completed successfully!');
          
          // Refresh application data
          fetchUserApplicationData(userData.digilockerID);
        } else {
          alert('Failed to record test completion. Please try again.');
        }
      } else {
        alert('Test not passed. Please practice and try again later.');
      }
    } catch (error) {
      console.error('Color vision test error:', error);
      alert('Error during color vision test. Please try again.');
    }
  };

  const handleLearnerTest = async () => {
    try {
      const confirm = window.confirm('Ready to take the Learner Test (Theory)? Click OK to start the test.');
      if (!confirm) return;
      
      // Simulate test taking
      alert('Taking Learner Test... Answer the traffic rules and road safety questions.');
      
      // Simulate test completion
      const testPassed = window.confirm('Test completed! Did you pass the Learner Test?');
      
      if (testPassed) {
        // Mark test as completed in backend
        const response = await axios.put(`http://localhost:5001/api/applications/complete-learner-test/${userData.digilockerID}`);
        
        if (response.data.success) {
          // Update local state
          setCompletedSteps([...completedSteps, 'learner-test']);
          alert('Learner Test completed successfully! You can now download your Learner License.');
          
          // Refresh application data
          fetchUserApplicationData(userData.digilockerID);
        } else {
          alert('Failed to record test completion. Please try again.');
        }
      } else {
        alert('Test not passed. Please study and try again later.');
      }
    } catch (error) {
      console.error('Learner test error:', error);
      alert('Error during learner test. Please try again.');
    }
  };

  const handleRoadTest = async () => {
    try {
      const confirm = window.confirm('Ready to take the Road Test (Practical)? Click OK to start the test.');
      if (!confirm) return;
      
      // Simulate test taking
      alert('Taking Road Test... Demonstrate your driving skills with the examiner.');
      
      // Simulate test completion
      const testPassed = window.confirm('Test completed! Did you pass the Road Test?');
      
      if (testPassed) {
        // Mark test as completed in backend
        const response = await axios.put(`http://localhost:5001/api/applications/complete-road-test/${userData.digilockerID}`);
        
        if (response.data.success) {
          // Update local state
          setCompletedSteps([...completedSteps, 'road-test']);
          alert('Road Test completed successfully! You can now download your Driving License.');
          
          // Refresh application data
          fetchUserApplicationData(userData.digilockerID);
        } else {
          alert('Failed to record test completion. Please try again.');
        }
      } else {
        alert('Test not passed. Please practice more and try again later.');
      }
    } catch (error) {
      console.error('Road test error:', error);
      alert('Error during road test. Please try again.');
    }
  };

  const handleLogout = () => {
    setUserData(null);
    navigate('/');
  };

  if (!userData || loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              {userData.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h2>Welcome, {userData.fullName}</h2>
              <p>DigiLocker ID: {userData.digilockerID}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="progress-section">
          <h3>Your Driving License Progress</h3>
          <div className="progress-tracker">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step);
              const stepMessage = getStepMessage(step);
              
              return (
                <div 
                  key={step.id} 
                  className={`progress-step ${stepStatus}`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="step-icon">
                    <span className="icon">{step.icon}</span>
                    <span className="step-number">{step.id}</span>
                  </div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{stepMessage}</p>
                    <div className="step-status">
                      {stepStatus === 'active' && (
                        <span className="status-badge active">Start Now</span>
                      )}
                      {stepStatus === 'completed' && (
                        <span className="status-badge completed">Completed</span>
                      )}
                      {stepStatus === 'scheduled' && (
                        <span className="status-badge scheduled">Scheduled</span>
                      )}
                      {stepStatus === 'locked' && (
                        <span className="status-badge locked">Locked</span>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="step-connector"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="sidebar-card">
            <h4>Personal Information</h4>
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{userData.fullName}</span>
            </div>
            <div className="info-item">
              <span className="label">Father's Name:</span>
              <span className="value">{userData.fatherName}</span>
            </div>
            <div className="info-item">
              <span className="label">Date of Birth:</span>
              <span className="value">
                {new Date(userData.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Gender:</span>
              <span className="value">{userData.gender}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;