
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
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change event:', event);
            
            if (session?.user) {
              console.log('User from session:', session.user.email);
              // Get user profile from Supabase
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (profileError) {
                console.error('Error fetching profile:', profileError);
              }
              
              // Get user role from Supabase
              const { data: userRole, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
                
              if (roleError) {
                console.error('Error fetching user role:', roleError);
              }

              if (profile) {
                console.log('Profile found:', profile);
                const authUser: AuthUser = {
                  id: session.user.id,
                  email: session.user.email,
                  name: profile.name,
                  avatar: profile.avatar || '/placeholder.svg',
                  role: userRole?.role as UserRole || 'tecnico',
                  permissions: getPermissionsByRole(userRole?.role as UserRole || 'tecnico')
                };
                
                setUser(authUser);
              } else {
                console.log('No profile found for user');
                setUser(null);
              }
            } else {
              console.log('No session user, setting user to null');
              setUser(null);
            }
          }
        );

        // THEN check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('Existing session found:', session.user.email);
          // Get user profile from Supabase
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }
          
          // Get user role from Supabase
          const { data: userRole, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          if (roleError) {
            console.error('Error fetching user role:', roleError);
          }

          if (profile) {
            console.log('Profile found:', profile);
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email,
              name: profile.name,
              avatar: profile.avatar || '/placeholder.svg',
              role: userRole?.role as UserRole || 'tecnico',
              permissions: getPermissionsByRole(userRole?.role as UserRole || 'tecnico')
            };
            
            setUser(authUser);
          } else {
            // Try to get from localStorage as fallback for demo mode
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              try {
                setUser(JSON.parse(savedUser));
              } catch (error) {
                console.error('Failed to parse saved user', error);
                localStorage.removeItem('user');
              }
            }
          }
        } else {
          console.log('No existing session');
          // Try to get from localStorage as fallback for demo mode
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              console.log('Found user in localStorage:', savedUser);
              setUser(JSON.parse(savedUser));
            } catch (error) {
              console.error('Failed to parse saved user', error);
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Return cleanup function to unsubscribe
    return () => {
      console.log('Cleanup auth provider');
      supabase.auth.onAuthStateChange(() => {});
    };
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
  
  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Attempting login with:', email);
    setIsLoading(true);
    
    try {
      // Try Supabase login first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.log('Supabase login error, details:', error);
        
        // Check if it's a "User not found" error for a Supabase account
        if (error.message.includes("Email not confirmed") || error.message.includes("Email link is invalid or has expired")) {
          toast.warning('Verifique seu email para confirmar sua conta');
          return false;
        }
        
        // Fallback to demo mode
        console.log('Trying demo mode login');
        const foundUser = demoUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (foundUser && password.length >= 6) {
          console.log('Demo user found:', foundUser.name);
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
          toast.success(`Bem-vindo, ${foundUser.name}!`);
          return true;
        } else {
          toast.error('Email ou senha inválidos');
          return false;
        }
      }
      
      console.log('Supabase login successful, user:', data.user?.email);
      
      if (data.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile after login:', profileError);
        }
        
        // Get user role
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
          
        if (roleError) {
          console.error('Error fetching role after login:', roleError);
        }

        if (profile) {
          console.log('Profile found after login:', profile);
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            name: profile.name,
            avatar: profile.avatar || '/placeholder.svg',
            role: userRole?.role as UserRole || 'tecnico',
            permissions: getPermissionsByRole(userRole?.role as UserRole || 'tecnico')
          };
          
          setUser(authUser);
          toast.success(`Bem-vindo, ${authUser.name}!`);
          return true;
        }
      }
      
      toast.error('Erro ao fazer login');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      toast.success('Sessão encerrada');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (userData: RegisterFormData): Promise<boolean> => {
    console.log('Registering new user:', userData.email);
    setIsLoading(true);
    
    try {
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
        
        // Check for common errors
        if (error.message.includes("User already registered")) {
          toast.error('Este email já está em uso');
          return false;
        }
        
        // Fallback to demo mode
        if (userData.email && demoUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase())) {
          toast.error('Este email já está em uso');
          return false;
        }
        
        // Create new demo user
        console.log('Creating demo user');
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
        
        toast.success('Registro concluído com sucesso!');
        return true;
      }
      
      console.log('Supabase registration successful, user data:', data);
      
      if (data.user) {
        console.log('Auto-logging in after registration');
        // Log the user in automatically after registration
        try {
          const loginResult = await login(userData.email, userData.password);
          if (loginResult) {
            console.log('Auto-login successful');
            toast.success('Registro concluído com sucesso!');
            return true;
          } else {
            console.log('Auto-login failed, but registration succeeded');
            toast.success('Registro concluído! Por favor, faça login.');
            return true;
          }
        } catch (loginError) {
          console.error('Error logging in after registration:', loginError);
          toast.success('Registro concluído! Por favor, verifique seu email para confirmar sua conta.');
          return true;
        }
      }
      
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
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    
    try {
      // Update profile in Supabase if we have a Supabase user
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user?.id === user.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: userData.name,
            avatar: userData.avatar,
            updated_at: new Date().toISOString() // Convert Date to string
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating profile:', error);
          toast.error('Erro ao atualizar perfil');
          return false;
        }
      } else {
        // Fallback to demo mode
        const updatedUser = { ...user, ...userData };
        
        // Update in demo users array
        const index = demoUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          demoUsers[index] = updatedUser;
        }
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
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
