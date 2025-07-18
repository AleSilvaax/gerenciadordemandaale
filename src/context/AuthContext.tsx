
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData, UserRole } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      console.log('[AUTH] Buscando perfil completo do usuário:', userId);
      console.log('[AUTH] Chamando RPC get_user_complete_profile...'); // NOVO LOG

      // Usar a nova função otimizada do banco
      const { data, error } = await supabase
        .rpc('get_user_complete_profile', { user_uuid: userId });

      console.log('[AUTH] RPC get_user_complete_profile - Data:', data); // NOVO LOG
      console.log('[AUTH] RPC get_user_complete_profile - Error:', error); // NOVO LOG

      if (error) {
        console.error('[AUTH] Erro ao buscar perfil completo:', error);
        setIsLoading(false); // Crucial para evitar carregamento infinito
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('[AUTH] Nenhum perfil encontrado para usuário:', userId);
        setIsLoading(false); // Crucial para evitar carregamento infinito
        return null;
      }

      const profile = data[0];
      const currentUser = session?.user;

      console.log('[AUTH] Perfil completo retornado pela RPC:', profile);

      return {
        id: profile.id,
        email: currentUser?.email || '',
        name: profile.name || 'Usuário',
        avatar: profile.avatar || '',
        role: profile.role as UserRole,
        permissions: [],
        team_id: profile.team_id,
        organization_id: profile.organization_id,
        signature: '',
        phone: '',
      };
    } catch (error) {
      console.error('[AUTH] Erro geral ao buscar dados do usuário:', error);
      setIsLoading(false); // Crucial para evitar carregamento infinito
      return null;
    }
  };

  const handleAuthChange = async (event: string, session: Session | null) => {
    console.log('[AUTH] Mudança de autenticação:', event, 'Sessão User ID:', session?.user?.id); // LOG ATUALIZADO
    console.log('[AUTH] Antes de setSession/setUser - Session:', session, 'User:', user); // NOVO LOG
    
    setSession(session);
    setIsLoading(true); // Definir isLoading como true no início do processo de mudança de autenticação
    
    if (session?.user) {
      // Remover setTimeout - tornar a busca de perfil síncrona
      const userProfile = await fetchUserProfile(session.user.id);
      if (userProfile) {
        setUser(userProfile);
        console.log('[AUTH] handleAuthChange - User profile definido:', userProfile); // NOVO LOG
      } else {
        // Criar perfil básico temporário se não encontrou
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'Usuário',
          avatar: '',
          role: 'tecnico',
          permissions: [],
          team_id: '',
          organization_id: '',
          signature: '',
          phone: '',
        });
        console.log('[AUTH] handleAuthChange - Perfil básico definido:', user); // NOVO LOG
      }
      setIsLoading(false); // Definir isLoading como false após definir o user
      console.log('[AUTH] handleAuthChange - isLoading set to false (com user).'); // LOG ATUALIZADO
    } else {
      setUser(null);
      setIsLoading(false);
      console.log('[AUTH] handleAuthChange - isLoading set to false (sem user).'); // LOG ATUALIZADO
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Inicializando contexto de autenticação...'); // NOVO LOG
        setIsLoading(true); // Garantir que isLoading é true na inicialização
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log('[AUTH] initializeAuth - Sessão atual encontrada:', currentSession.user.id); // NOVO LOG
          const userProfile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setSession(currentSession);
            setUser(userProfile);
            console.log('[AUTH] initializeAuth - User profile definido:', userProfile); // NOVO LOG
          }
        } else {
          console.log('[AUTH] initializeAuth - Nenhuma sessão encontrada.'); // NOVO LOG
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('[AUTH] initializeAuth - isLoading set to false (finalizado).'); // NOVO LOG
        }
      } catch (error) {
        console.error('[AUTH] Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
          console.log('[AUTH] initializeAuth - isLoading set to false (erro).'); // NOVO LOG
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('[AUTH] Iniciando login para:', email); // NOVO LOG
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[AUTH] Erro no login:', error);
        toast.error("Erro no login", { description: "Email ou senha inválidos." });
        return false;
      }
      
      console.log('[AUTH] Login realizado com sucesso para:', email); // NOVO LOG
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado no login:', error);
      toast.error("Erro no login", { description: "Erro inesperado. Tente novamente." });
      return false;
    }
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      console.log('[AUTH] Iniciando registro para:', userData.email); // NOVO LOG
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { 
          data: { 
            name: userData.name, 
            role: userData.role, 
            team_id: userData.teamId || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('[AUTH] Erro no registro:', error);
        toast.error("Erro no cadastro", { description: error.message });
        return false;
      }
      
      console.log('[AUTH] Registro realizado com sucesso para:', userData.email); // NOVO LOG
      toast.success("Cadastro realizado!", { 
        description: "Você pode fazer login agora." 
      });
      return true;
    } catch (error) {
      console.error('[AUTH] Erro inesperado no registro:', error);
      toast.error("Erro no cadastro", { description: "Erro inesperado. Tente novamente." });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('[AUTH] Fazendo logout...'); // NOVO LOG
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
    console.log('[AUTH] Logout concluído.'); // NOVO LOG
  };

  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: _data, error } = await supabase
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

  const canAccessRoute = (route: string): boolean => {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
