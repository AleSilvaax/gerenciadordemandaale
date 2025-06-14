
-- Permitir que usuários autenticados criem novos serviços usando o campo `created_by`
CREATE POLICY "Permitir que usuários logados criem novos serviços"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
