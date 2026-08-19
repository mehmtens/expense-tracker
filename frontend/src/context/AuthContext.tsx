import React, { createContext, useContext, useState } from 'react';
import { type RegisterResponse, type User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<RegisterResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readInitialAuth(): { token: string | null; user: User | null } {
  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get('oauth_token'), encodedUser = params.get('oauth_user');
  if (oauthToken && encodedUser) {
    try {
      const decoded = encodedUser.replace(/-/g, '+').replace(/_/g, '/');
      const oauthUser = JSON.parse(decodeURIComponent(escape(atob(decoded)))) as User;
      localStorage.setItem('token', oauthToken); localStorage.setItem('user', JSON.stringify(oauthUser));
      window.history.replaceState({}, '', window.location.pathname);
      return { token: oauthToken, user: oauthUser };
    } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); }
  }
  const token = localStorage.getItem('token'), savedUser = localStorage.getItem('user');
  try { return { token, user: savedUser ? JSON.parse(savedUser) as User : null }; }
  catch { return { token: null, user: null }; }
}

const initialAuth = readInitialAuth();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [user, setUser] = useState<User | null>(initialAuth.user);
  const isLoading = false;

  const login = async (identifier: string, pass: string) => {
    const data = await api.login(identifier, pass);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, pass: string) => {
    return api.register(username, email, pass);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
