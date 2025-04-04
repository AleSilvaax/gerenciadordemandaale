
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTeamMembers } from '@/services/api';
import { TeamMember } from '@/types/serviceTypes';
import { toast } from 'sonner';

type UserRole = 'tecnico' | 'administrador' | 'gestor';

interface AuthContextType {
  user: TeamMember | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permissionId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  // Load permissions from localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(parsedPermissions.reduce((acc: Record<string, string[]>, p: any) => {
          acc[p.id] = p.roles;
          return acc;
        }, {}));
      } catch (error) {
        console.error('Failed to parse permissions from localStorage:', error);
      }
    }

    // Check for saved login session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In a real app, we'd make an API call to verify credentials
      // For this demo, we'll just check if the email matches one of our team members
      // and use a simple password check (in real apps, never store passwords in frontend code)
      
      const teamMembers = await getTeamMembers();
      const foundMember = teamMembers.find(member => 
        member.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (foundMember && password === '123456') { // Simple password for demo
        setUser(foundMember);
        localStorage.setItem('currentUser', JSON.stringify(foundMember));
        toast.success(`Bem-vindo, ${foundMember.name}!`);
        return true;
      } else {
        toast.error('Email ou senha inválidos');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    toast.info('Sessão encerrada');
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!user || !user.role) return false;
    
    // If permissions aren't loaded yet or permission doesn't exist, deny access
    if (!permissions || !permissions[permissionId]) return false;
    
    // Check if user's role has this permission
    return permissions[permissionId].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
