import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { getCurrentUserEffectiveRole, canAccessRoute } from '@/services/permissionService';

export type UserRole = 'super_admin' | 'owner' | 'administrador' | 'gestor' | 'tecnico' | 'requisitor';

export interface EnhancedAuthUser {
  id: string;
  email?: string;
  name: string;
  avatar: string;
  role: UserRole;
  effectiveRole: UserRole;
  organizationId: string;
  teamId?: string;
  permissions: string[];
}

interface EnhancedAuthContextType {
  user: EnhancedAuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterFormData) => Promise<boolean>;
  updateUser: (userData: Partial<EnhancedAuthUser>) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => Promise<boolean>;
  effectiveRole: UserRole;
  refreshUserData: () => Promise<void>;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

// Mapeamento de permissões por role
const rolePermissions: Record<UserRole, string[]> = {
  'super_admin': ['manage_system', 'manage_organizations', 'manage_users', 'view_all'],
  'owner': ['manage_organization', 'manage_teams', 'manage_org_users', 'view_org_data'],
  'administrador': ['manage_teams', 'manage_services', 'view_all_org_services', 'manage_invites'],
  'gestor': ['manage_team', 'view_team_services', 'assign_technicians'],
  'tecnico': ['view_assigned_services', 'update_services'],
  'requisitor': ['create_services', 'view_own_services']
};

// Enhanced auth state cleanup
export const cleanupAuthState = () => {
  console.log('[AUTH] Limpando estado de autenticação...');
  
  // Remove all Supabase auth keys
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.startsWith('supabase.auth.') || 
    key.includes('sb-') ||
    key === 'supabase.auth.token'
  );
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[AUTH] Removido: ${key}`);
  });

  // Clean sessionStorage too
  const sessionKeysToRemove = Object.keys(sessionStorage || {}).filter(key => 
    key.startsWith('supabase.auth.') || key.includes('sb-')
  );
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
};

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EnhancedAuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const buildUserProfile = useCallback(async (authUser: User): Promise<EnhancedAuthUser | null> => {
    try {
      console.log('[AUTH] Construindo perfil para usuário:', authUser.id);
      
      // Buscar dados do perfil
      const profile = await fetchUserProfile(authUser.id);
      if (!profile) {
        console.warn('[AUTH] Perfil não encontrado para usuário:', authUser.id);
        return null;
      }

      // Obter role efetivo considerando hierarquia organizacional
      const effectiveRole = await getCurrentUserEffectiveRole();
      
      // Obter organização atual
      const { data: organizationId } = await supabase.rpc('get_current_user_organization_id');
      
      const enhancedUser: EnhancedAuthUser = {
        id: authUser.id,
        email: authUser.email,
        name: profile.name || 'Usuário',
        avatar: profile.avatar || '',
        role: effectiveRole as UserRole,
        effectiveRole: effectiveRole as UserRole,
        organizationId: organizationId || '',
        teamId: profile.team_id || undefined,
        permissions: rolePermissions[effectiveRole as UserRole] || []
      };

      console.log('[AUTH] Perfil construído:', enhancedUser);
      return enhancedUser;
    } catch (error) {
      console.error('[AUTH] Erro ao construir perfil:', error);
      return null;
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const userProfile = await buildUserProfile(session.user);
      setUser(userProfile);
    } catch (error) {
      console.error('[AUTH] Erro ao atualizar dados do usuário:', error);
    }
  }, [session, buildUserProfile]);

  useEffect(() => {
    console.log('[AUTH] Configurando listeners de autenticação');
    
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Estado de auth mudou:', event, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          // Defer para evitar deadlock
          setTimeout(async () => {
            try {
              const userProfile = await buildUserProfile(session.user);
              setUser(userProfile);
            } catch (error) {
              console.error('[AUTH] Erro ao processar mudança de auth:', error);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AUTH] Sessão inicial:', initialSession?.user?.id);
      setSession(initialSession);
      
      if (initialSession?.user) {
        setTimeout(async () => {
          try {
            const userProfile = await buildUserProfile(initialSession.user);
            setUser(userProfile);
          } catch (error) {
            console.error('[AUTH] Erro ao carregar sessão inicial:', error);
          }
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [buildUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AUTH] Erro no login:', error);
        toast.error(error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : 'Erro ao fazer login'
        );
        return false;
      }

      if (data.user) {
        toast.success('Login realizado com sucesso!');
        navigate('/');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AUTH] Erro no login:', error);
      toast.error('Erro inesperado ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      if (error) {
        console.error('[AUTH] Erro no registro:', error);
        toast.error(error.message === 'User already registered' 
          ? 'Este email já está registrado' 
          : 'Erro ao criar conta'
        );
        return false;
      }

      if (data.user) {
        toast.success('Conta criada com sucesso! Verifique seu email.');
        navigate('/login');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AUTH] Erro no registro:', error);
      toast.error('Erro inesperado ao criar conta');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AUTH] Erro no logout:', error);
        toast.error('Erro ao fazer logout');
        return;
      }
      
      setUser(null);
      setSession(null);
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('[AUTH] Erro no logout:', error);
      toast.error('Erro inesperado ao fazer logout');
    }
  };

  const updateUser = async (userData: Partial<EnhancedAuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await updateUserProfile(user.id, userData);
      if (success) {
        // Atualizar estado local
        setUser(prev => prev ? { ...prev, ...userData } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AUTH] Erro ao atualizar usuário:', error);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const canAccessRouteCheck = async (route: string): Promise<boolean> => {
    return canAccessRoute(route);
  };

  const value: EnhancedAuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUser,
    hasPermission,
    canAccessRoute: canAccessRouteCheck,
    effectiveRole: (user?.effectiveRole || 'tecnico') as UserRole,
    refreshUserData
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuth = (): EnhancedAuthContextType => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth deve ser usado dentro de EnhancedAuthProvider');
  }
  return context;
};