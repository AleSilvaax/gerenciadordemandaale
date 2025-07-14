
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser extends User {
  role?: string;
  name?: string;
  avatar?: string;
  team_id?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

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
      console.log('[AUTH] Buscando perfil do usuário:', userId);

      // Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar, team_id, organization_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[AUTH] Erro ao buscar perfil:', profileError);
        return null;
      }

      // Buscar role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('[AUTH] Erro ao buscar role:', roleError);
        return null;
      }

      const currentUser = session?.user;
      if (!currentUser) return null;

      return {
        ...currentUser,
        role: roleData.role,
        name: profile.name,
        avatar: profile.avatar,
        team_id: profile.team_id,
        organization_id: profile.organization_id,
      };
    } catch (error) {
      console.error('[AUTH] Erro geral ao buscar dados do usuário:', error);
      return null;
    }
  };

  const handleAuthChange = async (event: string, session: Session | null) => {
    console.log('[AUTH] Mudança de autenticação:', event, session?.user?.id);
    
    setSession(session);
    
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id);
      setUser(userProfile);
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Inicializando contexto de autenticação...');
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          const userProfile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setSession(currentSession);
            setUser(userProfile);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AUTH] Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
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

  const signOut = async () => {
    console.log('[AUTH] Fazendo logout...');
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
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
