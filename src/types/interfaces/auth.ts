
import { UserRole } from '@/types/serviceTypes';

export type { UserRole };

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
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
