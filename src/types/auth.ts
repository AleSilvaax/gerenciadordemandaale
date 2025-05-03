
import { UserRole } from '@/types/serviceTypes';

export interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
  name?: string;
  avatar?: string;
  phone?: string;
  permissions?: string[];
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  inviteCode?: string;
  createTeam?: boolean;
  teamName?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterFormData) => Promise<boolean>;
  updateUser: (userData: Partial<AuthUser>) => Promise<boolean>;
  updateUserInfo: (userData: AuthUser) => void;
  hasPermission: (permission: string) => boolean;
}
