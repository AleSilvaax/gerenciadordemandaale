-- CORREÇÃO DAS POLÍTICAS RLS PARA TÉCNICOS
-- O problema é que técnicos estão vendo demandas não atribuídas na página inicial

-- Atualizar política de serviços para técnicos ser mais restritiva
DROP POLICY IF EXISTS "services_select_policy" ON public.services;

-- Nova política mais específica para leitura de serviços
CREATE POLICY "services_select_policy" ON public.services
FOR SELECT USING (
  -- Super admins veem tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins veem serviços da sua organização
  (
    public.get_effective_user_role() = 'administrador' 
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Gestores veem serviços de sua equipe E serviços atribuídos aos técnicos de sua equipe
  (
    public.get_effective_user_role() = 'gestor' 
    AND organization_id = public.get_user_organization_safe()
    AND (
      -- Serviços da própria equipe do gestor
      team_id = public.get_current_user_team_id()
      OR 
      -- Serviços criados pelo gestor
      created_by = auth.uid()
      OR
      -- Serviços atribuídos a técnicos da equipe do gestor
      EXISTS (
        SELECT 1 FROM public.service_technicians st
        JOIN public.profiles p ON st.technician_id = p.id
        WHERE st.service_id = services.id
        AND p.team_id = public.get_current_user_team_id()
      )
    )
  )
  OR
  -- TÉCNICOS: Apenas serviços EXPLICITAMENTE ATRIBUÍDOS a eles OU criados por eles
  (
    public.get_effective_user_role() = 'tecnico' 
    AND (
      -- Serviços criados pelo próprio técnico
      created_by = auth.uid()
      OR
      -- Serviços que foram EXPLICITAMENTE atribuídos ao técnico
      EXISTS (
        SELECT 1 FROM public.service_technicians st
        WHERE st.service_id = services.id 
        AND st.technician_id = auth.uid()
      )
    )
  )
  OR
  -- Outros usuários veem apenas serviços que criaram
  (
    public.get_effective_user_role() NOT IN ('super_admin', 'administrador', 'gestor', 'tecnico')
    AND created_by = auth.uid()
  )
);