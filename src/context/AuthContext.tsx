import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Limpar todos os estados de autenticação da Supabase (fix para limbo de sessão)
export const cleanupAuthState = () => {
  // Remove supabase padrões
  localStorage.removeItem('supabase.auth.token');
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, user_roles (role)`)
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Profile not found, can happen right after signup
          console.warn(`Profile for ${authUser.id} not found, retrying once...`);
          // Retry once after a short delay to allow the DB trigger to run
          await new Promise(res => setTimeout(res, 1500));
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select(`*, user_roles (role)`)
            .eq('id', authUser.id)
            .single();

          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error("Erro ao carregar perfil", { description: "Não foi possível carregar os dados do seu usuário." });
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      console.log(`Auth event: ${event}`, session);
      setIsLoading(true);
      
      if (session?.user) {
        const profileData = await loadUserProfile(session.user);

        if (profileData) {
          const roleData = profileData.user_roles;
          const role = Array.isArray(roleData) && roleData.length > 0 ? roleData[0].role : 'tecnico';
          
          const authUserData: AuthUser = {
            id: profileData.id,
            email: session.user.email,
            name: profileData.name || 'Usuário',
            avatar: profileData.avatar || '',
            team_id: profileData.team_id,
            role: role as any,
            permissions: [],
          };
          setUser(authUserData);
        } else {
          // loadUserProfile failed, user is signed out
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    cleanupAuthState();
    try {
      // Tenta fazer sign out global ANTES de sign in (ignora erro)
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } catch {}
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro no login", { description: "Email ou senha inválidos." });
      return false;
    }
    return true;
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    cleanupAuthState();
    try {
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } catch {}
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { 
        data: { 
          name: userData.name, 
          role: userData.role, 
          team_id: userData.team_id 
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    if (error) {
      toast.error("Erro no cadastro", { description: error.message });
      return false;
    }
    toast.success("Cadastro realizado!", { description: "Verifique seu email para confirmar a conta." });
    return true;
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return false;
    }
  };

  const value = { 
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
