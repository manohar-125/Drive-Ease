import React from 'react';
import './ConfirmationModal.css';

/*
  Props:
    isOpen: boolean
    onClose: function
    type: one of 'registration' | 'payment' | 'colorTest' | 'roadTestBooking' | 'verification' | 'evaluation' | 'evaluationResult'
    data: object containing fields relevant to each type
*/

const ConfirmationModal = ({ isOpen, onClose, type, data }) => {
  if (!isOpen) return null;

  const LICENSE_TYPE_MAP = {
    'Two Cum Four Wheeler': 'Two & Four Wheeler',
    'Two Wheeler': 'Two Wheeler',
    'Four Wheeler': 'Four Wheeler',
    'Light Motor Vehicle': 'Light Motor Vehicle',
    'Heavy Vehicle': 'Heavy Vehicle'
  };

  const formatLicenseType = (raw) => {
    if (!raw) return 'Not specified';
    return LICENSE_TYPE_MAP[raw] || raw;
  };

  const getContent = () => {
    switch (type) {
      case 'registration':
        return {
          title: 'Registration Successful!',
          message: 'Your application has been registered successfully.',
          icon: '✓',
          success: true,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Full Name', value: data?.fullName },
            { label: 'DigiLocker ID', value: data?.digilockerId },
            { label: 'Email', value: data?.email },
            { label: 'Phone', value: data?.phone }
          ]
        };
      case 'payment':
        return {
          title: 'Booking & Payment Successful!',
          message: 'Your test slots have been booked.',
          icon: '✓',
            success: true,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Color Test Date', value: data?.colorTestDate },
            { label: 'Learner Test Date', value: data?.learnerTestDate },
            { label: 'Payment Reference', value: data?.paymentReference },
            { label: 'Amount Paid', value: data?.amountPaid },
            { label: 'License Type', value: formatLicenseType(data?.applicationType || data?.licenseType) }
          ]
        };
      case 'colorTest':
        return {
          title: 'Color Vision Test Passed!',
          message: 'Great job! You successfully passed the color vision test.',
          icon: '✓',
          success: true,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Test Date', value: data?.testDate }
          ]
        };
      case 'roadTestBooking':
        return {
          title: 'Road Test Booking Confirmed!',
          message: 'Your road test booking has been submitted.',
          icon: '✓',
          success: true,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Road Test Date', value: data?.roadTestDate },
            { label: 'Road Test Slot', value: data?.roadTestSlot },
            { label: 'License Type', value: formatLicenseType(data?.applicationType) }
          ]
        };
      case 'verification':
        return {
          title: 'Candidate Verified!',
          message: 'Verification completed successfully.',
          icon: '✓',
          success: true,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Full Name', value: data?.fullName },
            { label: 'Verified At', value: data?.verifiedAt }
          ]
        };
      case 'evaluation':
        return {
          title: data?.passed ? 'Evaluation Submitted - PASSED' : 'Evaluation Submitted - FAILED',
          message: data?.passed ? 'Congratulations! Candidate passed the road test.' : 'Candidate did not meet passing criteria.',
          icon: data?.passed ? '🎉' : '😔',
          success: !!data?.passed,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Full Name', value: data?.fullName },
            { label: 'Score', value: `${data?.score}/${data?.maxScore}` },
            { label: 'Percentage', value: `${data?.percentage}%` },
            { label: 'Result', value: data?.passed ? 'PASSED' : 'FAILED' }
          ]
        };
      case 'evaluationResult':
        return {
          title: data?.passed ? 'Road Test Result: PASSED' : 'Road Test Result: FAILED',
          message: data?.passed ? 'You have successfully passed your road test.' : 'Unfortunately, you did not pass. Please practice and try again.',
          icon: data?.passed ? '🎉' : '😔',
          success: !!data?.passed,
          details: [
            { label: 'Application Number', value: data?.applicationNumber },
            { label: 'Test Date', value: data?.testDate },
            { label: 'Score', value: `${data?.score}/50` },
            { label: 'Percentage', value: `${data?.percentage}%` },
            { label: 'Result', value: data?.passed ? 'PASSED' : 'FAILED' }
          ]
        };
      default:
        return {
          title: 'Action Completed',
          message: 'The requested operation finished successfully.',
          icon: '✓',
          success: true,
          details: []
        };
    }
  };

  const { title, message, icon, success, details } = getContent();

  return (
    <div className="confirmation-modal-overlay" role="dialog" aria-modal="true">
      <div className="confirmation-modal-container">
        <div className="confirmation-icon-wrapper">
          <div className={`confirmation-icon ${success ? 'success' : 'failed'}`} aria-label={success ? 'Success' : 'Failed'}>{icon}</div>
        </div>
        <h2 className="confirmation-title">{title}</h2>
        <div className="confirmation-message-box">{message}</div>
        {details && details.length > 0 && (
          <div className="confirmation-details">
            {details.map((item, idx) => (
              <div className="detail-row" key={idx}>
                <span className="detail-label">{item.label}</span>
                <span className="detail-value">{item.value || 'N/A'}</span>
              </div>
            ))}
          </div>
        )}
        <button className="confirmation-close-btn" onClick={onClose}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
