import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    applicationNumber: '',
    digilockerID: '',
    email: '',
    phone: '',
    address: '',
    licenseType: '',
    otp: '',
    consent: false,
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [digilockerData, setDigilockerData] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.applicationNumber || !formData.password) {
      setError('Please enter Application Number and Password');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        applicationNumber: formData.applicationNumber,
        password: formData.password
      });

      if (response.data.success) {
        onLoginSuccess({
          ...response.data.data,
          digiLockerId: response.data.data.digilockerID
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDigilocker = async () => {
    setError('');

    if (!formData.digilockerID) {
      setError('Please enter DigiLocker ID');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/applications/verify-digilocker', {
        digilocker: formData.digilockerID
      });

      if (response.data.success) {
        setDigilockerData(response.data.userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid DigiLocker ID');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');

    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/generate', {
        phone: formData.phone
      });

      if (response.data.success) {
        setOtpSent(true);
        alert(`OTP sent: ${response.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');

    if (!formData.otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/applications/otp/verify', {
        phone: formData.phone,
        otp: formData.otp
      });

      if (response.data.success) {
        setPhoneVerified(true);
        setOtpSent(false);
        alert('Phone number verified successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!digilockerData) {
      setError('Please verify DigiLocker ID first');
      return;
    }

    if (!formData.licenseType || !formData.phone || !formData.email || !formData.address || !formData.password || !formData.confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (!phoneVerified) {
      setError('Please verify your phone number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.consent) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (!formData.photo) {
      setError('Photo is required');
      return;
    }

    const formPayload = new FormData();
    formPayload.append('password', formData.password);
    formPayload.append('digilockerID', formData.digilockerID);
    formPayload.append('email', formData.email);
    formPayload.append('phone', formData.phone);
    formPayload.append('address', formData.address);
    formPayload.append('licenseType', formData.licenseType);
    formPayload.append('photo', formData.photo);

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        alert(`Registration successful!\n\nYour Application Number (Username): ${response.data.data.applicationNumber}\n`);
        setMode('login');
        setFormData({
          password: '',
          confirmPassword: '',
          applicationNumber: '',
          digilockerID: '',
          email: '',
          phone: '',
          address: '',
          licenseType: '',
          otp: '',
          consent: false,
          photo: null
        });
        setDigilockerData(null);
        setPhoneVerified(false);
        setOtpSent(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{mode === 'login' ? 'Login' : 'Registration'}</h1>
        </div>

        <div className="login-content">
          {mode === 'login' ? (
            <>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Application Number</label>
                  <input
                    type="text"
                    name="applicationNumber"
                    value={formData.applicationNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your Application Number"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="register-link">
                <p>Don't have an account?</p>
                <button 
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setFormData({
                      password: '',
                      confirmPassword: '',
                      digilockerID: '',
                      email: '',
                      phone: '',
                      address: '',
                      licenseType: '',
                      otp: '',
                      consent: false,
                      photo: null
                    });
                  }} 
                  className="btn-secondary"
                >
                  Register Now
                </button>
              </div>

              <div className="supervisor-login-link">
                <button 
                  onClick={() => navigate('/supervisor/login')} 
                  className="btn-supervisor"
                >
                  Login as RTO Officer
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>DigiLocker ID *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      name="digilockerID"
                      value={formData.digilockerID}
                      onChange={handleInputChange}
                      placeholder="Enter DigiLocker ID"
                      disabled={loading || digilockerData}
                      style={{ flex: 1 }}
                    />
                    {!digilockerData && (
                      <button
                        type="button"
                        onClick={handleVerifyDigilocker}
                        disabled={loading || !formData.digilockerID}
                        className="btn-primary"
                        style={{ width: '120px' }}
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                    {digilockerData && (
                      <span style={{ color: 'green', alignSelf: 'center' }}>✓ Verified</span>
                    )}
                  </div>
                </div>

                {digilockerData && (
                  <div className="digilocker-info">
                    <p><strong>Name:</strong> {digilockerData.fullName}</p>
                    <p><strong>DOB:</strong> {new Date(digilockerData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <p><strong>Gender:</strong> {digilockerData.gender}</p>
                    <p><strong>Father Name:</strong> {digilockerData.fatherName}</p>
                    <p><strong>Blood Group:</strong> {digilockerData.bloodGroup}</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Upload Photo (jpg/jpeg/png, max 6MB) *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                      if (!allowedTypes.includes(file.type)) {
                        setError('Only JPG, JPEG, and PNG formats are allowed');
                        setFormData(prev => ({ ...prev, photo: null }));
                        return;
                      }
                      if (file.size > 6 * 1024 * 1024) {
                        setError('Image size must be less than 6MB');
                        setFormData(prev => ({ ...prev, photo: null }));
                        return;
                      }
                      setError('');
                      setFormData(prev => ({ ...prev, photo: file }));
                    }}
                    disabled={loading || !digilockerData}
                  />
                  {formData.photo && <span className="success-text">Photo selected: {formData.photo.name}</span>}
                </div>

                <div className="form-group">
                  <label>License Type *</label>
                  <select
                    name="licenseType"
                    value={formData.licenseType}
                    onChange={handleInputChange}
                    disabled={loading || !digilockerData}
                  >
                    <option value="">Select License Type</option>
                    <option value="Two Wheeler">Two Wheeler</option>
                    <option value="Four Wheeler">Four Wheeler</option>
                    <option value="Two Cum Four Wheeler">Two Cum Four Wheeler</option>
                    <option value="Light Motor Vehicle">Light Motor Vehicle</option>
                    <option value="Heavy Vehicle">Heavy Vehicle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      disabled={loading || !digilockerData || phoneVerified}
                      style={{ flex: 1 }}
                    />
                    {!phoneVerified && !otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || !formData.phone || !digilockerData}
                        className="btn-primary"
                        style={{ width: '120px' }}
                      >
                        Send OTP
                      </button>
                    )}
                    {phoneVerified && (
                      <span style={{ color: 'green', alignSelf: 'center' }}>✓ Verified</span>
                    )}
                  </div>
                </div>

                {otpSent && !phoneVerified && (
                  <div className="form-group">
                    <label>Enter OTP *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        disabled={loading}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || !formData.otp}
                        className="btn-primary"
                        style={{ width: '120px' }}
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={loading || !digilockerData}
                  />
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your complete address"
                    rows="3"
                    disabled={loading || !digilockerData}
                  />
                </div>

                <div className="form-group">
                  <label>Create Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    disabled={loading || !digilockerData}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter password"
                    disabled={loading || !digilockerData}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    disabled={loading || !digilockerData}
                    style={{ width: 'auto' }}
                  />
                  <label style={{ margin: 0 }}>I accept the terms and conditions *</label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn-primary" disabled={loading || !digilockerData}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>

              <div className="back-to-login">
                <button 
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setDigilockerData(null);
                    setPhoneVerified(false);
                    setOtpSent(false);
                    setFormData({
                      password: '',
                      confirmPassword: '',
                      digilockerID: '',
                      email: '',
                      phone: '',
                      address: '',
                      licenseType: '',
                      otp: '',
                      consent: false
                    });
                  }} 
                  className="btn-link"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
