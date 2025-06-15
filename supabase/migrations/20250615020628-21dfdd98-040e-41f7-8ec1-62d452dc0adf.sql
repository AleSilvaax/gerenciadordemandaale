
-- Remover todas as políticas problemáticas da tabela services
DROP POLICY IF EXISTS "Usuário autenticado pode criar demanda própria" ON public.services;
DROP POLICY IF EXISTS "Administrador tem acesso total" ON public.services;
DROP POLICY IF EXISTS "Gestor acessa demandas de seu time" ON public.services;
DROP POLICY IF EXISTS "Técnico acessa as suas próprias demandas" ON public.services;
DROP POLICY IF EXISTS "Técnico pode editar suas próprias demandas" ON public.services;
DROP POLICY IF EXISTS "Tecnicos podem ver demandas atribuídas" ON public.services;

-- Criar políticas simples e funcionais para services
CREATE POLICY "Administradores podem fazer tudo com services"
ON public.services
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

CREATE POLICY "Gestores podem gerenciar services de sua equipe"
ON public.services
FOR ALL TO authenticated
USING (
  public.get_current_user_role() = 'gestor'
  AND team_id = public.get_current_user_team_id()
)
WITH CHECK (
  public.get_current_user_role() = 'gestor'
  AND team_id = public.get_current_user_team_id()
);

CREATE POLICY "Tecnicos podem ver services atribuidos"
ON public.services
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'tecnico'
  AND id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

CREATE POLICY "Tecnicos podem editar services atribuidos"
ON public.services
FOR UPDATE TO authenticated
USING (
  public.get_current_user_role() = 'tecnico'
  AND id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
)
WITH CHECK (
  public.get_current_user_role() = 'tecnico'
  AND id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

-- Permitir que qualquer usuário autenticado crie demandas (necessário para o formulário funcionar)
CREATE POLICY "Usuarios autenticados podem criar services"
ON public.services
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
