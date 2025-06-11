
-- Adicionar colunas ausentes na tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'Vistoria';

-- Atualizar registros existentes que podem ter valores NULL
UPDATE public.services 
SET 
  priority = COALESCE(priority, 'media'),
  service_type = COALESCE(service_type, 'Vistoria')
WHERE priority IS NULL OR service_type IS NULL;
