
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember } from '@/types/serviceTypes';
import { toast } from 'sonner';
import { UserRole } from '@/types/interfaces/auth';

// Extend TeamMember with additional user properties
export interface User extends TeamMember {
  email?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  updateUserInfo: (userData: User) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: User[] = [
  {
    id: "user-1",
    name: "João Silva",
    avatar: "/avatars/user-1.png",
    role: "tecnico",
    email: "joao@exemplo.com",
    phone: "(11) 98765-4321",
    permissions: ['view_services', 'update_services']
  },
  {
    id: "user-2",
    name: "Maria Oliveira",
    avatar: "/avatars/user-2.png",
    role: "administrador",
    email: "maria@exemplo.com",
    phone: "(11) 91234-5678",
    permissions: ['view_services', 'update_services', 'delete_services', 'add_members', 'view_stats']
  },
  {
    id: "user-3",
    name: "Carlos Santos",
    avatar: "/avatars/user-3.png",
    role: "gestor",
    email: "carlos@exemplo.com",
    phone: "(11) 99876-5432",
    permissions: ['view_services', 'update_services', 'view_stats']
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);
  
  // Mock login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = demoUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (foundUser && password.length >= 6) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        toast.success(`Bem-vindo, ${foundUser.name}!`);
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
  
  // Mock logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Sessão encerrada');
  };
  
  // Mock register function
  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if email is already used
      if (userData.email && demoUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase())) {
        toast.error('Este email já está em uso');
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name || 'Usuário',
        avatar: userData.avatar || '/placeholder.svg',
        role: userData.role || 'tecnico',
        email: userData.email,
        phone: userData.phone || '',
        permissions: userData.role === 'administrador' 
          ? ['view_services', 'update_services', 'delete_services', 'add_members', 'view_stats']
          : userData.role === 'gestor'
          ? ['view_services', 'update_services', 'view_stats']
          : ['view_services', 'update_services']
      };
      
      // Add to demo users and log in
      demoUsers.push(newUser);
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast.success('Registro concluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Erro ao registrar');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user data
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { ...user, ...userData };
      
      // Update in demo users array
      const index = demoUsers.findIndex(u => u.id === user.id);
      if (index !== -1) {
        demoUsers[index] = updatedUser;
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Perfil atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Erro ao atualizar perfil');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Direct user info update (without API call)
  const updateUserInfo = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'administrador') return true;
    return user.permissions?.includes(permission) || false;
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      login,
      logout,
      register,
      updateUser,
      updateUserInfo,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
