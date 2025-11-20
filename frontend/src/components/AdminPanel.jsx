import React, { useState, useEffect } from 'react';
import { useAPI } from '../services/api';
import ReportStatusUpdater from './ReportStatusUpdater';
import './AdminPanel.css';

const AdminPanel = ({ onReportUpdate, showHeader = true }) => {
  const { api } = useAPI();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const result = await api.getAllReports();
      const reports = result.data || result.reports || [];
      
      if (result.success) {
        setReports(reports);
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      setError('Error loading reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpdate = (updatedReport) => {
    // Update the report in the list
    setReports(prev => 
      prev.map(report => 
        report._id === updatedReport._id ? updatedReport : report
      )
    );
    setSelectedReport(null);
    
    // Show success message
    setUpdateSuccess(`Report updated! Email sent to ${updatedReport.createdBy?.email}`);
    setTimeout(() => setUpdateSuccess(''), 5000);
    
    // Notify parent component
    if (onReportUpdate) {
      onReportUpdate(updatedReport);
    }
  };

  const handleQuickStatusUpdate = async (reportId, newStatus) => {
    try {
      const result = await api.updateReportStatus(reportId, newStatus);
      if (result.success) {
        setReports(reports.map(report => 
          report._id === reportId 
            ? { ...report, status: newStatus }
            : report
        ));
        
        setUpdateSuccess(`Status updated to ${newStatus}! Email notification sent.`);
        setTimeout(() => setUpdateSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update status');
    }
  };

  // Filter reports based on selection
  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats calculation
  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === 'Open').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    acknowledged: reports.filter(r => r.status === 'Acknowledged').length
  };

  if (loading) {
    return (
      <div className="admin-panel-loading">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel-component">
      {/* Header */}
      {showHeader && (
        <div className="admin-panel-header">
          <h2>Report Management</h2>
          <p>Manage community reports and send email notifications</p>
        </div>
      )}

      {/* Success Message */}
      {updateSuccess && (
        <div className="message success">
          ✅ {updateSuccess}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="message error">{error}</div>
      )}

      {/* Quick Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#f59e0b'}}>{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#3b82f6'}}>{stats.acknowledged}</div>
          <div className="stat-label">Acknowledged</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#f97316'}}>{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#10b981'}}>{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-controls">
        <div className="filters">
          <input
            type="text"
            placeholder="🔍 Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reports</option>
            <option value="Open">Open</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <button onClick={fetchAllReports} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {filteredReports.map(report => (
          <div key={report._id} className="admin-report-card">
            <div className="card-header">
              <h3>{report.title}</h3>
              <div className="status-indicators">
                <span className={`status-badge status-${report.status.toLowerCase().replace(' ', '-')}`}>
                  {report.status}
                </span>
                <span className={`priority-badge priority-${report.priority.toLowerCase()}`}>
                  {report.priority}
                </span>
              </div>
            </div>

            <p className="report-description">{report.description}</p>

            <div className="report-details">
              <div className="detail-item">
                <strong>Category:</strong> {report.category}
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {report.location?.address}
              </div>
              <div className="detail-item">
                <strong>Submitted by:</strong> {report.createdBy?.username} ({report.createdBy?.email})
              </div>
              <div className="detail-item">
                <strong>Submitted:</strong> {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="quick-status-buttons">
                <button
                  onClick={() => handleQuickStatusUpdate(report._id, 'Acknowledged')}
                  disabled={report.status === 'Acknowledged'}
                  className="status-btn acknowledged"
                >
                  ✓ Acknowledge
                </button>
                <button
                  onClick={() => handleQuickStatusUpdate(report._id, 'In Progress')}
                  disabled={report.status === 'In Progress'}
                  className="status-btn in-progress"
                >
                  🔄 Progress
                </button>
                <button
                  onClick={() => handleQuickStatusUpdate(report._id, 'Resolved')}
                  disabled={report.status === 'Resolved'}
                  className="status-btn resolved"
                >
                  ✅ Resolve
                </button>
              </div>

              <button
                onClick={() => setSelectedReport(
                  selectedReport?._id === report._id ? null : report
                )}
                className="manage-btn"
              >
                {selectedReport?._id === report._id ? 'Close' : '📧 Manage'}
              </button>
            </div>

            {/* Report Status Updater */}
            {selectedReport?._id === report._id && (
              <div className="updater-section">
                <ReportStatusUpdater
                  report={report}
                  onUpdate={handleReportUpdate}
                  isAdmin={true}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && !loading && (
        <div className="empty-state">
          <p>No reports found matching your criteria.</p>
          <button onClick={() => { setFilter('all'); setSearchTerm(''); }} className="btn-primary">
            Show All Reports
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;