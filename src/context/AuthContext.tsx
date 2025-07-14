
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      console.log(`[AUTH] Carregando perfil para: ${authUser.id}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *, 
          user_roles (role)
        `)
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('[AUTH] Erro ao carregar perfil:', error);
        if (error.code === 'PGRST116') {
          console.warn(`[AUTH] Perfil não encontrado para ${authUser.id} - será criado automaticamente pelo trigger`);
          return null;
        }
        throw error;
      }
      
      console.log(`[AUTH] Perfil carregado com sucesso:`, data);
      return data;
    } catch (error) {
      console.error('[AUTH] Erro ao carregar perfil:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Erro ao obter sessão:', error);
        }

        if (mounted) {
          if (session?.user) {
            const profileData = await loadUserProfile(session.user);
            
            if (profileData && mounted) {
              const roleData = profileData.user_roles;
              const role = Array.isArray(roleData) && roleData.length > 0 
                ? roleData[0].role 
                : 'tecnico';
              
              const authUserData: AuthUser = {
                id: profileData.id,
                email: session.user.email,
                name: profileData.name || 'Usuário',
                avatar: profileData.avatar || '',
                team_id: profileData.team_id,
                role: role as any,
                permissions: [],
                organization_id: profileData.organization_id || null,
                organization: null
              };
              
              setUser(authUserData);
            }
          }
          
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[AUTH] Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [loadUserProfile]);

  // Set up auth state change listener
  useEffect(() => {
    if (!isInitialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AUTH] Evento: ${event}`, session ? 'com sessão' : 'sem sessão');
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profileData = await loadUserProfile(session.user);

          if (profileData) {
            const roleData = profileData.user_roles;
            const role = Array.isArray(roleData) && roleData.length > 0 
              ? roleData[0].role 
              : 'tecnico';
            
            const authUserData: AuthUser = {
              id: profileData.id,
              email: session.user.email,
              name: profileData.name || 'Usuário',
              avatar: profileData.avatar || '',
              team_id: profileData.team_id,
              role: role as any,
              permissions: [],
              organization_id: profileData.organization_id || null,
              organization: null
            };
            
            setUser(authUserData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isInitialized, loadUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('[AUTH] Iniciando login...');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[AUTH] Erro no login:', error);
        toast.error("Erro no login", { description: "Email ou senha inválidos." });
        return false;
      }
      
      console.log('[AUTH] Login realizado com sucesso');
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado no login:', error);
      toast.error("Erro no login", { description: "Erro inesperado. Tente novamente." });
      return false;
    }
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      console.log('[AUTH] Registrando usuário:', userData.email);
      
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'tecnico'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('[AUTH] Erro no registro:', error);
        toast.error("Erro no registro", { description: error.message });
        return false;
      }
      
      toast.success("Registro realizado!", { 
        description: "Verifique seu email para confirmar a conta." 
      });
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado no registro:', error);
      toast.error("Erro no registro", { description: "Erro inesperado. Tente novamente." });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('[AUTH] Erro no logout:', error);
    }
  };
  
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: userData.name, avatar: userData.avatar })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        toast.error("Erro ao atualizar perfil.", { description: error.message });
        return false;
      }
      
      setUser(prev => prev ? { ...prev, ...userData } : null);
      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error('[AUTH] Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil.");
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'administrador') return true;
    if (user.role === 'gestor') {
        return ['view_stats', 'add_members', 'create_service'].includes(permission);
    }
    return false;
  };

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!user) return false;
    if (user.role === "administrador") return true;
    if (user.role === "gestor") {
      return ["/nova-demanda", "/estatisticas", "/equipe", "/settings", "/", "/minhas-demandas"].includes(route) || route.startsWith("/demandas") || route.startsWith("/buscar");
    }
    if (user.role === "tecnico") {
      return ["/", "/demandas", "/minhas-demandas", "/settings"].some((r) => route.startsWith(r));
    }
    return false;
  }, [user]);

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error("Erro ao solicitar reset", { description: error.message });
        return false;
      }
      
      toast.success("Email enviado!", { 
        description: "Verifique sua caixa de entrada para redefinir a senha." 
      });
      return true;
    } catch (error) {
      toast.error("Erro inesperado", { description: "Tente novamente mais tarde." });
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
    updateUserInfo: setUser, 
    hasPermission, 
    canAccessRoute,
    requestPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
