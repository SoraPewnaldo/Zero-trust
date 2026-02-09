import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, { password: string; role: UserRole; id: string }> = {
  'admin': { password: 'admin', role: 'admin', id: 'usr-001' },
  'employee': { password: 'employee', role: 'employee', id: 'usr-002' },
  'alice': { password: 'alice123', role: 'employee', id: 'usr-003' },
  'bob': { password: 'bob123', role: 'employee', id: 'usr-004' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    const record = MOCK_USERS[username.toLowerCase()];
    if (record && record.password === password) {
      setUser({ id: record.id, username: username.toLowerCase(), role: record.role });
      return { success: true };
    }
    return { success: false, error: 'AUTHENTICATION_FAILED' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
