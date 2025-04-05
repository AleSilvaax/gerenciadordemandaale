
import { useState } from 'react';
import { ValidationResult } from '@/utils/formValidation';

type ValidatorFunction<T> = (values: T) => ValidationResult;

interface UseFormValidationProps<T> {
  initialValues: T;
  validators: Record<keyof T, ValidatorFunction<T>> | ValidatorFunction<T>;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<string, string | null>;
  error: string | null;
  setFieldValue: (field: keyof T, value: any) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validators
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);

  const setFieldValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field changes
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: null }));
      setError(null);
    }
  };

  const validateField = (field: keyof T): boolean => {
    let result: ValidationResult;
    
    if (typeof validators === 'function') {
      result = validators(values);
    } else {
      const validator = validators[field];
      if (!validator) return true;
      result = validator(values);
    }

    setErrors(prev => ({ ...prev, [field]: result.error }));
    
    if (result.error) {
      setError(result.error);
    }
    
    return result.valid;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string | null> = {};
    
    // Clear previous errors
    setError(null);
    
    // If validator is a single function
    if (typeof validators === 'function') {
      const result = validators(values);
      if (!result.valid) {
        setError(result.error);
        return false;
      }
      return true;
    }
    
    // If validators is a record of functions
    Object.keys(validators).forEach(key => {
      const field = key as keyof T;
      const validator = validators[field];
      if (!validator) return;
      
      const result = validator(values);
      
      if (!result.valid) {
        isValid = false;
        newErrors[key] = result.error;
        
        // Set the first error as the main error
        if (error === null) {
          setError(result.error);
        }
      } else {
        newErrors[key] = null;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setError(null);
  };

  return {
    values,
    errors,
    error,
    setFieldValue,
    validateField,
    validateForm,
    resetForm
  };
}
