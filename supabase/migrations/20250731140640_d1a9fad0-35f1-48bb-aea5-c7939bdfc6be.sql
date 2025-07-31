-- Corrigir recursão infinita nas políticas RLS

-- Primeiro, remover todas as políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Técnicos podem ver APENAS suas próprias demandas" ON public.services;
DROP POLICY IF EXISTS "Acesso de leitura a atribuições dentro da organização" ON public.service_technicians;
DROP POLICY IF EXISTS "Técnicos podem ver suas atribuições" ON public.service_technicians;

-- Criar função segura para verificar se usuário é técnico de uma demanda
CREATE OR REPLACE FUNCTION public.is_technician_for_service(service_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.service_technicians 
    WHERE service_id = service_uuid 
    AND technician_id = auth.uid()
  );
$$;

-- Criar função segura para verificar organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid) 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Recriar políticas sem recursão para services
CREATE POLICY "Administradores podem ver todas as demandas da organização" 
ON public.services 
FOR SELECT 
USING (
  get_current_user_role() = 'administrador' 
  AND organization_id = get_user_organization_safe()
);

CREATE POLICY "Gestores podem ver demandas de sua equipe" 
ON public.services 
FOR SELECT 
USING (
  get_current_user_role() = 'gestor' 
  AND team_id = get_current_user_team_id()
  AND organization_id = get_user_organization_safe()
);

CREATE POLICY "Técnicos podem ver suas demandas atribuídas" 
ON public.services 
FOR SELECT 
USING (
  get_current_user_role() = 'tecnico' 
  AND is_technician_for_service(id)
  AND organization_id = get_user_organization_safe()
);

-- Recriar políticas para service_technicians sem recursão
CREATE POLICY "Admins e gestores podem gerenciar atribuições organizacionais" 
ON public.service_technicians 
FOR ALL 
USING (
  get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text])
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_technicians.service_id 
    AND s.organization_id = get_user_organization_safe()
  )
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text])
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_technicians.service_id 
    AND s.organization_id = get_user_organization_safe()
  )
);

CREATE POLICY "Técnicos podem ver suas próprias atribuições" 
ON public.service_technicians 
FOR SELECT 
USING (technician_id = auth.uid());

-- Corrigir as funções com search_path para evitar warnings de segurança
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(role, 'tecnico') FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid) 
  INTO org_id 
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN org_id;
END;
$$;