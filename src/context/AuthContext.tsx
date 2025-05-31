
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateUserProfile, fetchUserProfile } from '@/services/profileService';
import { AuthContextType, AuthState, AuthUser, LoginFormData, RegisterFormData } from '@/types/auth';
import { UserRole } from '@/types/serviceTypes';
import { cleanupAuthState } from '@/utils/authCleanup';

// Valor inicial do contexto
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

// Criação do contexto de autenticação
export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  updateUser: async () => false,
  updateUserInfo: () => {},
  hasPermission: () => false,
});

// Hook personalizado para facilitar o uso do contexto
export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

// Provedor do contexto de autenticação que será usado para envolver a aplicação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Atualizar o estado do usuário
  const updateUserInfo = (user: AuthUser) => {
    console.log("Atualizando informações do usuário:", user);
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    if (state.user.role === 'administrador') return true; // Admin tem todas as permissões
    
    // Verificar permissões específicas
    switch(permission) {
      case 'view_stats':
        return ['administrador', 'gestor'].includes(state.user.role || '');
      case 'add_members':
        return ['administrador', 'gestor'].includes(state.user.role || '');
      default:
        return false;
    }
  };

  // Função para carregar dados do usuário
  const loadUserData = async (userId: string) => {
    try {
      console.log("Carregando dados do usuário:", userId);
      
      // Buscar perfil do usuário
      const profile = await fetchUserProfile(userId);
      console.log("Perfil encontrado:", profile);
      
      // Buscar a função do usuário
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        user_id: userId
      });
      
      if (roleError) {
        console.error("Erro ao buscar função do usuário:", roleError);
      }
      
      console.log("Role do usuário:", roleData);
      const userRole = roleData as UserRole || 'tecnico';
      
      return {
        profile,
        role: userRole
      };
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      return {
        profile: null,
        role: 'tecnico' as UserRole
      };
    }
  };

  // Função para fazer login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      console.log("Tentando login com email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro de autenticação:", error.message);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.error(error.message || 'Erro ao fazer login');
        return false;
      }
      
      if (!data || !data.user) {
        console.error("Login falhou: dados de usuário ausentes");
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.error("Erro ao fazer login");
        return false;
      }
      
      console.log("Login bem sucedido para:", data.user.email);
      
      // Carregar dados do usuário
      const { profile, role } = await loadUserData(data.user.id);
      
      const userObject: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: profile?.name || data.user.user_metadata?.name || '',
        avatar: profile?.avatar || '',
        role,
        phone: profile?.phone || '',
      };
      
      updateUserInfo(userObject);
      console.log("Estado do usuário atualizado, login concluído");
      
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Limpar estado primeiro
      cleanupAuthState();
      
      // Tentar signOut global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error) {
        console.log("Erro no signOut (ignorado):", error);
      }
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      toast.success('Logout realizado com sucesso!');
      
      // Usar navigate ao invés de window.location
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Erro no logout:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Função para registrar um novo usuário
  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      setState({ ...state, isLoading: true });
      
      console.log("Iniciando registro com dados:", userData);
      
      // Verificar se o usuário já existe antes de tentar registrar
      const { data: existingUser } = await supabase.auth.getUser();
      if (existingUser?.user?.email === userData.email) {
        console.log("Usuário já está logado, fazendo logout primeiro");
        await supabase.auth.signOut();
      }
      
      // Registrar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });

      if (error) {
        console.error("Erro no registro:", error);
        
        // Se o usuário já existe, tentar fazer login
        if (error.message?.includes('already') || error.message?.includes('registered')) {
          console.log("Usuário já existe, tentando fazer login automaticamente");
          const loginSuccess = await login(userData.email, userData.password);
          
          if (loginSuccess) {
            setState((prev) => ({ ...prev, isLoading: false }));
            return true;
          } else {
            toast.error('Usuário já existe. Por favor, faça login.');
            setState((prev) => ({ ...prev, isLoading: false }));
            return false;
          }
        }
        
        toast.error(error.message || 'Erro ao criar conta');
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
      
      if (data && data.user) {
        console.log("Usuário criado com sucesso:", data.user.id);
        
        // Definir a função do usuário explicitamente após o registro
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: data.user.id,
              role: userData.role
            }, {
              onConflict: 'user_id'
            });
          
          if (roleError) {
            console.error("Erro ao definir função do usuário:", roleError);
          } else {
            console.log("Função do usuário definida como:", userData.role);
          }
        } catch (roleSetError) {
          console.error("Erro ao definir função:", roleSetError);
        }
        
        // Aguardar um pouco para garantir que os triggers do banco executaram
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fazer login após registro bem-sucedido
        const loginSuccess = await login(userData.email, userData.password);
        
        if (loginSuccess) {
          toast.success('Conta criada com sucesso!');
          setState((prev) => ({ ...prev, isLoading: false }));
          return true;
        }
      }
      
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast.error(error.message || 'Erro ao criar conta');
      setState({ ...state, isLoading: false });
      return false;
    }
  };

  // Função para atualizar os dados do usuário
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!state.user) return false;
      
      const success = await updateUserProfile(state.user.id, userData);
      
      if (success) {
        updateUserInfo({
          ...state.user,
          ...userData,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  };

  // Verificar se o usuário está autenticado ao carregar a aplicação
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação inicial...");
        setState(prev => ({ ...prev, isLoading: true }));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao obter sessão:", error);
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }
        
        if (session?.user && mounted) {
          console.log("Sessão existente encontrada para:", session.user.email);
          
          // Carregar dados do usuário
          const { profile, role } = await loadUserData(session.user.id);
          
          if (mounted) {
            const userObject: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || '',
              avatar: profile?.avatar || '',
              role,
              phone: profile?.phone || '',
            };
            
            updateUserInfo(userObject);
          }
        } else if (mounted) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    };
    
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de autenticação:", event, "Usuário:", session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log("Usuário desconectado");
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        updateUser,
        updateUserInfo,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
