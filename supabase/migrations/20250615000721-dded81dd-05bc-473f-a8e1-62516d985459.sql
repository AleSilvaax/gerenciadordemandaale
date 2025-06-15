
-- Limpar absolutamente TODAS as policies da tabela antes de recriar
DROP POLICY IF EXISTS "Service technicians policy" ON public.service_technicians;
DROP POLICY IF EXISTS "Admins can manage service technicians" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores podem gerenciar atribuicoes da equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos podem ver proprias atribuicoes" ON public.service_technicians;
DROP POLICY IF EXISTS "Admins podem tudo" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores gerenciam atribuicoes da equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos veem proprias atribuicoes" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos inserem atribuicoes onde já têm acesso" ON public.service_technicians;

-- Políticas corretas e seguras para service_technicians
CREATE POLICY "Admins podem tudo" ON public.service_technicians
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'administrador')
  WITH CHECK (public.get_current_user_role() = 'administrador');

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

CREATE POLICY "Tecnicos veem proprias atribuicoes" ON public.service_technicians
  FOR SELECT TO authenticated
  USING (
    public.get_current_user_role() = 'tecnico'
    AND technician_id = auth.uid()
  );

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
