import React from 'react';
import ReportForm from '../components/ReportForm';

const SubmitReport = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Submit New Report</h1>
        <p>Report an issue in your community and help make it a better place</p>
      </div>
      
      <div className="content">
        <ReportForm />
      </div>

      {/* Help Section */}
      <div className="help-section">
        <div className="card">
          <h3>📋 Reporting Guidelines</h3>
          <div className="guidelines-grid">
            <div className="guideline-item">
              <h4>📍 Be Specific with Location</h4>
              <p>Provide clear location details or use the "Use Current Location" button for accurate positioning.</p>
            </div>
            <div className="guideline-item">
              <h4>📸 Add Clear Photos</h4>
              <p>Upload photos that clearly show the issue from different angles if possible.</p>
            </div>
            <div className="guideline-item">
              <h4>📝 Detailed Description</h4>
              <p>Describe the issue thoroughly so authorities can understand the problem clearly.</p>
            </div>
            <div className="guideline-item">
              <h4>🎯 Choose Correct Category</h4>
              <p>Select the most appropriate category to help route your report to the right team.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>❓ What Happens Next?</h3>
          <div className="process-steps">
            <div className="process-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Report Submitted</h4>
                <p>Your report is received and assigned a tracking ID</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Under Review</h4>
                <p>Community administrators review your report</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Action Taken</h4>
                <p>Appropriate measures are taken to resolve the issue</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Status Updates</h4>
                <p>You'll receive updates on your report's progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitReport;