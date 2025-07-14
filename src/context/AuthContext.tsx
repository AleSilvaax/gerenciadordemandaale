
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

      if (error && error.code === 'PGRST116') {
        console.warn(`[AUTH] Perfil não encontrado para ${authUser.id} - será criado automaticamente pelo trigger`);
        return null;
      }

      if (error) {
        console.error('[AUTH] Erro ao carregar perfil:', error);
        throw error;
      }
      
      console.log(`[AUTH] Perfil carregado com sucesso:`, data);
      return data;
    } catch (error) {
      console.error('[AUTH] Erro ao carregar perfil:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: string, session: any) => {
      console.log(`[AUTH] Evento: ${event}`, session ? 'com sessão' : 'sem sessão');
      
      if (!mounted) return;
      
      setIsLoading(true);
      
      if (session?.user) {
        const profileData = await loadUserProfile(session.user);

        if (mounted && profileData) {
          const roleData = profileData.user_roles;
          const role = Array.isArray(roleData) && roleData.length > 0 
            ? roleData[0].role 
            : 'tecnico'; // Padrão
          
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
          console.log(`[AUTH] Usuário autenticado:`, authUserData);
        } else if (mounted) {
          setUser(null);
        }
      } else if (mounted) {
        setUser(null);
        console.log('[AUTH] Usuário desconectado');
      }
      
      if (mounted) {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('[AUTH] Iniciando login...');
    cleanupAuthState();
    
    try {
      // Force global signout first
      try { 
        await supabase.auth.signOut({ scope: 'global' }); 
      } catch (e) {
        console.log('[AUTH] Signout preventivo ignorado:', e);
      }

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
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {}
    // Força um refresh de página para garantir "logout total"
    window.location.href = "/login";
  };
  
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.from('profiles').update({ name: userData.name, avatar: userData.avatar }).eq('id', user.id).select().single();
    if (error) {
      toast.error("Erro ao atualizar perfil.", { description: error.message });
      return false;
    }
    setUser(prev => prev ? { ...prev, ...userData } : null);
    toast.success("Perfil atualizado com sucesso!");
    return true;
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
      // Pode acessar rotas de gestão, mas não as de admin.
      return ["/nova-demanda", "/estatisticas", "/equipe", "/settings", "/"].includes(route) || route.startsWith("/demandas") || route.startsWith("/buscar");
    }
    if (user.role === "tecnico") {
      // Técnico só pode acessar as rotas básicas
      return ["/", "/demandas", "/demandas/:id", "/buscar", "/settings"].some((r) => route.startsWith(r));
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

const permissions: Record<string, string[]> = {
  administrador: [
    'view_services',
    'create_services', 
    'edit_services',
    'delete_services',
    'manage_team',
    'view_statistics',
    'export_reports',
    'manage_service_types',
    'manage_technical_fields'
  ],
  gestor: [
    'view_services',
    'create_services',
    'edit_services',
    'delete_services',
    'view_statistics',
    'export_reports'
  ],
  tecnico: [
    'view_services',
    'create_services',
    'edit_services'
  ]
};
