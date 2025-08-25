-- CRITICAL SECURITY FIXES

-- 1. Fix services table RLS - restrict updates to authorized users only
DROP POLICY IF EXISTS "services_update_simple" ON public.services;
CREATE POLICY "Criadores podem atualizar suas demandas" 
ON public.services 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Gestores podem atualizar demandas da organização" 
ON public.services 
FOR UPDATE 
USING (
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
  AND (organization_id = get_current_user_organization_id())
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
  AND (organization_id = get_current_user_organization_id())
);

CREATE POLICY "Técnicos podem atualizar demandas atribuídas" 
ON public.services 
FOR UPDATE 
USING (
  (get_current_user_role() = 'tecnico'::text) 
  AND (EXISTS (
    SELECT 1 FROM service_technicians st 
    WHERE st.service_id = services.id 
    AND st.technician_id = auth.uid()
  ))
)
WITH CHECK (
  (get_current_user_role() = 'tecnico'::text) 
  AND (EXISTS (
    SELECT 1 FROM service_technicians st 
    WHERE st.service_id = services.id 
    AND st.technician_id = auth.uid()
  ))
);

-- 2. Fix service_photos RLS - prevent unauthorized access
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fotos" ON public.service_photos;
CREATE POLICY "Criadores podem inserir fotos em suas demandas" 
ON public.service_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM services s 
    WHERE s.id = service_photos.service_id 
    AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Técnicos podem inserir fotos em demandas atribuídas" 
ON public.service_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_technicians st 
    WHERE st.service_id = service_photos.service_id 
    AND st.technician_id = auth.uid()
  )
);

-- 3. Fix service_technicians RLS - restrict to organization context
DROP POLICY IF EXISTS "service_technicians_insert_simple" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_update_simple" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_delete_simple" ON public.service_technicians;

CREATE POLICY "Gestores podem gerenciar técnicos em demandas da organização" 
ON public.service_technicians 
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
  AND EXISTS (
    SELECT 1 FROM services s 
    WHERE s.id = service_technicians.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
  AND EXISTS (
    SELECT 1 FROM services s 
    WHERE s.id = service_technicians.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
);

-- 4. Fix user_roles SELECT policy - restrict to organization members only
DROP POLICY IF EXISTS "Usuários podem ver todos os roles" ON public.user_roles;
CREATE POLICY "Usuários podem ver roles da organização" 
ON public.user_roles 
FOR SELECT 
USING (
  -- Own role
  (user_id = auth.uid())
  OR
  -- Same organization members (for admins/managers)
  (
    (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
    AND EXISTS (
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = user_roles.user_id 
      AND p1.organization_id = p2.organization_id
    )
  )
);

-- 5. Remove insecure SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.get_service_messages();

-- 6. Make service-photos storage bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'service-photos';

-- 7. Create storage policies for private service-photos bucket
CREATE POLICY "Criadores podem ver fotos de suas demandas" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'service-photos' 
  AND EXISTS (
    SELECT 1 FROM service_photos sp, services s 
    WHERE sp.photo_url LIKE '%' || name || '%' 
    AND sp.service_id = s.id 
    AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Técnicos podem ver fotos de demandas atribuídas" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'service-photos' 
  AND EXISTS (
    SELECT 1 FROM service_photos sp, service_technicians st 
    WHERE sp.photo_url LIKE '%' || name || '%' 
    AND sp.service_id = st.service_id 
    AND st.technician_id = auth.uid()
  )
);

CREATE POLICY "Gestores podem ver fotos da organização" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'service-photos' 
  AND (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text]))
  AND EXISTS (
    SELECT 1 FROM service_photos sp, services s 
    WHERE sp.photo_url LIKE '%' || name || '%' 
    AND sp.service_id = s.id 
    AND s.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Usuários autorizados podem fazer upload de fotos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-photos' 
  AND auth.uid() IS NOT NULL
);