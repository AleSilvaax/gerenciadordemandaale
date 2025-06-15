
-- Remove a política conflitante que está causando recursão infinita
DROP POLICY IF EXISTS "Tecnicos podem ver proprias atribuicoes" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores podem gerenciar atribuicoes da equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Admins can manage service technicians" ON public.service_technicians;

-- Cria uma política simples e direta para técnicos verem suas atribuições
CREATE POLICY "Tecnicos podem ver suas atribuicoes"
ON public.service_technicians
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

-- Permite que gestores e admins vejam todas as atribuições
CREATE POLICY "Gestores e admins podem ver atribuicoes"
ON public.service_technicians
FOR ALL TO authenticated
USING (
  public.get_current_user_role() IN ('gestor', 'administrador')
)
WITH CHECK (
  public.get_current_user_role() IN ('gestor', 'administrador')
);
