import React, { useState } from 'react';
import Login from './components/Login';
import ApplicationDashboard from './components/ApplicationDashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const handleLoginSuccess = (loginData) => {
    console.log('Login Data Received:', loginData);
    const sessionData = {
      digiLockerId: loginData.digilockerID,
      userData: loginData.userData || {},
      userId: loginData.userId,
      hasExistingApplication: loginData.hasExistingApplication || false,
      applicationData: loginData.applicationData || null
    };
    console.log('Session Data Set:', sessionData);
    setUserSession(sessionData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserSession(null);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <ApplicationDashboard 
          userSession={userSession}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;