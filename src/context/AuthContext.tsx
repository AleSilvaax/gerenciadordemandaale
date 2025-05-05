import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateUserProfile, fetchUserProfile } from '@/services/profileService';
import { AuthContextType, AuthState, AuthUser, LoginFormData, RegisterFormData } from '@/types/auth';
import { createTeam, joinTeamByCode } from '@/services/teamService';
import { UserRole } from '@/types/serviceTypes';

// Valor inicial do contexto
const initialState: AuthState = {
  user: null,
  isLoading: false, // Changed to false to prevent automatic loading
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
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: true,
      isLoading: false,
    }));
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
        throw error;
      }
      
      if (!data || !data.user) {
        console.error("Login falhou: dados de usuário ausentes");
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
      
      console.log("Login bem sucedido para:", data.user.email);
      
      try {
        // Buscar perfil do usuário
        const profile = await fetchUserProfile(data.user.id);
        console.log("Perfil encontrado:", profile);
        
        // Buscar a função do usuário
        const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
          user_id: data.user.id
        });
        
        if (roleError) {
          console.error("Erro ao buscar função do usuário:", roleError);
        }
        
        console.log("Role do usuário:", roleData);
        const userRole = roleData as UserRole || 'tecnico';
        
        updateUserInfo({
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || data.user.user_metadata?.name || '',
          avatar: profile?.avatar || '',
          role: userRole,
        });
        
        toast.success('Login realizado com sucesso!');
        return true;
      } catch (profileError) {
        console.error("Erro ao obter perfil/role:", profileError);
        // Ainda permitir login mesmo se falhar a obter perfil
        updateUserInfo({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          avatar: '',
          role: 'tecnico',
        });
        
        toast.success('Login realizado com sucesso!');
        return true;
      }
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
      setState({ ...state, isLoading: true });
      await supabase.auth.signOut();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      setState({ ...state, isLoading: false });
    }
  };

  // Função para registrar um novo usuário
  const register = async (userData: RegisterFormData): Promise<boolean> => {
    try {
      setState({ ...state, isLoading: true });
      
      console.log("Iniciando registro com dados:", userData);
      
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
        throw error;
      }
      
      if (data && data.user) {
        console.log("Usuário criado com sucesso:", data.user.id);
        
        // Após o registro, tentamos associar o usuário a uma equipe ou criar uma nova
        try {
          // Se for criação de equipe
          if (userData.createTeam && userData.teamName) {
            console.log("Criando nova equipe:", userData.teamName);
            const team = await createTeam(userData.teamName);
            if (!team) {
              console.error("Falha ao criar equipe");
              toast.error('Erro ao criar equipe');
            } else {
              console.log("Equipe criada com sucesso:", team);
              toast.success("Equipe criada com sucesso!");
            }
          } 
          // Se for juntar-se a uma equipe existente
          else if (userData.inviteCode) {
            console.log("Tentando juntar-se à equipe com código:", userData.inviteCode);
            const joined = await joinTeamByCode(userData.inviteCode);
            if (!joined) {
              console.error("Falha ao entrar na equipe");
              toast.error('Código de equipe inválido');
            } else {
              console.log("Entrou na equipe com sucesso");
              toast.success("Você entrou na equipe com sucesso!");
            }
          }
        } catch (teamError) {
          console.error("Erro ao processar equipe:", teamError);
          toast.error("Erro ao processar equipe. Por favor, tente novamente após o login.");
        }

        // Atualizar perfil após registro bem-sucedido
        const userObject: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: userData.name,
          role: userData.role,
        };
        
        await updateUserProfile(data.user.id, userObject);
        
        updateUserInfo(userObject);
        
        toast.success('Conta criada com sucesso!');
        return true;
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
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação...");
        setState(prev => ({ ...prev, isLoading: true })); // Only set loading to true when actively checking
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Sessão existente encontrada para:", session.user.email);
          
          try {
            // Buscar perfil do usuário
            const profile = await fetchUserProfile(session.user.id);
            console.log("Perfil encontrado para sessão existente:", profile);
            
            // Buscar a função do usuário
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              user_id: session.user.id
            });
            
            if (roleError) {
              console.error("Erro ao buscar função do usuário da sessão:", roleError);
            }
            
            console.log("Role do usuário da sessão existente:", roleData);
            const userRole = roleData as UserRole || 'tecnico';
            
            updateUserInfo({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || '',
              avatar: profile?.avatar || '',
              role: userRole,
            });
          } catch (error) {
            console.error("Erro ao obter perfil/role para sessão existente:", error);
            // Ainda continuar mesmo com erro
            updateUserInfo({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || '',
              avatar: '',
              role: 'tecnico',
            });
          }
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };
    
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de autenticação:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("Usuário conectado:", session.user.email);
        
        try {
          // Buscar perfil do usuário
          const profile = await fetchUserProfile(session.user.id);
          console.log("Perfil encontrado após login:", profile);
          
          // Buscar a função do usuário
          const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
            user_id: session.user.id
          });
          
          if (roleError) {
            console.error("Erro ao buscar função do usuário após login:", roleError);
          }
          
          console.log("Role do usuário após login:", roleData);
          const userRole = roleData as UserRole || 'tecnico';
          
          updateUserInfo({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || '',
            avatar: profile?.avatar || '',
            role: userRole,
          });
        } catch (error) {
          console.error("Erro ao obter perfil/role após login:", error);
          // Continuar mesmo com erro
          updateUserInfo({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            avatar: '',
            role: 'tecnico',
          });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário desconectado");
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
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
