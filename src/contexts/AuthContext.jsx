import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      const savedVerification = sessionStorage.getItem('isVerified');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const userData = await api.auth.getCurrentUser();
          setUser(userData);
          if (savedVerification === 'true') {
            setIsVerified(true);
          }
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('isVerified');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.auth.login(username, password);

      if (response.success && response.token) {
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Reset verification on new login
        setIsVerified(false);
        sessionStorage.removeItem('isVerified');

        setUser({
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
        });

        return { success: true };
      }

      return { success: false, error: 'AUTHENTICATION_FAILED' };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error?.response?.data?.error || 'AUTHENTICATION_FAILED';
      return {
        success: false,
        error: errorMsg
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('isVerified');
      setUser(null);
      setIsVerified(false);
    }
  }, []);

  const verify = useCallback(() => {
    setIsVerified(true);
    sessionStorage.setItem('isVerified', 'true');
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isVerified, login, logout, verify }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
