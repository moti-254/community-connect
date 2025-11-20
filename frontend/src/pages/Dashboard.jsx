import React, { useState, useEffect } from 'react';
import { useAPI } from '../services/api';
import ReportCard from '../components/ReportCard';
import ReportStatusUpdater from '../components/ReportStatusUpdater';

const Dashboard = () => {
  const { api, user } = useAPI();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const result = isAdmin ? await api.getAllReports() : await api.getMyReports();
      
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

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const result = await api.updateReportStatus(reportId, newStatus);
      if (result.success) {
        // Update local state
        setReports(reports.map(report => 
          report._id === reportId 
            ? { ...report, status: newStatus }
            : report
        ));
        
        // Show success message
        setUpdateSuccess(`Status updated to ${newStatus}! Email notification sent.`);
        setTimeout(() => setUpdateSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleReportUpdate = (updatedReport) => {
    // Update the report in the local state
    setReports(prev => 
      prev.map(report => 
        report._id === updatedReport._id ? updatedReport : report
      )
    );
    setSelectedReport(null);
    
    // Show success message
    setUpdateSuccess('Report updated successfully! Email notification sent.');
    setTimeout(() => setUpdateSuccess(''), 3000);
    
    // Refresh the reports list to ensure we have the latest data
    setTimeout(() => fetchReports(), 1000);
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
        
        setUpdateSuccess(`Status updated to ${newStatus}! Email sent to reporter.`);
        setTimeout(() => setUpdateSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

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
      <div className="page-container">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Community Reports</h1>
        <p>
          {isAdmin 
            ? 'Manage all community reports and send email notifications' 
            : 'View and track your submitted reports'
          }
        </p>
      </div>

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

      {/* Admin Stats Dashboard */}
      {isAdmin && reports.length > 0 && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Reports</div>
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
      )}

      <div className="content">
        {reports.length === 0 ? (
          <div className="card">
            <h3>No reports found</h3>
            <p>
              {isAdmin 
                ? 'No community reports have been submitted yet.' 
                : 'You haven\'t submitted any reports yet. Submit your first report to get started!'
              }
            </p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report._id} className="report-item">
                <ReportCard
                  report={report}
                  onStatusUpdate={isAdmin ? handleStatusUpdate : null}
                  isAdmin={isAdmin}
                />
                
                {/* Admin Quick Actions */}
                {isAdmin && (
                  <div className="admin-quick-actions">
                    <div className="quick-status-buttons">
                      <button
                        onClick={() => handleQuickStatusUpdate(report._id, 'Acknowledged')}
                        disabled={report.status === 'Acknowledged'}
                        className="status-btn acknowledged"
                        title="Acknowledge and notify reporter"
                      >
                        ✓ Ack
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(report._id, 'In Progress')}
                        disabled={report.status === 'In Progress'}
                        className="status-btn in-progress"
                        title="Mark in progress and notify reporter"
                      >
                        🔄 Progress
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(report._id, 'Resolved')}
                        disabled={report.status === 'Resolved'}
                        className="status-btn resolved"
                        title="Resolve and notify reporter"
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
                      {selectedReport?._id === report._id ? 'Close Manager' : '📧 Manage & Notify'}
                    </button>
                  </div>
                )}

                {/* Report Status Updater */}
                {isAdmin && selectedReport?._id === report._id && (
                  <div className="status-updater-section">
                    <ReportStatusUpdater
                      report={report}
                      onUpdate={handleReportUpdate}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;