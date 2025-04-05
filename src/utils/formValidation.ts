
export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { valid: false, error: 'Email é obrigatório' };
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    return { valid: false, error: 'Email inválido' };
  }
  
  return { valid: true, error: null };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'A senha deve ter pelo menos 6 caracteres' };
  }
  
  return { valid: true, error: null };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não conferem' };
  }
  
  return { valid: true, error: null };
};

export const validateRequiredField = (value: string, fieldName: string): ValidationResult => {
  if (!value) {
    return { valid: false, error: `${fieldName} é obrigatório` };
  }
  
  return { valid: true, error: null };
};
