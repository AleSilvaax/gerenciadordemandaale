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
      setUser(null); // Se não conseguir carregar o perfil, desloga o usuário
    }
  }, []);

  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      setIsLoading(true);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    
    // Pega a sessão inicial
    supabase.auth.getSession().then(({ data: { session }}) => {
      handleAuthStateChange("INITIAL_SESSION", session);
    });

    // Escuta por futuras mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Função de login simplificada: ela apenas tenta o login. O useEffect cuidará do resto.
  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro no login", { description: error.message });
      return false;
    }
    // Não precisa mais do toast de sucesso aqui, pois o usuário ainda não está "pronto".
    return true;
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          team_id: userData.team_id
        }
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
    await supabase.auth.signOut();
    setUser(null);
  };
  
  // As outras funções permanecem iguais...
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
