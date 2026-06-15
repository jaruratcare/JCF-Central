import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, AuthContextType, LoginCredentials } from './types';
import { supabase } from '@/utils/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('jcf_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        localStorage.setItem('jcf_auth_token', session.access_token);
        // User data is already set from login endpoint, just restore from localStorage
        const storedUser = localStorage.getItem('jcf_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } else {
        localStorage.removeItem('jcf_auth_token');
        setUser(null);
        localStorage.removeItem('jcf_user');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed. Please check your credentials.');
      }

      const { user, session } = await response.json();

      if (session?.access_token) {
        localStorage.setItem('jcf_auth_token', session.access_token);
      }

      setUser(user);
      localStorage.setItem('jcf_user', JSON.stringify(user));
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setUser(null);
      localStorage.removeItem('jcf_user');
      localStorage.removeItem('jcf_auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
