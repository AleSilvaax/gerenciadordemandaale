
import React, { createContext, useState, useContext, ReactNode } from "react";
import { UserProfile } from "@/services/userProfile";

// Mock user data
const mockUser: UserProfile = {
  id: "mock-user-id",
  name: "Usuário Demo",
  avatar: "",
  role: "administrador" // Give admin role to access everything
};

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
  const [user] = useState<UserProfile | null>(mockUser);
  const [loading] = useState(false);

  // Mock implementations of auth functions
  const signIn = async (): Promise<boolean> => {
    console.log("Mock sign in - success");
    return true;
  };

  const signUp = async (): Promise<boolean> => {
    console.log("Mock sign up - success");
    return true;
  };

  const signOut = async (): Promise<void> => {
    console.log("Mock sign out");
  };

  const updateProfile = async (): Promise<boolean> => {
    console.log("Mock update profile - success");
    return true;
  };

  // Always return true for role checks
  const checkUserRole = (): boolean => {
    return true;
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
