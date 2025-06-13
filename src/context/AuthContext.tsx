// src/context/AuthContext.tsx - VERSÃO FINAL (CORRIGE LOGIN INFINITO)

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

      if (error) throw error;

      const role = data?.user_roles?.[0]?.role || 'tecnico';
      const authUserData: AuthUser = {
        id: data.id,
        email: authUser.email,
        name: data.name || 'Usuário',
        avatar: data.avatar || '',
        team_id: data.team_id,
        role: role as any,
        permissions: []
      };
      setUser(authUserData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null); // Desloga o usuário se não conseguir carregar o perfil completo
    }
  }, []);

  useEffect(() => {
    // Função única para lidar com mudanças de autenticação
    const handleAuthChange = async (event: string, session: Session | null) => {
      setIsLoading(true);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    // Verifica a sessão inicial quando o app carrega
    supabase.auth.getSession().then(({ data: { session }}) => {
        handleAuthChange("INITIAL_SESSION", session);
    });

    // Escuta por futuras mudanças (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Limpa a inscrição quando o componente é desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Função de login simplificada - ela SÓ tenta fazer o login
  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro no login", { description: error.message });
      return false;
    }
    // O useEffect vai cuidar do resto (loading, carregar perfil, etc.)
    return true;
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: { name: userData.name, role: userData.role, team_id: userData.team_id } }
    });
    if (error) {
      toast.error("Erro no cadastro", { description: error.message });
      return false;
    }
    toast.success("Cadastro realizado!", { description: "Verifique seu email para confirmar a conta." });
    return true;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update({ name: userData.name, avatar: userData.avatar }).eq('id', user.id);
    if (error) return false;
    setUser(prev => prev ? { ...prev, ...userData } : null);
    return true;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'administrador') return true;
    if (user.role === 'gestor') return ['view_stats', 'add_members'].includes(permission);
    return false;
  };

  const value = { user, isLoading, isAuthenticated: !!user, login, logout, register, updateUser, updateUserInfo: setUser, hasPermission };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
