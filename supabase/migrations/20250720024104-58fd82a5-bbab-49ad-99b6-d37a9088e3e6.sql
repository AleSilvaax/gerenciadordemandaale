-- Corrigir políticas RLS para service_types (simplificar)

-- Remove políticas existentes
DROP POLICY IF EXISTS "Admins and managers can manage service types in their organizat" ON public.service_types;
DROP POLICY IF EXISTS "Users can view service types from same organization" ON public.service_types;

-- Criar políticas mais simples e funcionais
CREATE POLICY "Authenticated users can view all service types" 
ON public.service_types 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can manage service types" 
ON public.service_types 
FOR ALL 
TO authenticated
USING (
  public.get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text])
)
WITH CHECK (
  public.get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text])
);

-- Criar alguns tipos de serviço padrão se não existirem
INSERT INTO public.service_types (name, description, organization_id)
SELECT 'Vistoria', 'Vistoria técnica padrão', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.service_types WHERE name = 'Vistoria');

INSERT INTO public.service_types (name, description, organization_id)
SELECT 'Instalação', 'Instalação de equipamentos', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.service_types WHERE name = 'Instalação');

INSERT INTO public.service_types (name, description, organization_id)
SELECT 'Manutenção', 'Manutenção preventiva e corretiva', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.service_types WHERE name = 'Manutenção');