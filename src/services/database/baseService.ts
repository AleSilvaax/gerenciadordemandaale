
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

// Export supabase client for use in other service modules
export { supabase };

// Common error handling function for database operations
export const handleDatabaseError = (error: any, message: string): never => {
  console.error(message, error);
  toast.error(message);
  throw error;
};
