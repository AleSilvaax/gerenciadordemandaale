
-- Remover policies antigas
DROP POLICY IF EXISTS "Admins podem tudo" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores gerenciam atribuicoes da equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos veem proprias atribuicoes" ON public.service_technicians;
DROP POLICY IF EXISTS "Tecnicos inserem atribuicoes onde já têm acesso" ON public.service_technicians;

-- Criar apenas as 3 policies corretas:

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
