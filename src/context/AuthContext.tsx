import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'tecnico' | 'gestor' | 'administrador' | 'requisitor';
  teamId?: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Função para limpar completamente o estado de autenticação
const cleanAuthState = () => {
  // Limpar localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Limpar sessionStorage
  Object.keys(sessionStorage || {}).forEach(key => {
    if (key.startsWith('supabase.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // O estado 'initialized' não é mais necessário com a nova lógica

  const buildUserProfile = useCallback(async (authUser: User): Promise<AuthUser> => {
    try {
      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Buscar role do usuário (com timeout)
      let role = 'tecnico';
      try {
        const { data: roleData, error: roleError } = await Promise.race([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
        ]) as any;

        if (!roleError && roleData) {
          role = roleData.role;
        }
      } catch (error) {
        console.warn('[Auth] Usando role padrão devido a erro:', error);
      }

      return {
        id: authUser.id,
        email: authUser.email!,
        name: profileData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        avatar: profileData?.avatar || null,
        role: role as any,
        teamId: profileData?.team_id || null,
        permissions: []
      };
    } catch (error) {
      console.error('[Auth] Erro ao construir perfil:', error);
      // Retorna perfil básico em caso de erro
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        avatar: null,
        role: 'tecnico',
        teamId: null,
        permissions: []
      };
    }
  }, []);

  // ===== INÍCIO DA ALTERAÇÃO =====
  // Os dois useEffects anteriores foram substituídos por este único useEffect mais robusto.
  useEffect(() => {
    // 1. Tenta pegar a sessão inicial assim que o app carrega
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const userProfile = await buildUserProfile(session.user);
        setSession(session);
        setUser(userProfile);
      }
      setIsLoading(false);
    });

    // 2. Ouve por todas as mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Se o evento for de logout, limpa o estado
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          cleanAuthState();
        } 
        // Para qualquer outro evento com sessão (SIGNED_IN, TOKEN_REFRESHED, etc.)
        else if (session) {
          const userProfile = await buildUserProfile(session.user);
          setSession(session);
          setUser(userProfile);
        }
      }
    );

    // 3. Limpa o listener ao desmontar o componente
    return () => {
      subscription?.unsubscribe();
    };
  }, [buildUserProfile]);
  // ===== FIM DA ALTERAÇÃO =====

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Limpar estado antes do login
      cleanAuthState();
      
      // Tentativa de logout preventivo
      try {
        await supabase.auth.signOut({ scope: 'global' });
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
      } catch (e) {
        // Ignorar erros de logout preventivo
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('[Auth] Erro no login:', error);
        toast.error("Erro no login", { 
          description: error.message.includes('Invalid') 
            ? "Email ou senha inválidos" 
            : error.message 
        });
        return false;
      }

      if (data.user) {
        // O listener onAuthStateChange cuidará do resto
        toast.success("Login realizado com sucesso!");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[Auth] Erro inesperado no login:', error);
      toast.error("Erro no login", { description: "Tente novamente" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Limpar estado antes do registro
      cleanAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            team_id: userData.team_id
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('[Auth] Erro no registro:', error);
        toast.error("Erro no cadastro", { description: error.message });
        return false;
      }

      if (data.user) {
        toast.success("Cadastro realizado!", { 
          description: "Verifique seu email para confirmar a conta." 
        });
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[Auth] Erro inesperado no registro:', error);
      toast.error("Erro no cadastro", { description: "Tente novamente" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      cleanAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      setSession(null);
      setUser(null);
      toast.success("Logout realizado com sucesso!");
      // Força recarregamento da página para limpeza completa
      window.location.href = '/login';
    } catch (error: any) {
      console.error('[Auth] Erro no logout:', error);
      // Mesmo com erro, força a limpeza
      setSession(null);
      setUser(null);
      cleanAuthState();
      window.location.href = '/login';
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
      console.error('[Auth] Erro ao atualizar usuário:', error);
      toast.error("Erro ao atualizar perfil");
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
