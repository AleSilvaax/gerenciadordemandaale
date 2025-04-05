
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types/serviceTypes';

interface User extends TeamMember {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (updatedUser: User) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount, check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user');
      }
    }
    // Set loading to false after checking for user
    setIsLoading(false);
  }, []);

  // Mock users for the demo
  const mockUsers = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@exemplo.com',
      password: '123456',
      role: 'tecnico',
      avatar: '/lovable-uploads/373df2cb-1338-42cc-aebf-c1ce0a83b032.png',
      phone: '(11) 99999-1234',
    },
    {
      id: '2',
      name: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      password: '123456',
      role: 'administrador',
      avatar: '/lovable-uploads/2e312c47-0298-4854-8d13-f07ec36e7176.png',
      phone: '(11) 98888-5678',
    },
    {
      id: '3',
      name: 'Carlos Rodrigues',
      email: 'carlos@exemplo.com',
      password: '123456',
      role: 'gestor',
      avatar: '/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png',
      phone: '(11) 97777-9012',
    }
  ];
  
  // Function to check permissions based on user role
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Define role-based permissions
    const permissions = {
      tecnico: ['view_own_services', 'update_own_services'],
      administrador: ['view_own_services', 'update_own_services', 'view_stats', 'add_members'],
      gestor: ['view_own_services', 'update_own_services', 'view_stats', 'add_members', 'delete_services'],
    };
    
    // Get permissions for the user's role
    const rolePermissions = permissions[user.role as keyof typeof permissions] || [];
    
    return rolePermissions.includes(permission);
  };
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would call an API
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        toast.error('Email ou senha incorretos');
        return false;
      }
      
      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUser;
      const userToSet = userWithoutPassword as User;
      
      // Save in local state and localStorage
      setUser(userToSet);
      localStorage.setItem('user', JSON.stringify(userToSet));
      
      toast.success(`Bem-vindo, ${userToSet.name}!`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };
  
  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    try {
      // Check if email already exists
      if (mockUsers.some(u => u.email === email)) {
        toast.error('Este email já está em uso');
        return false;
      }
      
      // In a real app, this would call an API to create a new user
      // For this demo, we'll create a mock user
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        avatar: '/lovable-uploads/placeholder.svg', // Default avatar
      };
      
      // Save in local state and localStorage
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast.success('Conta criada com sucesso!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao criar conta');
      return false;
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Sessão encerrada');
  };
  
  const updateUserInfo = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUserInfo, 
      hasPermission,
      isLoading 
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
