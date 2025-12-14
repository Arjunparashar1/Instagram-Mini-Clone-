/**
 * Authentication Context for managing user authentication state.
 * Provides auth state and methods to all components via React Context API.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Verify token is not expired
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token expired - clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      // Store token and user in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check if the server is running.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed',
      };
    }
  };

  // Signup function
  const signup = async (username, email, password) => {
    try {
      const response = await authAPI.signup({ username, email, password });
      
      // Signup successful - do NOT store token or user data
      // User must login separately to get authenticated
      // Clear any existing auth state to prevent accidental auto-login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      
      return { success: true, message: response.data.message || 'Account created successfully' };
    } catch (error) {
      console.error('Signup error:', error);
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check if the server is running.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Signup failed',
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update user data (e.g., after profile update)
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

