
-- Permitir que usuários autenticados possam atribuir técnicos a demandas da sua equipe ou onde têm acesso

-- Remover políticas antigas conflitantes se existirem
DROP POLICY IF EXISTS "Service technicians policy" ON public.service_technicians;
DROP POLICY IF EXISTS "Admins can manage service technicians" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores podem gerenciar atribuicoes da equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos podem ver proprias atribuicoes" ON public.service_technicians;

-- Admin pode tudo
CREATE POLICY "Admins podem tudo" ON public.service_technicians
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'administrador')
  WITH CHECK (public.get_current_user_role() = 'administrador');

-- Gestores podem gerenciar demandas da equipe (inserir/atribuir/editar)
CREATE POLICY "Gestores gerenciam atribuicoes da equipe" ON public.service_technicians
  FOR ALL TO authenticated
  USING (
    public.get_current_user_role() = 'gestor'
    AND (
      service_id IN (
        SELECT id FROM public.services 
        WHERE team_id = public.get_current_user_team_id()
      )
    )
  )
  WITH CHECK (
    public.get_current_user_role() = 'gestor'
    AND (
      service_id IN (
        SELECT id FROM public.services 
        WHERE team_id = public.get_current_user_team_id()
      )
    )
  );

-- Técnicos podem ver suas atribuições
CREATE POLICY "Tecnicos veem proprias atribuicoes" ON public.service_technicians
  FOR SELECT TO authenticated
  USING (
    public.get_current_user_role() = 'tecnico'
    AND technician_id = auth.uid()
  );

-- Técnicos podem inserir atribuições em serviços a que possuem acesso (casos de autoatribuição)
CREATE POLICY "Tecnicos inserem atribuicoes onde já têm acesso" ON public.service_technicians
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_current_user_role() = 'tecnico'
    AND (
      service_id IN (
        SELECT id FROM public.services 
        WHERE id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
      )
    )
  );
