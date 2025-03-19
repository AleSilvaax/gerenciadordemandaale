
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { UserProfile, getCurrentUserProfile, updateUserProfile } from "@/services/userProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  loading: false,
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

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        // Try to load user from session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const profile = await getCurrentUserProfile();
          if (profile) {
            setUser(profile);
          } else {
            // Mock user for development
            setUser({
              id: "mock-user-id",
              name: "Usuário Demo",
              avatar: "",
              role: "administrador" // Give admin role for development
            });
          }
        } else {
          // Mock user for development
          setUser({
            id: "mock-user-id",
            name: "Usuário Demo",
            avatar: "",
            role: "administrador" // Give admin role for development
          });
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Mock user for development
        setUser({
          id: "mock-user-id",
          name: "Usuário Demo",
          avatar: "",
          role: "administrador" // Give admin role for development
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      const profile = await getCurrentUserProfile();
      
      if (profile) {
        setUser(profile);
        return true;
      } else {
        toast.error("Perfil de usuário não encontrado");
        return false;
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(error.message || "Erro ao fazer login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("Registro realizado com sucesso! Verifique seu email para confirmar.");
      return true;
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "Erro ao registrar usuário");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await updateUserProfile(user.id, data);
      
      if (success) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
      
      return success;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  // Development version for now - always returns true
  const checkUserRole = (role: 'tecnico' | 'administrador' | 'gestor'): boolean => {
    // For development, always return true
    return true;
    
    // In production, use this:
    // return user?.role === role || user?.role === 'administrador';
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
