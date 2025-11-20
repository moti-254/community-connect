import { useState } from 'react';
import axios from 'axios';

const useReportUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState(null);

  const updateReport = async (reportId, updateData, options = {}) => {
    setLoading(true);
    setError(null);
    setNotifications(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await axios.put(
        `/api/reports/${reportId}`,
        updateData,
        {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
          }
        }
      );

      setLoading(false);
      
      // Store notification info from backend
      if (response.data.notifications) {
        setNotifications(response.data.notifications);
        
        // Auto-clear notifications after 5 seconds
        setTimeout(() => setNotifications(null), 5000);
      }

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update report');
      setLoading(false);
      throw err;
    }
  };

  return {
    updateReport,
    loading,
    error,
    notifications,
    clearError: () => setError(null),
    clearNotifications: () => setNotifications(null)
  };
};

export default useReportUpdate;