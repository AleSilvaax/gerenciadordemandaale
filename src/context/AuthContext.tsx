import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'owner' | 'administrador' | 'gestor' | 'tecnico' | 'requisitor';
  teamId?: string;
  permissions: string[];
  organizationId?: string;
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
  const [initialized, setInitialized] = useState(false);

  const buildUserProfile = useCallback(async (authUser: User): Promise<AuthUser> => {
    try {
      console.log('[Auth] Construindo perfil para usuário:', authUser.id);
      
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('[Auth] Dados do perfil:', profileData, profileError);

      // Buscar role efetivo usando a função do banco
      let role = 'tecnico';
      try {
        const { data: effectiveRole, error: roleError } = await supabase.rpc('get_effective_user_role');
        
        console.log('[Auth] Role efetivo:', effectiveRole, roleError);

        if (!roleError && effectiveRole) {
          role = effectiveRole;
        }
      } catch (error) {
        console.warn('[Auth] Usando role padrão devido a erro:', error);
      }

      const userProfile = {
        id: authUser.id,
        email: authUser.email!,
        name: profileData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        avatar: profileData?.avatar || null,
        role: role as any,
        teamId: profileData?.team_id || null,
        organizationId: profileData?.organization_id || null,
        permissions: []
      };

      console.log('[Auth] Perfil construído:', userProfile);
      return userProfile;
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
        organizationId: null,
        permissions: []
      };
    }
  }, []);

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Inicializando autenticação...');
        
        // Verificar sessão atual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Erro ao obter sessão:', error);
          cleanAuthState();
        }
        
        console.log('[AUTH] Sessão atual:', currentSession ? 'Existe' : 'Não existe');
        console.log('[AUTH] User ID da sessão:', currentSession?.user?.id || 'Não disponível');
        
        if (mounted) {
          if (currentSession?.user) {
            setSession(currentSession);
            const userProfile = await buildUserProfile(currentSession.user);
            setUser(userProfile);
            
            // Testar se auth.uid() funciona no Supabase
            try {
              const { data: authTest, error: authError } = await supabase.rpc('get_current_user_role');
              console.log('[AUTH] Teste auth.uid() no servidor - Role:', authTest);
              console.log('[AUTH] Teste auth.uid() no servidor - Erro:', authError);
            } catch (testError) {
              console.error('[AUTH] Erro no teste auth.uid():', testError);
            }
          } else {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('[AUTH] Erro na inicialização:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();
    return () => { mounted = false; };
  }, [buildUserProfile]);

  // Listener para mudanças de estado de autenticação
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Evento:', event);
        
        try {
          // ===== INÍCIO DA ALTERAÇÃO =====
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            cleanAuthState();
          } else if (newSession?.user) {
            // Esta condição agora lida com SIGNED_IN, TOKEN_REFRESHED, e USER_UPDATED
            // Apenas atualiza o perfil se o usuário for diferente do atual para otimizar
            if (newSession.user.id !== user?.id) {
              const userProfile = await buildUserProfile(newSession.user);
              setUser(userProfile);
            }
            setSession(newSession); // Sempre atualiza a sessão
          }
          // ===== FIM DA ALTERAÇÃO =====
        } catch (error) {
          console.error('[Auth] Erro no listener:', error);
          setSession(null);
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [initialized, buildUserProfile, user]); // Adicionado 'user' à dependência para a comparação

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
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        setIsLoading(true);
        console.log(`[Auth] Tentativa ${retryCount + 1} de registro para:`, userData.email);
        console.log('[Auth] Dados de registro:', { 
          name: userData.name, 
          role: userData.role, 
          team_id: userData.team_id,
          email: userData.email 
        });
        
        // Limpar estado antes do registro
        cleanAuthState();
        
        // Validações adicionais
        if (!userData.email || !userData.password || !userData.name) {
          throw new Error('Dados obrigatórios não fornecidos');
        }
        
        // Preparar metadata com validação
        const userMetadata: any = {
          name: userData.name.trim(),
          role: userData.role || 'tecnico'
        };
        
        // Só incluir team_id se for válido
        if (userData.team_id && userData.team_id.trim() !== '') {
          userMetadata.team_id = userData.team_id.trim();
        }
        
        console.log('[Auth] Metadata a ser enviado:', userMetadata);
        
        const { data, error } = await supabase.auth.signUp({
          email: userData.email.trim(),
          password: userData.password,
          options: {
            data: userMetadata,
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          console.error(`[Auth] Erro no registro (tentativa ${retryCount + 1}):`, error);
          
          // Verificar se é um erro temporário que justifica retry
          const isTemporaryError = error.message.includes('timeout') || 
                                 error.message.includes('network') ||
                                 error.message.includes('connection') ||
                                 error.message.includes('Database error');
          
          if (isTemporaryError && retryCount < maxRetries) {
            console.log(`[Auth] Erro temporário detectado, tentando novamente em 2 segundos...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          // Classificar e tratar erro definitivo
          let errorMessage = 'Erro no cadastro';
          if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
            errorMessage = 'Este email já está cadastrado no sistema';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Email inválido';
          } else if (error.message.includes('Password') || error.message.includes('password')) {
            errorMessage = 'Senha deve ter pelo menos 6 caracteres';
          } else if (error.message.includes('signup_disabled')) {
            errorMessage = 'Cadastro desabilitado temporariamente';
          } else if (error.message.includes('Database error')) {
            errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
          } else {
            errorMessage = error.message;
          }
          
          toast.error("Erro no cadastro", { description: errorMessage });
          return false;
        }

        if (data.user) {
          console.log('[Auth] Usuário registrado com sucesso:', data.user.id);
          console.log('[Auth] Dados do usuário criado:', {
            id: data.user.id,
            email: data.user.email,
            confirmed: !!data.user.email_confirmed_at,
            metadata: data.user.user_metadata
          });
          
          // Aguardar um pouco para o trigger do banco processar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se o email foi confirmado automaticamente
          if (data.user.email_confirmed_at) {
            toast.success("Cadastro realizado com sucesso!", { 
              description: "Você será redirecionado automaticamente." 
            });
          } else {
            toast.success("Cadastro realizado!", { 
              description: "Verifique seu email para confirmar a conta." 
            });
          }
          return true;
        }

        return false;
      } catch (error: any) {
        console.error(`[Auth] Erro inesperado no registro (tentativa ${retryCount + 1}):`, error);
        
        // Se for o último retry, mostrar erro
        if (retryCount >= maxRetries) {
          toast.error("Erro no cadastro", { description: "Erro inesperado. Tente novamente." });
          return false;
        }
        
        // Tentar novamente
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } finally {
        setIsLoading(false);
      }
    }
    
    return false;
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
