import React from 'react';

const ReportCard = ({ report, onStatusUpdate, isAdmin = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Open': { class: 'status-open', label: 'Open' },
      'Acknowledged': { class: 'status-acknowledged', label: 'Acknowledged' },
      'In Progress': { class: 'status-in-progress', label: 'In Progress' },
      'Resolved': { class: 'status-resolved', label: 'Resolved' }
      // Removed 'Closed' since your backend doesn't have it
    };
    
    const config = statusConfig[status] || statusConfig['Open'];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'Low': { class: 'priority-low', label: 'Low' },
      'Medium': { class: 'priority-medium', label: 'Medium' },
      'High': { class: 'priority-high', label: 'High' },
      'Critical': { class: 'priority-urgent', label: 'Critical' }
    };
    
    const config = priorityConfig[priority] || priorityConfig['Medium'];
    return <span className={`priority-badge ${config.class}`}>{config.label}</span>;
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(report._id, newStatus);
    }
  };

  return (
    <div className="report-card">
      <div className="report-header">
        <div className="report-title-section">
          <h3 className="report-title">{report.title}</h3>
          <div className="report-meta">
            {getStatusBadge(report.status)}
            {getPriorityBadge(report.priority)}
            <span className="report-category">{report.category}</span>
          </div>
        </div>
        <div className="report-date">
          {formatDate(report.createdAt)}
        </div>
      </div>

      <div className="report-content">
        <p className="report-description">{report.description}</p>
        
        {report.location && report.location.address && (
          <div className="report-location">
            <strong>📍 Location:</strong> {report.location.address}
            {report.location.coordinates && (
              <span className="coordinates">
                ({report.location.coordinates.latitude?.toFixed(4)}, {report.location.coordinates.longitude?.toFixed(4)})
              </span>
            )}
          </div>
        )}

        {report.images && report.images.length > 0 && (
          <div className="report-images">
            <strong>📸 Images ({report.images.length}):</strong>
            <div className="image-grid">
              {report.images.map((image, index) => (
                <img 
                  key={index}
                  src={image.url} // Your backend uses { url, publicId } structure
                  alt={`Report image ${index + 1}`}
                  className="report-image"
                  title={`Uploaded: ${new Date(image.uploadedAt).toLocaleDateString()}`}
                />
              ))}
            </div>
          </div>
        )}

        {report.tags && report.tags.length > 0 && (
          <div className="report-tags">
            <strong>🏷️ Tags:</strong>
            <div className="tags-list">
              {report.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAdmin && onStatusUpdate && (
        <div className="report-actions">
          <label>Update Status:</label>
          <div className="status-buttons">
            {['Open', 'Acknowledged', 'In Progress', 'Resolved'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={report.status === status}
                className={`status-btn ${report.status === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="report-footer">
        <div className="report-footer-left">
          <span className="report-id">ID: {report._id?.substring(0, 8)}...</span>
          {report.createdBy && (
            <span className="created-by">
              By: {report.createdBy.username || report.createdBy.email}
            </span>
          )}
        </div>
        
        <div className="report-footer-right">
          {report.assignedTo && (
            <span className="assigned-to">
              👤 {report.assignedTo.username || 'Admin'}
            </span>
          )}
          <span className="report-updated">
            Updated: {formatDate(report.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;