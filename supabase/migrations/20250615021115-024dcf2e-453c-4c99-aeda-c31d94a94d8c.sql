
-- Limpar TODAS as políticas da tabela services
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.services;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'services'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP; 
END; 
$$;

-- Limpar TODAS as políticas da tabela service_technicians
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.service_technicians;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'service_technicians'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP; 
END; 
$$;

-- Recriar políticas SIMPLES para services (SEM RECURSÃO)
CREATE POLICY "services_admin_all"
ON public.services
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

CREATE POLICY "services_insert_auth"
ON public.services
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- Recriar políticas SIMPLES para service_technicians (SEM RECURSÃO)
CREATE POLICY "service_technicians_admin_all"
ON public.service_technicians
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

CREATE POLICY "service_technicians_view_own"
ON public.service_technicians
FOR SELECT TO authenticated
USING (technician_id = auth.uid());
