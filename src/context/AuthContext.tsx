
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTeamMembers, addTeamMember } from '@/services/api';
import { TeamMember } from '@/types/serviceTypes';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type UserRole = 'tecnico' | 'administrador' | 'gestor';

interface AuthContextType {
  user: TeamMember | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  isLoading: boolean;
  hasPermission: (permissionId: string) => boolean;
}

interface Permission {
  id: string;
  roles: string[];
}

const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: 'view_stats',
    roles: ['gestor', 'administrador']
  },
  {
    id: 'add_members',
    roles: ['administrador']
  },
  {
    id: 'manage_services',
    roles: ['tecnico', 'administrador', 'gestor']
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  // Load permissions and user from localStorage
  useEffect(() => {
    // Load or initialize permissions
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(parsedPermissions.reduce((acc: Record<string, string[]>, p: any) => {
          acc[p.id] = p.roles;
          return acc;
        }, {}));
      } catch (error) {
        console.error('Failed to parse permissions from localStorage:', error);
        // Initialize default permissions if parsing fails
        initializeDefaultPermissions();
      }
    } else {
      // Initialize default permissions if none exist
      initializeDefaultPermissions();
    }

    // Check for saved login session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const initializeDefaultPermissions = () => {
    localStorage.setItem('permissions', JSON.stringify(DEFAULT_PERMISSIONS));
    const permissionsMap = DEFAULT_PERMISSIONS.reduce((acc: Record<string, string[]>, p) => {
      acc[p.id] = p.roles;
      return acc;
    }, {});
    setPermissions(permissionsMap);
  };

  // Function to check if user passwords are stored
  const getUserPassword = async (email: string): Promise<string | null> => {
    const storedPasswords = localStorage.getItem('user_passwords');
    if (!storedPasswords) return null;
    
    try {
      const passwords = JSON.parse(storedPasswords);
      return passwords[email] || null;
    } catch (error) {
      console.error('Failed to parse passwords:', error);
      return null;
    }
  };

  // Function to store user passwords
  const storeUserPassword = async (email: string, password: string) => {
    const storedPasswords = localStorage.getItem('user_passwords');
    let passwords = {};
    
    if (storedPasswords) {
      try {
        passwords = JSON.parse(storedPasswords);
      } catch (error) {
        console.error('Failed to parse passwords:', error);
      }
    }
    
    passwords = { ...passwords, [email]: password };
    localStorage.setItem('user_passwords', JSON.stringify(passwords));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get team members from API
      const teamMembers = await getTeamMembers();
      const foundMember = teamMembers.find(member => 
        member.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (foundMember) {
        // Check stored password or use demo password
        const storedPassword = await getUserPassword(email.toLowerCase());
        
        if ((storedPassword && password === storedPassword) || password === '123456') {
          setUser(foundMember);
          localStorage.setItem('currentUser', JSON.stringify(foundMember));
          toast.success(`Bem-vindo, ${foundMember.name}!`);
          return true;
        } else {
          toast.error('Senha inválida');
          return false;
        }
      } else {
        toast.error('Email não encontrado');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if email is already in use
      const teamMembers = await getTeamMembers();
      const emailExists = teamMembers.some(member => 
        member.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExists) {
        toast.error('Este email já está em uso');
        return false;
      }
      
      // Create new team member
      const newMember = await addTeamMember({
        name,
        email,
        phone: '',
        role: role as UserRole,
        avatar: `/lovable-uploads/placeholder.svg` // Default avatar
      });
      
      // Store password
      await storeUserPassword(email.toLowerCase(), password);
      
      // Login user
      setUser(newMember);
      localStorage.setItem('currentUser', JSON.stringify(newMember));
      toast.success(`Conta criada com sucesso! Bem-vindo, ${newMember.name}!`);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao criar conta');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    toast.info('Sessão encerrada');
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!user || !user.role) return false;
    
    // If permissions aren't loaded yet or permission doesn't exist, deny access
    if (!permissions || !permissions[permissionId]) return false;
    
    // Check if user's role has this permission
    return permissions[permissionId].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
