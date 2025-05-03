
import { UserRole } from '@/types/serviceTypes';

export type { UserRole };

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  createTeam?: boolean;
  teamName?: string;
  inviteCode?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  user?: any;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
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
  updateUserInfo: (user: AuthUser) => void;
  hasPermission: (permission: string) => boolean;
}
