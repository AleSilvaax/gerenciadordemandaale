-- FASE 1 E 2: Correções críticas nas políticas RLS

-- 1. CORREÇÃO CRÍTICA: Policy mais restritiva para técnicos visualizarem apenas suas demandas
DROP POLICY IF EXISTS "Técnicos podem ver suas demandas atribuídas" ON public.services;

CREATE POLICY "Técnicos podem ver apenas suas demandas atribuídas" 
ON public.services 
FOR SELECT 
USING (
  (get_current_user_role() = 'tecnico' AND is_technician_for_service(id) AND organization_id = get_user_organization_safe())
);

-- 2. CORREÇÃO: Permitir que gestores também possam gerenciar tipos de serviço e campos técnicos
DROP POLICY IF EXISTS "Gestão hierárquica de tipos de serviço" ON public.service_types;

CREATE POLICY "Gestão hierárquica de tipos de serviço" 
ON public.service_types 
FOR ALL 
USING (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND organization_id = get_current_user_organization_id())
) 
WITH CHECK (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND organization_id = get_current_user_organization_id())
);

DROP POLICY IF EXISTS "Gestão hierárquica de campos técnicos" ON public.technical_fields;

CREATE POLICY "Gestão hierárquica de campos técnicos" 
ON public.technical_fields 
FOR ALL 
USING (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND organization_id = get_current_user_organization_id())
) 
WITH CHECK (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND organization_id = get_current_user_organization_id())
);

-- 3. VERIFICAR se função is_technician_for_service está funcionando corretamente
-- (A função já existe, apenas comentário para verificação)