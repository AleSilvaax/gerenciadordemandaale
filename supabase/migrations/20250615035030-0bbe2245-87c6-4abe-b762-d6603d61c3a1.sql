
-- Adicionar campo feedback na tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS feedback JSONB;

-- Remover políticas existentes se houver e recriar
DROP POLICY IF EXISTS "service_messages_admin_all" ON public.service_messages;
DROP POLICY IF EXISTS "service_messages_view_assigned" ON public.service_messages;
DROP POLICY IF EXISTS "service_messages_insert_auth" ON public.service_messages;

-- Habilitar RLS na tabela se não estiver habilitado
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para service_messages
CREATE POLICY "service_messages_admin_all"
ON public.service_messages
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

CREATE POLICY "service_messages_view_assigned"
ON public.service_messages
FOR SELECT TO authenticated
USING (
  service_id IN (
    SELECT id FROM public.services 
    WHERE created_by = auth.uid() 
    OR id IN (
      SELECT service_id FROM public.service_technicians 
      WHERE technician_id = auth.uid()
    )
  )
);

CREATE POLICY "service_messages_insert_auth"
ON public.service_messages
FOR INSERT TO authenticated
WITH CHECK (
  service_id IN (
    SELECT id FROM public.services 
    WHERE created_by = auth.uid() 
    OR id IN (
      SELECT service_id FROM public.service_technicians 
      WHERE technician_id = auth.uid()
    )
  )
);

-- Garantir que os índices existam para performance
CREATE INDEX IF NOT EXISTS idx_service_messages_service_id ON public.service_messages(service_id);
CREATE INDEX IF NOT EXISTS idx_service_technicians_service_id ON public.service_technicians(service_id);
CREATE INDEX IF NOT EXISTS idx_service_technicians_technician_id ON public.service_technicians(technician_id);
