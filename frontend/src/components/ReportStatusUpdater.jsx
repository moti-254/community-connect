import React, { useState } from 'react';
import useReportUpdate from '../hooks/useReportUpdate';
import './ReportStatusUpdater.css';

const ReportStatusUpdater = ({ report, onUpdate, isAdmin = false }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    status: report.status,
    priority: report.priority,
    assignedTo: report.assignedTo?._id || ''
  });

  const { updateReport, loading, error, notifications, clearError } = useReportUpdate();

  const statusOptions = [
    { value: 'Open', label: '🟡 Open', color: '#f59e0b' },
    { value: 'Acknowledged', label: '🔵 Acknowledged', color: '#3b82f6' },
    { value: 'In Progress', label: '🟠 In Progress', color: '#f97316' },
    { value: 'Resolved', label: '🟢 Resolved', color: '#10b981' }
  ];

  const priorityOptions = [
    { value: 'Low', label: '🟢 Low', color: '#10b981' },
    { value: 'Medium', label: '🟡 Medium', color: '#f59e0b' },
    { value: 'High', label: '🟠 High', color: '#f97316' },
    { value: 'Critical', label: '🔴 Critical', color: '#ef4444' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await updateReport(report._id, formData);
      
      if (result.success) {
        setShowUpdateForm(false);
        if (onUpdate) {
          onUpdate(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  const handleQuickStatusUpdate = async (newStatus) => {
    try {
      const result = await updateReport(report._id, { status: newStatus });
      
      if (result.success && onUpdate) {
        onUpdate(result.data);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="status-viewer">
        <h4>Current Status</h4>
        <div className={`status-badge status-${report.status.toLowerCase().replace(' ', '-')}`}>
          {report.status}
        </div>
        <p className="status-help">
          Only administrators can update report status
        </p>
      </div>
    );
  }

  return (
    <div className="report-status-updater">
      <div className="updater-header">
        <h3>📋 Report Management</h3>
        <button
          onClick={() => setShowUpdateForm(!showUpdateForm)}
          className="toggle-btn"
        >
          {showUpdateForm ? '✕ Close' : '✏️ Update Report'}
        </button>
      </div>

      {/* Quick Status Actions */}
      <div className="quick-actions">
        <h4>Quick Status Update</h4>
        <div className="status-buttons">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleQuickStatusUpdate(option.value)}
              disabled={loading || report.status === option.value}
              className={`quick-status-btn ${report.status === option.value ? 'active' : ''}`}
              style={{ borderLeftColor: option.color }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Update Form */}
      {showUpdateForm && (
        <form onSubmit={handleSubmit} className="update-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {notifications && (
            <div className="notification-alert">
              <h4>📬 Notifications Sent</h4>
              {notifications.statusChanged && (
                <p>✅ Status update email sent to reporter</p>
              )}
              {notifications.assignedChanged && (
                <p>✅ Assignment notification sent</p>
              )}
              {notifications.priorityChanged && (
                <p>✅ Priority change recorded</p>
              )}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="status-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="priority-select"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assignedTo">Assign To</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {/* You would map through your admin users here */}
                <option value="admin-user-id">Admin User</option>
              </select>
            </div>
          </div>

          {/* Email Notification Preview */}
          <div className="email-preview">
            <h4>📧 Email Notification Preview</h4>
            <div className="preview-content">
              <p><strong>To:</strong> {report.createdBy?.email}</p>
              <p><strong>Subject:</strong> Report Update: {report.title}</p>
              <p><strong>Message:</strong> Status changed from {report.status} to {formData.status}</p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowUpdateForm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Updating...' : 'Update Report & Send Notifications'}
            </button>
          </div>
        </form>
      )}

      {/* Current Status Display */}
      <div className="current-status">
        <h4>Current Status</h4>
        <div className="status-display">
          <div className="status-item">
            <span className="label">Status:</span>
            <span className={`value status-${report.status.toLowerCase().replace(' ', '-')}`}>
              {report.status}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Priority:</span>
            <span className={`value priority-${report.priority.toLowerCase()}`}>
              {report.priority}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Assigned To:</span>
            <span className="value">
              {report.assignedTo?.username || 'Unassigned'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportStatusUpdater;