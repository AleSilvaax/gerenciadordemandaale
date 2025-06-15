
-- Garante que técnicos possam visualizar qualquer demanda vinculada a eles via `service_technicians`
CREATE POLICY "Tecnicos podem ver demandas atribuídas"
ON public.services
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'tecnico'
  AND id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

-- Outras políticas não serão alteradas neste momento.
