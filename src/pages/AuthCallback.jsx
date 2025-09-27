import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login, setToken, setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (token) {
          // Set token and get user data using AuthContext
          setToken(token);
          localStorage.setItem('token', token);
          
          // Verify token and get user data
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
              // Redirect to dashboard
              navigate('/my-skills');
              return;
            }
          }
        }

        // If no token or verification failed, redirect to login
        navigate('/login?error=auth_failed');
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-container">
        <div className="loading-spinner"></div>
        <h2>Completing authentication...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
