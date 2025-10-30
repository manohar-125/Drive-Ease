import React, { useState } from 'react';
import Calendar from './Calendar';
import './DateSelector.css';

const DateSelector = ({ testType, userData, onDateSelected, selectedDate }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');

  const testTypeNames = {
    colorVision: 'Color Vision Test',
    learnerTest: 'Learner Test',
    roadTest: 'Road Test'
  };

  const handleDateSelect = (dayData) => {
    // Check if date is available
    if (dayData.isHoliday) {
      setError(`Cannot select holiday: ${dayData.holidayReason || 'Public Holiday'}`);
      return;
    }
    
    if (!dayData.details[testType] || dayData.details[testType].available <= 0) {
      setError(`No slots available for ${testTypeNames[testType]} on ${new Date(dayData.date).toLocaleDateString()}`);
      return;
    }
    
    // Simply select the date without booking
    setError('');
    onDateSelected(dayData.date);
    setShowCalendar(false);
  };

  return (
    <div className="date-selector">
      <div className="date-selector-header">
        <h4>Select Date for {testTypeNames[testType]}</h4>
        {selectedDate && (
          <div className="selected-date">
            <span>Selected: {new Date(selectedDate).toLocaleDateString()}</span>
            <button 
              className="change-date-btn"
              onClick={() => {
                setShowCalendar(!showCalendar);
                setError('');
              }}
            >
              {showCalendar ? 'Hide Calendar' : 'Change Date'}
            </button>
          </div>
        )}
        {!selectedDate && (
          <button 
            className="select-date-btn"
            onClick={() => {
              setShowCalendar(!showCalendar);
              setError('');
            }}
          >
            {showCalendar ? 'Hide Calendar' : 'Select Date'}
          </button>
        )}
      </div>

      {showCalendar && (
        <div className="calendar-wrapper">
          <Calendar
            testType={testType}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            size="compact"
          />
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            className="error-close"
            onClick={() => setError('')}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DateSelector;