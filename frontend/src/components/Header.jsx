import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useAPI } from '../services/api';

const Header = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { api } = useAPI();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching user data...');
        
        if (clerkUser) {
          console.log('👤 Clerk user detected:', clerkUser.primaryEmailAddress?.emailAddress);
          
          // Step 1: Sync Clerk user with backend
          console.log('🔄 Syncing user with backend...');
          const syncResult = await api.syncUser(clerkUser);
          
          if (syncResult.success) {
            console.log('✅ User sync successful');
          } else {
            console.log('⚠️ User sync had issues:', syncResult.error);
          }
        }
        
        // Step 2: Get user profile from backend
        console.log('📡 Fetching user profile from backend...');
        const profileResult = await api.getCurrentUser();
        
        if (profileResult.success) {
          console.log('✅ User profile loaded:', profileResult.data);
          setUserData(profileResult.data);
        } else {
          console.log('❌ Failed to load user profile:', profileResult.message);
          // Fallback to hardcoded admin ID check
          if (api.getUserId() === '6911cc4078f623cddb4dd38d') {
            console.log('🔄 Using fallback admin detection');
            setUserData({ 
              role: 'admin', 
              email: 'admin@community.com',
              name: 'Community Admin'
            });
          }
        }
      } catch (error) {
        console.error('❌ Error in fetchUserData:', error);
        // Final fallback
        if (api.getUserId() === '6911cc4078f623cddb4dd38d') {
          setUserData({ 
            role: 'admin', 
            email: 'admin@community.com',
            name: 'Community Admin'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (clerkLoaded) {
      if (clerkUser) {
        fetchUserData();
      } else {
        // No user logged in, stop loading
        setLoading(false);
      }
    }
  }, [clerkUser, clerkLoaded, api]);

  const isAdmin = userData?.role === 'admin';

  const getUserDisplayName = () => {
    // Priority 1: Backend user data name
    if (userData?.name) return userData.name;
    
    // Priority 2: Clerk user full name
    if (clerkUser?.firstName && clerkUser?.lastName) {
      return `${clerkUser.firstName} ${clerkUser.lastName}`;
    }
    
    // Priority 3: Clerk username
    if (clerkUser?.username) return clerkUser.username;
    
    // Priority 4: Clerk email
    if (clerkUser?.primaryEmailAddress?.emailAddress) {
      return clerkUser.primaryEmailAddress.emailAddress;
    }
    
    // Final fallback
    return 'User';
  };

  const getUserEmail = () => {
    return userData?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
  };

  if (!clerkLoaded || loading) {
    return (
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🏙️ Community Connect
          </Link>
        </div>
        <div className="nav-user">
          <span className="loading-text">Loading...</span>
        </div>
      </header>
    );
  }

  if (!clerkUser) {
    // This shouldn't happen due to Clerk's SignedIn wrapper, but just in case
    return (
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🏙️ Community Connect
          </Link>
        </div>
        <div className="nav-user">
          <span>Please sign in</span>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          🏙️ Community Connect
        </Link>
      </div>
      
      <nav className="nav-links">
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
        >
          Dashboard
        </Link>
        <Link 
          to="/submit" 
          className={location.pathname === '/submit' ? 'nav-link active' : 'nav-link'}
        >
          Submit Report
        </Link>
        {isAdmin && (
          <Link 
            to="/admin" 
            className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
          >
            Admin Panel
          </Link>
        )}
      </nav>
      
      <div className="nav-user">
        <div className="user-info">
          <span className="user-name">{getUserDisplayName()}</span>
          <div className="user-details">
            <span className="user-email">{getUserEmail()}</span>
            <span className="user-role">{isAdmin ? '👑 Admin' : '👤 Resident'}</span>
          </div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Header;