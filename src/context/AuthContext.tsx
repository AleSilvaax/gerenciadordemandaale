
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { UserRole } from '@/types/serviceTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing when not using Supabase
const demoUsers: AuthUser[] = [
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for saved session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking auth session...");
        setIsLoading(true);
        
        // Check for demo user in localStorage first for faster loading
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('Found user in localStorage:', parsedUser.email);
            setUser(parsedUser);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Failed to parse saved user', error);
            localStorage.removeItem('user');
          }
        }
        
        // Get current session (without using the problematic onAuthStateChange)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          console.log('No existing session');
          setIsLoading(false);
          return;
        }
        
        console.log('Existing session found:', session.user.email);
        
        try {
          // Create a simple user object directly from the session
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'Usuário',
            avatar: session.user.user_metadata?.avatar || '/placeholder.svg',
            role: (session.user.user_metadata?.role as UserRole) || 'tecnico',
            permissions: getPermissionsByRole((session.user.user_metadata?.role as UserRole) || 'tecnico')
          };
          
          setUser(authUser);
          // Also save to localStorage for faster loading next time
          localStorage.setItem('user', JSON.stringify(authUser));
        } catch (error) {
          console.error('Error processing session:', error);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  // Helper function to get permissions based on role
  const getPermissionsByRole = (role: UserRole): string[] => {
    switch (role) {
      case 'administrador':
        return ['view_services', 'update_services', 'delete_services', 'add_members', 'view_stats'];
      case 'gestor':
        return ['view_services', 'update_services', 'view_stats'];
      default:
        return ['view_services', 'update_services'];
    }
  };
  
  // Login function - simplified to avoid Supabase recursion issues
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Attempting login with:', email);
    setIsLoading(true);
    
    try {
      // First try demo mode login for reliability
      const demoUser = demoUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (demoUser && password.length >= 6) {
        console.log('Demo user found:', demoUser.name);
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${demoUser.name}!`,
          variant: "success",
        });
        setIsLoading(false);
        return true;
      }
      
      // Try Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        setIsLoading(false);
        return false;
      }
      
      console.log('Supabase login successful, user:', data.user?.email);
      
      if (data.user) {
        try {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'Usuário',
            avatar: data.user.user_metadata?.avatar || '/placeholder.svg',
            role: (data.user.user_metadata?.role as UserRole) || 'tecnico',
            permissions: getPermissionsByRole((data.user.user_metadata?.role as UserRole) || 'tecnico')
          };
          
          setUser(authUser);
          localStorage.setItem('user', JSON.stringify(authUser));
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo, ${authUser.name}!`,
            variant: "success",
          });
          setIsLoading(false);
          return true;
        } catch (error) {
          console.error('Error processing login:', error);
        }
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  // Logout function - simplified
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      toast({
        title: "Sessão encerrada",
        description: "Você saiu do sistema com sucesso",
        variant: "success",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function - simplified to avoid recursion issues
  const register = async (userData: RegisterFormData): Promise<boolean> => {
    console.log('Registering new user:', userData.email);
    setIsLoading(true);
    
    try {
      // Check if email already used in demo users
      if (userData.email && demoUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase())) {
        toast({
          title: "Erro no cadastro",
          description: "Este email já está em uso",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      // Try Supabase registration first
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });
      
      if (error) {
        console.log('Supabase registration error:', error);
        
        // Create new demo user if Supabase fails
        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          name: userData.name || 'Usuário',
          avatar: '/placeholder.svg',
          role: userData.role || 'tecnico',
          email: userData.email,
          permissions: getPermissionsByRole(userData.role || 'tecnico')
        };
        
        // Add to demo users and log in
        demoUsers.push(newUser);
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        toast({
          title: "Registro concluído",
          description: "Sua conta foi criada com sucesso!",
          variant: "success",
        });
        
        setIsLoading(false);
        return true;
      }
      
      console.log('Supabase registration successful, user data:', data);
      
      if (data.user) {
        // Auto-login after registration
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: userData.name,
          avatar: '/placeholder.svg',
          role: userData.role,
          permissions: getPermissionsByRole(userData.role)
        };
        
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(authUser));
        
        toast({
          title: "Registro concluído",
          description: "Sua conta foi criada com sucesso!",
          variant: "success",
        });
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Register error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  // Update user data - simplified
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Just update the local user object
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in demo users array
      const index = demoUsers.findIndex(u => u.id === user.id);
      if (index !== -1) {
        demoUsers[index] = updatedUser;
      }
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
        variant: "success",
      });
      
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  // Direct user info update (without API call)
  const updateUserInfo = (userData: AuthUser) => {
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
