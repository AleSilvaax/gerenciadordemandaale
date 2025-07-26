import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'tecnico' | 'gestor' | 'administrador' | 'requisitor';
  teamId?: string;
  organizationId?: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const rolePermissions: Record<string, string[]> = {
  administrador: ['*'],
  gestor: ['read_services', 'write_services', 'read_team', 'write_team', 'read_reports'],
  tecnico: ['read_services', 'write_assigned_services', 'read_team'],
  requisitor: ['read_services', 'create_services']
};

const protectedRoutes: Record<string, string[]> = {
  '/settings': ['administrador', 'gestor'],
  '/equipe': ['administrador', 'gestor', 'tecnico'],
  '/estatisticas': ['administrador', 'gestor']
};

export const OptimizedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildUserProfile = useCallback(async (authUser: User, profileData?: any): Promise<AuthUser> => {
    try {
      let profile = profileData;
      
      // Load profile if not provided
      if (!profile) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Create profile if it doesn't exist
          const newProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
            avatar: authUser.user_metadata?.avatar_url || null,
            team_id: null,
            organization_id: null
          };

          const { data: createdProfile } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          profile = createdProfile;
        } else if (!error) {
          profile = data;
        }
      }

      // Load user role with timeout
      let role = 'tecnico';
      try {
        const rolePromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Role timeout')), 3000)
        );

        const { data: roleData } = await Promise.race([rolePromise, timeoutPromise]) as any;
        role = roleData?.role || 'tecnico';
      } catch (error) {
        console.warn('[Auth] Usando role padrão devido a timeout');
      }

      return {
        id: authUser.id,
        email: authUser.email!,
        name: profile?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
        avatar: profile?.avatar || authUser.user_metadata?.avatar_url || null,
        role: role as any,
        teamId: profile?.team_id || null,
        organizationId: profile?.organization_id || null,
        permissions: rolePermissions[role] || rolePermissions.tecnico
      };
    } catch (error) {
      console.error('[Auth] Erro ao construir perfil:', error);
      // Return basic profile on error
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
        avatar: authUser.user_metadata?.avatar_url || null,
        role: 'tecnico',
        teamId: null,
        organizationId: null,
        permissions: rolePermissions.tecnico
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: string, session: any) => {
      console.log(`[OptimizedAuth] Evento: ${event}`);
      
      if (!mounted) return;
      
      setIsLoading(true);

      try {
        if (session?.user) {
          const userProfile = await buildUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
            console.log('[OptimizedAuth] Usuário autenticado:', userProfile.name);
          }
        } else if (mounted) {
          setUser(null);
          console.log('[OptimizedAuth] Usuário desconectado');
        }
      } catch (error) {
        console.error('[OptimizedAuth] Erro ao processar mudança de auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [buildUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Erro no login", { description: error.message });
        return false;
      }

      if (data.user) {
        const userProfile = await buildUserProfile(data.user);
        setUser(userProfile);
        toast.success("Login realizado com sucesso!");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[OptimizedAuth] Erro no login:', error);
      toast.error("Erro no login", { description: "Tente novamente" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [buildUserProfile]);

  const register = useCallback(async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
          }
        }
      });

      if (error) {
        toast.error("Erro no cadastro", { description: error.message });
        return false;
      }

      if (data.user) {
        toast.success("Cadastro realizado com sucesso!");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[OptimizedAuth] Erro no cadastro:', error);
      toast.error("Erro no cadastro", { description: "Tente novamente" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Logout realizado com sucesso!");
      window.location.href = '/login';
    } catch (error: any) {
      console.error('[OptimizedAuth] Erro no logout:', error);
      toast.error("Erro no logout");
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          avatar: userData.avatar,
        })
        .eq('id', user.id);

      if (error) {
        toast.error("Erro ao atualizar perfil", { description: error.message });
        return false;
      }

      setUser(prev => prev ? { ...prev, ...userData } : null);
      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error: any) {
      console.error('[OptimizedAuth] Erro ao atualizar usuário:', error);
      toast.error("Erro ao atualizar perfil");
      return false;
    }
  }, [user]);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        toast.error("Erro ao solicitar reset", { description: error.message });
        return false;
      }

      toast.success("Email de reset enviado!");
      return true;
    } catch (error: any) {
      console.error('[OptimizedAuth] Erro no reset:', error);
      toast.error("Erro ao solicitar reset");
      return false;
    }
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  }, [user]);

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!user) return false;
    const requiredRoles = protectedRoutes[route];
    if (!requiredRoles) return true;
    return requiredRoles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      requestPasswordReset,
      hasPermission,
      canAccessRoute,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useOptimizedAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useOptimizedAuth deve ser usado dentro de OptimizedAuthProvider');
  }
  return context;
};