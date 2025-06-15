
-- Adicionar políticas para técnicos verem suas demandas
CREATE POLICY "services_technician_view"
ON public.services
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT service_id 
    FROM public.service_technicians 
    WHERE technician_id = auth.uid()
  )
);

-- Permitir técnicos verem suas atribuições
CREATE POLICY "service_technicians_view_assigned"
ON public.service_technicians
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

-- Permitir técnicos atualizarem status das suas demandas
CREATE POLICY "services_technician_update_status"
ON public.services
FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT service_id 
    FROM public.service_technicians 
    WHERE technician_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT service_id 
    FROM public.service_technicians 
    WHERE technician_id = auth.uid()
  )
);
