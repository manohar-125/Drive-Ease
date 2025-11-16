import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ApplicationDashboard from './components/ApplicationDashboard';
import LearnerTestInstructions from './components/LearnerTestInstructions';
import LearnerTest from './components/LearnerTest';
import TestResult from './components/TestResult';
import SupervisorLogin from './components/SupervisorLogin';
import SupervisorDashboard from './components/SupervisorDashboard';
import CandidateVerification from './components/CandidateVerification';
import RoadTestEvaluation from './components/RoadTestEvaluation';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const handleLoginSuccess = (loginData) => {
    const sessionData = {
      digiLockerId: loginData.digilockerID,
      userData: loginData.userData || {},
      userId: loginData.userId,
      hasExistingApplication: loginData.hasExistingApplication || false,
      applicationData: loginData.applicationData || null
    };
    setUserSession(sessionData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserSession(null);
  };

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/" 
          element={
            !isLoggedIn ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn ? (
              <ApplicationDashboard 
                userSession={userSession}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/dashboard/:applicationNumber" 
          element={
            isLoggedIn ? (
              <ApplicationDashboard 
                userSession={userSession}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/learner-test-instructions/:applicationNumber" 
          element={
            isLoggedIn ? (
              <LearnerTestInstructions />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/learner-test/:applicationNumber" 
          element={
            isLoggedIn ? (
              <LearnerTest />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/test-result/:applicationNumber" 
          element={
            isLoggedIn ? (
              <TestResult />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Supervisor Routes */}
        <Route 
          path="/supervisor/login" 
          element={<SupervisorLogin />} 
        />
        
        <Route 
          path="/supervisor/dashboard" 
          element={<SupervisorDashboard />} 
        />
        
        <Route 
          path="/supervisor/verify/:applicationNumber" 
          element={<CandidateVerification />} 
        />
        
        <Route 
          path="/supervisor/evaluate/:applicationNumber" 
          element={<RoadTestEvaluation />} 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;