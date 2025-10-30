import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Calendar.css';

const Calendar = ({ onDateSelect, testType = 'colorVision', selectedDate, size = 'normal' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/applications/calendar/${currentYear}/${currentMonth}`);
      if (response.data.success) {
        setCalendarData(response.data.data.calendar);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      // Fallback: Generate a basic calendar structure when backend is not available
      generateFallbackCalendar();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackCalendar = () => {
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    const fallbackCalendar = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      fallbackCalendar.push({
        date: new Date(currentDate),
        dateStr: dateStr,
        status: 'available',
        details: {
          colorVision: { available: 5, booked: 0 },
          learnerTest: { available: 5, booked: 0 }
        },
        isHoliday: false,
        holidayReason: null
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarData(fallbackCalendar);
  };

  const getDateStatus = (dayData) => {
    if (!dayData || dayData.isHoliday) return 'holiday';
    
    const testDetails = dayData.details?.[testType];
    if (!testDetails || testDetails.available === 0) return 'unavailable';
    if (testDetails.available < 5) return 'partial';
    return 'available';
  };

  const getDateColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50'; // Green
      case 'partial': return '#FF9800'; // Orange
      case 'unavailable': return '#F44336'; // Red
      case 'holiday': return '#2196F3'; // Blue
      default: return '#f0f0f0'; // Light gray
    }
  };

  const handleDateClick = (dayData) => {
    if (!dayData || !dayData.date || dayData.isHoliday) {
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDay = new Date(dayData.date);
    selectedDay.setHours(0, 0, 0, 0);
    
    // Don't allow past dates
    if (selectedDay < today) {
      return;
    }

    onDateSelect(dayData);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  // Get first day of month and create calendar grid
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const calendarGrid = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.push(null);
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = calendarData.find(d => {
      if (!d || !d.date) return false;
      const dayDataDate = new Date(d.date);
      return dayDataDate.getDate() === day && 
             dayDataDate.getMonth() === currentMonth - 1 && 
             dayDataDate.getFullYear() === currentYear;
    });
    calendarGrid.push(dayData);
  }

  return (
    <div className={`calendar-container ${size === 'compact' ? 'compact' : ''}`}>
      <div className="calendar-header">
        <button 
          className="nav-btn" 
          onClick={() => navigateMonth('prev')}
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <h3>{monthNames[currentMonth - 1]} {currentYear}</h3>
        <button 
          className="nav-btn" 
          onClick={() => navigateMonth('next')}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>Available (5 slots)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
          <span>Limited slots</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
          <span>Fully booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
          <span>Holiday</span>
        </div>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarGrid.map((dayData, index) => {
          if (!dayData || !dayData.date || !dayData.details) {
            return <div key={index} className="calendar-day empty"></div>;
          }

          const status = getDateStatus(dayData);
          const dayDate = new Date(dayData.date);
          const isToday = new Date().toDateString() === dayDate.toDateString();
          const isSelected = selectedDate && 
            new Date(selectedDate).toDateString() === dayDate.toDateString();
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayDateCopy = new Date(dayData.date);
          dayDateCopy.setHours(0, 0, 0, 0);
          const isPast = dayDateCopy < today;

          return (
            <div
              key={index}
              className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''} ${status}`}
              style={{ 
                backgroundColor: getDateColor(status),
                opacity: isPast ? 0.5 : 1,
                cursor: (status === 'holiday' || status === 'unavailable' || isPast) ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleDateClick(dayData)}
              title={
                dayData.isHoliday 
                  ? `Holiday: ${dayData.holidayReason || 'Public Holiday'}`
                  : `${testType}: ${dayData.details[testType]?.available || 0} slots available`
              }
            >
              <div className="day-number">{dayDate.getDate()}</div>
              <div className="day-info">
                {dayData.isHoliday ? (
                  <span className="holiday-text">Holiday</span>
                ) : (
                  <span className="available-text">{dayData.details[testType]?.available || 0}/5</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;