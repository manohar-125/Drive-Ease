import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoadTestApplication.css';
import TestDateSelector from './TestDateSelector';

const RoadTestApplication = ({ applicationNumber, digiLockerId, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    learnerLicenseId: '',
    learnerLicenseExpiryDate: '',
    roadTestDate: '',
    roadTestSlot: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [learnerLicenseValid, setLearnerLicenseValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [learnerTestDate, setLearnerTestDate] = useState(null);
  const [learnerTestPassed, setLearnerTestPassed] = useState(false);

  useEffect(() => {
    // Fetch learner license details from application
    fetchLearnerLicenseDetails();
  }, [applicationNumber]);

  const fetchLearnerLicenseDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/applications/user/${digiLockerId}`);
      const app = response.data.data || response.data;
      
      // Check if learner test is passed
      if (app.learnerTestStatus !== 'passed') {
        setValidationMessage('You must pass the Learner Test before applying for Road Test.');
        setLearnerTestPassed(false);
        return;
      }
      
      setLearnerTestPassed(true);
      
      // Store learner test date for validation
      if (app.learnerTestDate) {
        setLearnerTestDate(app.learnerTestDate);
      }
      
      if (app.learnerLicenseNumber && app.learnerLicenseExpiryDate) {
        const expiryDate = new Date(app.learnerLicenseExpiryDate);
        const today = new Date();
        const isValid = expiryDate > today;
        
        setFormData(prev => ({
          ...prev,
          learnerLicenseId: app.learnerLicenseNumber,
          learnerLicenseExpiryDate: app.learnerLicenseExpiryDate
        }));
        
        setLearnerLicenseValid(isValid);
        
        if (!isValid) {
          setValidationMessage('Your Learner License has expired. Please renew before applying for Road Test.');
        }
      } else {
        setValidationMessage('You must complete the Learner License Test first.');
      }
    } catch (error) {
      console.error('Error fetching learner license:', error);
      setValidationMessage('Unable to verify Learner License. Please try again.');
    }
  };

  const handleDateChange = async (selectedDate) => {
    setFormData(prev => ({ ...prev, roadTestDate: selectedDate, roadTestSlot: '' }));
    setErrors(prev => ({ ...prev, roadTestDate: '', roadTestSlot: '' }));

    // Fetch available slots for selected date
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/applications/calendar-availability', {
        params: { 
          testType: 'road',
          date 
        }
      });
      
      // Check if date is available (not holiday/weekend)
      const dateKey = date;
      const dayInfo = response.data.data?.[dateKey];
      
      if (dayInfo?.isHoliday) {
        setErrors(prev => ({ ...prev, roadTestDate: `${dayInfo.holidayName || 'Holiday'} - Office closed. Please select another date.` }));
        setAvailableSlots([]);
        setLoading(false);
        return;
      }
      
      if (dayInfo?.status === 'unavailable') {
        setErrors(prev => ({ ...prev, roadTestDate: 'No slots available for this date. Please select another date.' }));
        setAvailableSlots([]);
        setLoading(false);
        return;
      }
      
      // Generate time slots (9 AM to 5 PM, maximum 5 slots)
      const timeSlots = [
        '09:00 AM - 10:00 AM',
        '11:00 AM - 12:00 PM',
        '01:00 PM - 02:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
      ];
      
      setAvailableSlots(timeSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setErrors(prev => ({ ...prev, roadTestDate: 'Unable to fetch available slots.' }));
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setFormData(prev => ({ ...prev, roadTestSlot: slot }));
    setErrors(prev => ({ ...prev, roadTestSlot: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!learnerLicenseValid) {
      newErrors.general = 'You must have a valid Learner License to apply for Road Test.';
    }
    
    if (!formData.roadTestDate) {
      newErrors.roadTestDate = 'Please select a road test date.';
    }
    
    if (!formData.roadTestSlot) {
      newErrors.roadTestSlot = 'Please select a time slot.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5001/api/applications/apply-road-test', {
        applicationNumber,
        learnerLicenseId: formData.learnerLicenseId,
        roadTestDate: formData.roadTestDate,
        roadTestSlot: formData.roadTestSlot
      });
      
      if (response.data.success) {
        onComplete({
          success: true,
          message: 'Road Test application submitted successfully!',
          roadTestDate: formData.roadTestDate,
          roadTestSlot: formData.roadTestSlot
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit road test application.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="road-test-application">
      <div className="road-test-container">
        <div className="road-test-header">
          <h2>Apply for Road Test</h2>
          <p className="subtitle">Schedule your practical driving test</p>
        </div>

        {validationMessage && (!learnerTestPassed || !learnerLicenseValid) && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{validationMessage}</span>
          </div>
        )}

        {errors.general && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <span>{errors.general}</span>
          </div>
        )}

        {learnerTestPassed && learnerLicenseValid && (
        <form onSubmit={handleSubmit} className="road-test-form">
          <div className="form-section">
            <h3>Learner License Details</h3>
            
            <div className="form-group">
              <label>Learner License Number</label>
              <input
                type="text"
                value={formData.learnerLicenseId}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label>License Expiry Date</label>
              <input
                type="date"
                value={formData.learnerLicenseExpiryDate ? new Date(formData.learnerLicenseExpiryDate).toISOString().split('T')[0] : ''}
                disabled
                className="input-disabled"
              />
              {learnerLicenseValid && (
                <span className="validation-success">✓ Valid</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Select Road Test Date & Slot</h3>
            
            <div className="form-group">
              <label>Test Date *</label>
              <TestDateSelector
                selectedDate={formData.roadTestDate}
                onDateSelect={handleDateChange}
                minDate={learnerTestDate}
                testType="road"
              />
              {errors.roadTestDate && (
                <span className="error-message">{errors.roadTestDate}</span>
              )}
              
            </div>

            {formData.roadTestDate && availableSlots.length > 0 && (
              <div className="form-group">
                <label>Select Time Slot * (Maximum 5 slots per day)</label>
                <div className="slots-grid">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`slot-btn ${formData.roadTestSlot === slot ? 'selected' : ''}`}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={loading}
                    >
                      <span className="slot-time">{slot}</span>
                    </button>
                  ))}
                </div>
                {errors.roadTestSlot && (
                  <span className="error-message">{errors.roadTestSlot}</span>
                )}
              </div>
            )}
          </div>

          <div className="important-notes">
            <h4>⚠️ Important Notes:</h4>
            <ul>
              <li>Road Test must be scheduled within 6 months of learner license issue date</li>
              <li>You can have only one active road test application</li>
              <li>Slot is confirmed only after successful submission</li>
              <li>Bring your learner license on the test day</li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!learnerLicenseValid || loading || !formData.roadTestDate || !formData.roadTestSlot}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default RoadTestApplication;
