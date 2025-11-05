import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TestDateSelector.css';

const TestDateSelector = ({ selectedDate, onDateSelect, minDaysFromNow = 1, testType = 'colorVision' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await axios.get('http://localhost:5001/api/applications/calendar-availability', {
        params: {
          testType,
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0]
        }
      });
      
      if (response.data.success) {
        setAvailability(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, testType]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const getMinDate = () => {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + minDaysFromNow));
    return date;
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const daysInMonth = lastDay.getUTCDate();
    const startingDayOfWeek = firstDay.getUTCDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(Date.UTC(year, month, day));
      days.push(dateObj);
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    
    const minDate = getMinDate();
    
    if (date < minDate) return true;
    
    const dateKey = formatDateKey(date);
    const dayInfo = availability[dateKey];
    
    if (!dayInfo) return false;
    
    return dayInfo.status === 'holiday' || dayInfo.status === 'unavailable';
  };

  const getDateColor = (date) => {
    if (!date) return '';
    
    const minDate = getMinDate();
    
    if (date < minDate) return 'past';
    
    const dateKey = formatDateKey(date);
    const dayInfo = availability[dateKey];
    
    if (!dayInfo) {
      return 'green';
    }
    
    return dayInfo.color;
  };

  const getDateTooltip = (date) => {
    if (!date) return '';
    const dateKey = formatDateKey(date);
    const dayInfo = availability[dateKey];
    
    if (!dayInfo) return '';
    
    if (dayInfo.isHoliday) {
      return dayInfo.holidayName || 'Holiday';
    }
    
    return `${dayInfo.availableSlots}/${dayInfo.maxSlots} slots available`;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(formatDateKey(date));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-selector">
      <div className="calendar-header">
        <button type="button" onClick={previousMonth} className="calendar-nav">
          ←
        </button>
        <h3 className="calendar-month">{monthName}</h3>
        <button type="button" onClick={nextMonth} className="calendar-nav">
          →
        </button>
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-color green"></span> Available
        </span>
        <span className="legend-item">
          <span className="legend-color orange"></span> Partially Filled
        </span>
        <span className="legend-item">
          <span className="legend-color red"></span> Full/Holiday
        </span>
      </div>

      {loading ? (
        <div className="calendar-loading">Loading...</div>
      ) : (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="calendar-days">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-day empty"></div>;
              }
              
              const dateKey = formatDateKey(date);
              const isSelected = selectedDate === dateKey;
              const isDisabled = isDateDisabled(date);
              const colorClass = getDateColor(date);
              const tooltip = getDateTooltip(date);
              
              return (
                <div
                  key={dateKey}
                  className={`calendar-day ${colorClass} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleDateClick(date)}
                  title={tooltip}
                >
                  {date.getUTCDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="selected-date-display">
          Selected: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      )}
    </div>
  );
};

export default TestDateSelector;
