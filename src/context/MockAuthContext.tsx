import React, { createContext, useContext, ReactNode } from 'react';
import { AuthUser, AuthContextType, RegisterFormData, UserRole } from '@/types/auth';

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

interface MockAuthProviderProps {
  children: ReactNode;
}

// Mock user data
const mockUser: AuthUser = {
  id: 'mock-user-id',
  email: 'admin@exemplo.com',
  name: 'Administrador',
  avatar: '',
  role: 'administrador' as UserRole,
  permissions: [],
  team_id: 'mock-team-id',
  organization_id: 'mock-org-id',
  signature: '',
  phone: '',
};

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Mock login:', { email, password });
    return true;
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    console.log('Mock register:', userData);
    return true;
  };

  const logout = async (): Promise<void> => {
    console.log('Mock logout');
  };

  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    console.log('Mock updateUser:', userData);
    return true;
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    console.log('Mock requestPasswordReset:', email);
    return true;
  };

  const hasPermission = (permission: string): boolean => {
    // Mock admin sempre tem permissão
    return true;
  };

  const canAccessRoute = (route: string): boolean => {
    // Mock admin sempre pode acessar
    return true;
  };

  const updateUserInfo = (user: AuthUser | null) => {
    console.log('Mock updateUserInfo:', user);
  };

  const value: AuthContextType = {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login,
    logout,
    register,
    updateUser,
    updateUserInfo,
    hasPermission,
    canAccessRoute,
    requestPasswordReset,
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
};