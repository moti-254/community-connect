import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

class API {
  constructor() {
    this.userId = localStorage.getItem('userId');
  }

  // Get current user ID dynamically
  getUserId() {
    // Try multiple sources to get user ID
    return localStorage.getItem('userId') || 
           window.Clerk?.user?.id || 
           '6912f3e43aa008e9405e7f08'; // Your current user ID
  }

  // Generic request method

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.userId && { 'x-user-id': this.userId })
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
      if (config.body) {
        console.log('📦 Request body:', config.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      console.log(`✅ API Success: ${config.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // Sync Clerk user with our backend
  async syncUser(clerkUser) {
    try {
      console.log('🔄 Starting user sync with backend...');
      
      const userData = {
        clerkUserId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        username: clerkUser.username || clerkUser.firstName,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
      };

      console.log('📦 Clerk user data for sync:', userData);

      const result = await this.request('/auth/sync', {
        method: 'POST',
        body: userData
      });

      if (result.success && result.data) {
        console.log('✅ User sync successful, setting user ID:', result.data._id);
        this.setUserId(result.data._id);
        localStorage.setItem('user', JSON.stringify(result.data));
        return result;
      } else {
        console.log('⚠️ User sync response indicates failure:', result);
        return result;
      }
      
    } catch (error) {
      console.error('❌ Primary sync failed, trying fallback...', error);
      
      // Fallback to old endpoint for backward compatibility
      try {
        console.log('🔄 Attempting fallback sync...');
        const fallbackResult = await this.request('/auth/sync-user', {
          method: 'POST',
          body: {
            clerkUserId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            username: clerkUser.username || clerkUser.firstName
          }
        });
        
        if (fallbackResult.success && fallbackResult.data) {
          console.log('✅ Fallback sync successful');
          this.setUserId(fallbackResult.data.id);
          localStorage.setItem('user', JSON.stringify(fallbackResult.data));
        } else {
          console.log('⚠️ Fallback sync response indicates failure:', fallbackResult);
        }
        
        return fallbackResult;
      } catch (fallbackError) {
        console.error('❌ Fallback sync also failed:', fallbackError);
        return { 
          success: false, 
          error: error.message,
          fallbackError: fallbackError.message 
        };
      }
    }
  }

  // Get current user profile from backend
  async getCurrentUser() {
    try {
      console.log('📡 Fetching current user profile...');
      const result = await this.request('/auth/me');
      
      if (result.success) {
        console.log('✅ User profile loaded successfully');
      } else {
        console.log('⚠️ User profile load indicates failure:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // In your api.js file, replace the getMyReports function:
    async getMyReports(page = 1, limit = 20) {
    try {
        console.log('📋 Fetching user reports...');
        // Use the main reports endpoint - it automatically filters by user
        const result = await this.request(`/reports?page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
        console.log(`✅ Loaded ${result.data?.length || 0} reports`);
        return result;
    } catch (error) {
        console.error('❌ Failed to fetch reports:', error);
        throw error;
    }
    }

  async getAllReports() {
    try {
      console.log('📋 Fetching all reports (admin)...');
      const result = await this.request('/admin/reports');
      console.log(`✅ Loaded ${result.data?.length || 0} reports`);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch all reports:', error);
      throw error;
    }
  }

  async createReport(reportData) {
    try {
      console.log('📝 Creating new report...', reportData);
      
      // Handle FormData for file uploads
      if (reportData instanceof FormData) {
        const url = `${API_BASE}/reports`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'x-user-id': this.userId
            // Don't set Content-Type for FormData
          },
          body: reportData
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Request failed');
        }

        console.log('✅ Report created successfully');
        return data;
      } else {
        // Regular JSON request
        const result = await this.request('/reports', {
          method: 'POST',
          body: reportData
        });
        console.log('✅ Report created successfully');
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to create report:', error);
      throw error;
    }
  }

  async updateReportStatus(reportId, status) {
    try {
      console.log(`🔄 Updating report ${reportId} status to: ${status}`);
      const result = await this.request(`/reports/${reportId}`, {
        method: 'PUT',
        body: { status }
      });
      console.log('✅ Report status updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to update report status:', error);
      throw error;
    }
  }

  // Admin endpoints
  async getAllUsers() {
    try {
      console.log('👥 Fetching all users...');
      const result = await this.request('/auth/users');
      console.log(`✅ Loaded ${result.data?.length || 0} users`);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      throw error;
    }
  }

  async promoteUser(userId) {
    try {
      console.log(`👑 Promoting user ${userId} to admin...`);
      const result = await this.request(`/auth/promote/${userId}`, {
        method: 'PATCH'
      });
      console.log('✅ User promoted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to promote user:', error);
      throw error;
    }
  }

  async demoteUser(userId) {
    try {
      console.log(`👤 Demoting user ${userId} to resident...`);
      const result = await this.request(`/auth/demote/${userId}`, {
        method: 'PATCH'
      });
      console.log('✅ User demoted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to demote user:', error);
      throw error;
    }
  }

  async toggleUserActive(userId) {
    try {
      console.log(`🔘 Toggling active status for user ${userId}...`);
      const result = await this.request(`/auth/users/${userId}/toggle-active`, {
        method: 'PATCH'
      });
      console.log('✅ User status toggled successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to toggle user status:', error);
      throw error;
    }
  }

  // Utility methods
  setUserId(userId) {
    this.userId = userId;
    if (userId) {
      localStorage.setItem('userId', userId);
      console.log('🔐 User ID set in storage:', userId);
    } else {
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      console.log('🔐 User data cleared from storage');
    }
  }

  getUserId() {
    return this.userId;
  }

  logout() {
    console.log('🚪 Logging out user...');
    this.setUserId(null);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.userId;
  }

  // Get stored user data
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      return null;
    }
  }
}

export const api = new API();

export const useAPI = () => {
  const { user: clerkUser } = useUser();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!clerkUser) {
        setBackendUser(null);
        setLoading(false);
        return;
      }

      try {
        // 🔄 Sync Clerk user with backend if needed
        await api.syncUser(clerkUser);

        // 🧩 Fetch full backend user profile
        const storedUser = api.getStoredUser();
        if (storedUser && storedUser.role) {
          console.log('✅ Loaded backend user from storage:', storedUser);
          setBackendUser(storedUser);
        } else {
          console.log('📡 Fetching backend user from API...');
          const result = await api.getCurrentUser();
          if (result.success && result.data) {
            localStorage.setItem('user', JSON.stringify(result.data));
            setBackendUser(result.data);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load backend user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [clerkUser]);

  return { api, user: backendUser, loading };
};
