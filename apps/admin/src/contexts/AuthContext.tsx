import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AuthUser, 
  getCurrentAuthUser, 
  checkAuthStatus, 
  logout as authLogout 
} from '../services/authService';
import { initializeAuth } from '../config/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuthAndCheckStatus();
  }, []);

  const initializeAuthAndCheckStatus = async () => {
    try {
      // Amplify/Cognitoを初期化
      const initialized = initializeAuth();
      if (!initialized) {
        console.error('認証システムの初期化に失敗しました');
        setLoading(false);
        return;
      }

      // 認証状態をチェック
      const authenticated = await checkAuthStatus();
      
      if (authenticated) {
        const currentUser = await getCurrentAuthUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (user: AuthUser) => {
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentAuthUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};