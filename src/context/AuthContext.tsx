
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple auth state cleanup
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
        .select(`*, user_roles (role)`)
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`[AUTH] Perfil não encontrado para ${authUser.id}, criando perfil básico...`);
          
          // Criar perfil básico
          const userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário';
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              name: userName,
              avatar: '',
              team_id: null,
              organization_id: null
            })
            .select(`*, user_roles (role)`)
            .single();

          if (insertError) {
            console.error('[AUTH] Erro ao criar perfil:', insertError);
            throw insertError;
          }

          // Criar papel padrão (primeiro usuário será admin)
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authUser.id,
              role: 'administrador' // Primeiro usuário sempre será admin
            });

          if (roleError && roleError.code !== '23505') {
            console.error('[AUTH] Erro ao criar papel:', roleError);
          }

          console.log('[AUTH] Perfil básico criado:', newProfile);
          return newProfile;
        }
        throw error;
      }
      
      console.log(`[AUTH] Perfil carregado com sucesso:`, data);
      return data;
    } catch (error) {
      console.error('[AUTH] Erro ao carregar perfil:', error);
      toast.error("Erro ao carregar perfil", { 
        description: "Não foi possível carregar os dados do usuário." 
      });
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
            : 'administrador'; // Default role
          
          const authUserData: AuthUser = {
            id: profileData.id,
            email: session.user.email,
            name: profileData.name || 'Usuário',
            avatar: profileData.avatar || '',
            team_id: profileData.team_id,
            role: role as any,
            permissions: [],
            organization_id: profileData.organization_id,
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
    console.log('[AUTH] Iniciando registro...');
    cleanupAuthState();
    
    try {
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
        console.error('[AUTH] Erro no registro:', error);
        toast.error("Erro no cadastro", { description: error.message });
        return false;
      }
      
      console.log('[AUTH] Registro realizado com sucesso');
      toast.success("Cadastro realizado!", { 
        description: "Você já pode fazer login no sistema." 
      });
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado no registro:', error);
      toast.error("Erro no cadastro", { description: "Erro inesperado. Tente novamente." });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('[AUTH] Iniciando logout...');
    cleanupAuthState();
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.log('[AUTH] Erro no logout (ignorado):', error);
    }
    
    window.location.href = "/login";
  };
  
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          name: userData.name, 
          avatar: userData.avatar 
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('[AUTH] Erro ao atualizar perfil:', error);
        toast.error("Erro ao atualizar perfil.", { description: error.message });
        return false;
      }
      
      setUser(prev => prev ? { ...prev, ...userData } : null);
      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil.", { description: "Erro inesperado." });
      return false;
    }
  };

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

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'administrador') return true;
    if (user.role === 'gestor') {
      return ['view_stats', 'add_members', 'create_service', 'manage_team'].includes(permission);
    }
    if (user.role === 'tecnico') {
      return ['view_services', 'update_services'].includes(permission);
    }
    return false;
  };

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!user) return false;
    if (user.role === "administrador") return true;
    
    if (user.role === "gestor") {
      const allowedRoutes = [
        "/nova-demanda", "/estatisticas", "/equipe", "/settings", "/", 
        "/demandas", "/buscar"
      ];
      return allowedRoutes.some(r => route.startsWith(r));
    }
    
    if (user.role === "tecnico") {
      const allowedRoutes = ["/", "/demandas", "/buscar", "/settings"];
      return allowedRoutes.some(r => route.startsWith(r));
    }
    
    return false;
  }, [user]);

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
