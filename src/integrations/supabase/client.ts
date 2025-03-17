
import { createClient } from '@supabase/supabase-js';
import { Database } from './schema';

// Verificar e usar valores padrão para desenvolvimento se as variáveis de ambiente não estiverem definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dyefbzcbphkgyapwmzwm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZWZiemNicGhrZ3lhcHdtendtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMDczMjYsImV4cCI6MjA1Nzc4MzMyNn0.r2mCuEZEYnrTGa_HkkAQlEANCZ9Wseiyu-HS8kUIIuY';

// Verificar se temos valores válidos para criar o cliente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou Anon Key não estão definidos!');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
