// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AuthContextType, RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função otimizada para carregar perfil e papel de uma só vez
  const loadUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles ( role )
        `)
        .eq('id', authUser.id)
        .single();

      // Se o perfil não for encontrado de imediato, pode ser a race condition.
      // Tentamos novamente após um pequeno intervalo.
      if (error && error.code === 'PGRST116') {
        console.warn("Profile not found, retrying in 1.5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return loadUserProfile(authUser);
      }
      
      if (error) throw error;

      // Garante que existe um papel, ou assume 'tecnico' como fallback
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
      setUser(null);
    }
  };

  // useEffect simplificado para gerenciar o estado de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro no login", { description: error.message });
      return false;
    }
    toast.success("Login realizado com sucesso!");
    return true;
  };

  const register = async (userData: RegisterFormData): Promise<boolean> => {
    const { data: { user }, error } = await supabase.auth.signUp({
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
    if (!user) {
        toast.error("Erro no cadastro", { description: "Não foi possível criar o usuário." });
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
    if (user.role === 'gestor' && ['view_stats', 'add_members'].includes(permission)) return true;
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
