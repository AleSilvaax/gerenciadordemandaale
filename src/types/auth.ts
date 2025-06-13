
export type UserRole = 'tecnico' | 'gestor' | 'administrador';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterFormData) => Promise<boolean>;
  updateUser: (userData: Partial<AuthUser>) => Promise<boolean>;
  updateUserInfo: (userData: AuthUser) => void;
  hasPermission: (permission: string) => boolean;
  canAccessRoute?: (route: string) => boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}
