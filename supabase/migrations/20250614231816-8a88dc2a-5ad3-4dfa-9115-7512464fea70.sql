
-- Remover políticas problemáticas da tabela services
DROP POLICY IF EXISTS "Admins têm acesso total aos serviços" ON public.services;
DROP POLICY IF EXISTS "Gestores gerenciam serviços da sua equipe" ON public.services;
DROP POLICY IF EXISTS "Técnicos podem ver serviços atribuídos" ON public.services;
DROP POLICY IF EXISTS "Técnicos podem atualizar serviços atribuídos" ON public.services;
DROP POLICY IF EXISTS "Permitir que usuários logados criem novos serviços" ON public.services;

-- Habilitar RLS (apenas reforçando)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer usuário autenticado crie demandas SE created_by = auth.uid()
CREATE POLICY "Usuário autenticado pode criar demanda própria"
  ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Administrador pode fazer tudo
CREATE POLICY "Administrador tem acesso total"
  ON public.services
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'administrador')
  WITH CHECK (public.get_current_user_role() = 'administrador');

-- Gestor pode acessar e editar apenas demandas do seu time
CREATE POLICY "Gestor acessa demandas de seu time"
  ON public.services
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'gestor' AND public.get_current_user_team_id() = team_id)
  WITH CHECK (public.get_current_user_role() = 'gestor' AND public.get_current_user_team_id() = team_id);

-- Técnico pode visualizar/editar apenas demandas criadas por ele mesmo
CREATE POLICY "Técnico acessa as suas próprias demandas"
  ON public.services
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'tecnico' AND created_by = auth.uid());

CREATE POLICY "Técnico pode editar suas próprias demandas"
  ON public.services
  FOR UPDATE TO authenticated
  USING (public.get_current_user_role() = 'tecnico' AND created_by = auth.uid())
  WITH CHECK (public.get_current_user_role() = 'tecnico' AND created_by = auth.uid());

-- Políticas básicas de fallback (apenas se necessário)
-- Caso queria liberar leitura para todos autenticados:
-- CREATE POLICY "Qualquer autenticado pode listar demandas" ON public.services FOR SELECT TO authenticated USING (true);
