import React, { useState } from 'react';
import Login from './components/Login';
import ApplicationDashboard from './components/ApplicationDashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const handleLoginSuccess = (sessionData) => {
    console.log('Login successful:', sessionData);
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