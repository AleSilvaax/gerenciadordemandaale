
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, UserProfile } from "@/services/userProfile";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  checkUserRole: (role: 'tecnico' | 'administrador' | 'gestor') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  updateProfile: async () => false,
  checkUserRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar sessão atual
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Verificando sessão...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Sessão encontrada, buscando perfil...");
          const profile = await getCurrentUserProfile();
          console.log("Perfil obtido:", profile);
          setUser(profile);
        } else {
          console.log("Nenhuma sessão encontrada");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Evento de autenticação:", event);
        
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          console.log("Usuário logado ou atualizado, buscando perfil...");
          const profile = await getCurrentUserProfile();
          console.log("Perfil atualizado:", profile);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setUser(null);
          navigate('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Login com email e senha
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Tentando login com:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log("Login bem-sucedido, buscando perfil...");
        const profile = await getCurrentUserProfile();
        console.log("Perfil obtido após login:", profile);
        setUser(profile);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast.error(error.message || "Erro ao fazer login");
      return false;
    }
  };

  // Registrar novo usuário
  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      console.log("Registrando novo usuário:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Conta criada com sucesso! Verifique seu email para confirmar o registro.");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      toast.error(error.message || "Erro ao criar conta");
      return false;
    }
  };

  // Logout
  const signOut = async (): Promise<void> => {
    try {
      console.log("Realizando logout...");
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  // Atualizar perfil
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      console.log("Atualizando perfil:", data);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name || user.name,
          avatar: data.avatar || user.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast.success("Perfil atualizado com sucesso");
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
      return false;
    }
  };

  // Verificar função do usuário
  const checkUserRole = (role: 'tecnico' | 'administrador' | 'gestor'): boolean => {
    if (!user || !user.role) return false;
    
    // Se for administrador, tem acesso a tudo
    if (user.role === 'administrador') return true;
    
    // Se for gestor, tem acesso a tudo exceto funções exclusivas de administrador
    if (user.role === 'gestor' && role !== 'administrador') return true;
    
    // Caso contrário, verifica se a função é exatamente a mesma
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        checkUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
