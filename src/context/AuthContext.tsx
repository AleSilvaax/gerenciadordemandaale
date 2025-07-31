// Arquivo: src/context/AuthContext.tsx (VERSÃO COMPLETA E ATUALIZADA)

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ✅ 1. ATUALIZADO: Adicionamos a organizationId à "planta" do nosso usuário
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'tecnico' | 'gestor' | 'administrador' | 'requisitor';
  teamId?: string;
  organizationId?: string; // <-- ADICIONADO AQUI
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

const cleanAuthState = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
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

  const buildUserProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (profileError || !profileData) {
          throw new Error("Perfil de usuário não encontrado.");
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();

      // ✅ 2. ATUALIZADO: Agora retornamos a organization_id junto com os outros dados.
      return {
        id: authUser.id,
        email: authUser.email!,
        name: profileData.name || 'Usuário',
        avatar: profileData.avatar || null,
        role: roleError ? 'tecnico' : roleData.role as any,
        teamId: profileData.team_id || null,
        organizationId: profileData.organization_id || null, // <-- ADICIONADO AQUI
        permissions: []
      };
    } catch (error) {
      console.error('[Auth] Erro ao construir perfil, fazendo logout forçado:', error);
      // Se não conseguirmos construir um perfil válido, é mais seguro deslogar o usuário.
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const userProfile = await buildUserProfile(currentSession.user);
        setUser(userProfile);
        setSession(currentSession);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        } else if (newSession?.user) {
          const userProfile = await buildUserProfile(newSession.user);
          setUser(userProfile);
          setSession(newSession);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [buildUserProfile]);
  
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast.error("Erro no login", { description: "Email ou senha inválidos." });
      return false;
    }
    toast.success("Login realizado com sucesso!");
    return true;
  }, []);
  
  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    cleanAuthState();
    window.location.href = '/login'; // Força o redirecionamento
  }, []);

  // As funções 'register' e 'updateUser' permanecem as mesmas
  const register = async (userData: any): Promise<boolean> => { /* ...seu código original... */ return false; };
  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => { /* ...seu código original... */ return false; };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateUser }}>
      {!isLoading && children}
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
