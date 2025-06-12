import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer profile loading to prevent deadlocks
          setTimeout(async () => {
            await loadUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        setTimeout(async () => {
          await loadUserProfile(session.user);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Loading user profile for:', authUser.id);
      
      // Fetch profile data
      const profile = await fetchUserProfile(authUser.id);
      
      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();

      // Cast the role to UserRole type with a fallback
      const userRole = (roleData?.role === 'administrador' || 
                       roleData?.role === 'gestor' || 
                       roleData?.role === 'tecnico') 
                       ? roleData.role as any 
                       : 'tecnico' as any;

      const authUserData: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || 'Usuário',
        avatar: profile?.avatar || '',
        phone: profile?.phone || '',
        role: userRole,
        permissions: [] // Can be extended based on role
      };

      console.log('User profile loaded:', authUserData);
      setUser(authUserData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set basic user data even if profile fetch fails
      const authUserData: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || 'Usuário',
        avatar: '',
        role: 'tecnico',
        permissions: []
      };
      setUser(authUserData);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Login realizado com sucesso!");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Erro no login", {
        description: error.message || "Verifique suas credenciais e tente novamente."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Registering user with role:', userData.role);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role // This is critical - the role must be included in metadata
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('User registered successfully with metadata:', data.user.user_metadata);
        toast.success("Cadastro realizado com sucesso!");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error("Erro no cadastro", {
        description: error.message || "Falha ao criar conta. Tente novamente."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error("Erro no logout");
    }
  };

  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await updateUserProfile(user.id, userData);
      if (success) {
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }
      return success;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const updateUserInfo = (userData: AuthUser): void => {
    setUser(userData);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Simple role-based permissions
    switch (user.role) {
      case 'administrador':
        return true; // Admin has all permissions
      case 'gestor':
        return ['view_services', 'create_services', 'manage_team'].includes(permission);
      case 'tecnico':
        return ['view_services', 'update_services'].includes(permission);
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUser,
    updateUserInfo,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
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
