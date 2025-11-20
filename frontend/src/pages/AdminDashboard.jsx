import React from 'react';
import { useAPI } from '../services/api';
import AdminPanel from '../components/AdminPanel';


const AdminDashboard = () => {
  const { api, user ,loading } = useAPI();

  if (loading) return <p>Loading user...</p>;



  // ⭐ FIXED: Check the actual user role from the backend
  const isAdmin = user?.role === 'admin';

  console.log('🔐 Admin Check Debug:', {
    user: user,
    userRole: user?.role,
    isAdmin: isAdmin,
    userId: api.getUserId()
  });

  const handleReportUpdate = (updatedReport) => {
    console.log('Report updated in AdminDashboard:', updatedReport);
    // You can add global state updates or notifications here
  };

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="message error">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <p>Current user ID: {api.getUserId()}</p>
          <p>Required: Admin role or specific test user ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the Community Connect Admin Dashboard</p>
        <div className="admin-welcome">
          <p>You can manage all community reports and send email notifications to users.</p>
        </div>
      </div>

      {/* Admin Panel Component */}
      <AdminPanel 
        onReportUpdate={handleReportUpdate}
        showHeader={false} // Since we already have a header
      />
    </div>
  );
};

export default AdminDashboard;