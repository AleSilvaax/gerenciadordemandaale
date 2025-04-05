
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
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state change event:', event);
            
            if (session?.user) {
              console.log('User from session:', session.user.email);
              
              // Use setTimeout to prevent Supabase auth deadlock
              setTimeout(async () => {
                try {
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
                } catch (err) {
                  console.error('Error handling auth state change:', err);
                  setUser(null);
                }
              }, 0);
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
          checkLocalStorageFallback();
          return;
        }
        
        if (session?.user) {
          console.log('Existing session found:', session.user.email);
          try {
            // Get user profile from Supabase
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              checkLocalStorageFallback();
              return;
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
              console.log('No profile found, checking localStorage');
              checkLocalStorageFallback();
            }
          } catch (error) {
            console.error('Error processing session:', error);
            checkLocalStorageFallback();
          }
        } else {
          console.log('No existing session, checking localStorage');
          checkLocalStorageFallback();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        checkLocalStorageFallback();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper function to check localStorage as fallback for demo mode
    const checkLocalStorageFallback = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          console.log('Found user in localStorage');
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to parse saved user', error);
        localStorage.removeItem('user');
        setUser(null);
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
          toast({
            title: "Confirme seu email",
            description: "Verifique sua caixa de entrada para confirmar sua conta",
            variant: "warning",
          });
          setIsLoading(false);
          return false;
        }
        
        // Fallback to demo mode
        console.log('Trying demo mode login');
        const foundUser = demoUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (foundUser && password.length >= 6) {
          console.log('Demo user found:', foundUser.name);
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo, ${foundUser.name}!`,
            variant: "success",
          });
          setIsLoading(false);
          return true;
        } else {
          toast({
            title: "Erro de autenticação",
            description: "Email ou senha inválidos",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
      }
      
      console.log('Supabase login successful, user:', data.user?.email);
      
      if (data.user) {
        try {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile after login:', profileError);
            setIsLoading(false);
            return false;
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
            toast({
              title: "Login realizado com sucesso",
              description: `Bem-vindo, ${authUser.name}!`,
              variant: "success",
            });
            setIsLoading(false);
            return true;
          }
        } catch (error) {
          console.error('Error processing login:', error);
        }
      }
      
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao processar seu login",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao processar seu login",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };
  
  // Logout function
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
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao encerrar sua sessão",
        variant: "destructive",
      });
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
          toast({
            title: "Erro no cadastro",
            description: "Este email já está em uso",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
        
        // Fallback to demo mode
        if (userData.email && demoUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase())) {
          toast({
            title: "Erro no cadastro",
            description: "Este email já está em uso",
            variant: "destructive",
          });
          setIsLoading(false);
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
        // Check if email verification is required
        if (data.user.identities?.length === 0 || 
            data.user.identities?.[0]?.identity_data?.email_verified === false) {
          toast({
            title: "Quase lá!",
            description: "Verifique seu email para confirmar sua conta",
            variant: "success",
          });
          setIsLoading(false);
          return true;
        }
        
        console.log('Auto-logging in after registration');
        // Log the user in automatically after registration
        try {
          // Criar o perfil do usuário manualmente para garantir que existe
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id,
                name: userData.name,
                avatar: '/placeholder.svg'
              }
            ]);
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
          
          // Criar o papel do usuário
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([
              {
                user_id: data.user.id,
                role: userData.role
              }
            ]);
            
          if (roleError) {
            console.error("Error setting user role:", roleError);
          }
        
          const loginResult = await login(userData.email, userData.password);
          if (loginResult) {
            console.log('Auto-login successful');
            toast({
              title: "Registro concluído",
              description: "Sua conta foi criada com sucesso!",
              variant: "success",
            });
            setIsLoading(false);
            return true;
          } else {
            console.log('Auto-login failed, but registration succeeded');
            toast({
              title: "Registro concluído",
              description: "Conta criada! Por favor, faça login.",
              variant: "success",
            });
            setIsLoading(false);
            return true;
          }
        } catch (loginError) {
          console.error('Error logging in after registration:', loginError);
          toast({
            title: "Registro concluído",
            description: "Verifique seu email para confirmar sua conta.",
            variant: "success",
          });
          setIsLoading(false);
          return true;
        }
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: "Erro ao registrar",
        description: "Ocorreu um erro durante o cadastro. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
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
          toast({
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar seu perfil",
            variant: "destructive",
          });
          setIsLoading(false);
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
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
        variant: "success",
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar seu perfil",
        variant: "destructive",
      });
      setIsLoading(false);
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
