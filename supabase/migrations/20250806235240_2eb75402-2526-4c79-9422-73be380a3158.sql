-- Atualizar política RLS para gestores verem demandas atribuídas aos técnicos de sua equipe
-- Primeiro, dropar a política existente para gestores
DROP POLICY IF EXISTS "Gestores podem ver demandas de sua equipe" ON public.services;

-- Criar nova política mais inteligente para gestores
CREATE POLICY "Gestores podem ver demandas de técnicos de sua equipe" 
ON public.services 
FOR SELECT 
USING (
  -- Condição original: gestor pode ver demandas da sua equipe
  (
    (get_effective_user_role() = 'gestor') 
    AND (team_id = get_current_user_team_id()) 
    AND (organization_id = get_user_organization_safe())
  )
  OR
  -- Nova condição: gestor pode ver demandas atribuídas a técnicos de sua equipe
  (
    (get_effective_user_role() = 'gestor') 
    AND EXISTS (
      SELECT 1 FROM service_technicians st
      JOIN profiles p ON st.technician_id = p.id
      JOIN teams t ON p.team_id = t.id
      WHERE st.service_id = services.id
      AND t.id = get_current_user_team_id()
      AND t.organization_id = get_user_organization_safe()
    )
  )
);