-- Fix RLS policies for services table to resolve visibility issues

-- Drop all existing problematic policies on services
DROP POLICY IF EXISTS "Criadores podem atualizar suas demandas" ON services;
DROP POLICY IF EXISTS "Criadores veem suas próprias demandas" ON services;
DROP POLICY IF EXISTS "Gestores e admins veem demandas da organização" ON services;
DROP POLICY IF EXISTS "Gestores podem atualizar demandas da organização" ON services;
DROP POLICY IF EXISTS "Super admins veem todas as demandas" ON services;
DROP POLICY IF EXISTS "Técnicos podem atualizar demandas atribuídas" ON services;
DROP POLICY IF EXISTS "Técnicos veem apenas demandas atribuídas" ON services;
DROP POLICY IF EXISTS "services_delete_simple" ON services;
DROP POLICY IF EXISTS "services_insert_simple" ON services;

-- Drop all existing policies on service_technicians
DROP POLICY IF EXISTS "Gestores podem gerenciar técnicos em demandas da organização" ON service_technicians;
DROP POLICY IF EXISTS "service_technicians_select_simple" ON service_technicians;

-- Add default value for organization_id in services for robustness
ALTER TABLE services ALTER COLUMN organization_id SET DEFAULT get_current_user_organization_id();

-- Create new unified policies for services table
CREATE POLICY "services_select_unified" ON services
FOR SELECT
USING (
  -- Creators can see their own demands
  (auth.uid() = created_by) OR
  -- Managers/admins/owners can see organization demands
  ((get_current_user_role() = ANY (ARRAY['gestor'::text, 'administrador'::text, 'owner'::text, 'super_admin'::text])) 
   AND (organization_id = get_current_user_organization_id())) OR
  -- Technicians can see assigned demands
  ((get_current_user_role() = 'tecnico'::text) AND 
   (EXISTS (SELECT 1 FROM service_technicians st WHERE st.service_id = services.id AND st.technician_id = auth.uid())))
);

CREATE POLICY "services_insert_unified" ON services
FOR INSERT
WITH CHECK (
  (auth.uid() = created_by) AND 
  (organization_id = get_current_user_organization_id())
);

CREATE POLICY "services_update_unified" ON services
FOR UPDATE
USING (
  -- Creators can update their demands
  (auth.uid() = created_by) OR
  -- Managers/admins/owners can update organization demands
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (organization_id = get_current_user_organization_id())) OR
  -- Technicians can update assigned demands
  ((get_current_user_role() = 'tecnico'::text) AND 
   (EXISTS (SELECT 1 FROM service_technicians st WHERE st.service_id = services.id AND st.technician_id = auth.uid())))
)
WITH CHECK (
  -- Same conditions for updates
  (auth.uid() = created_by) OR
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (organization_id = get_current_user_organization_id())) OR
  ((get_current_user_role() = 'tecnico'::text) AND 
   (EXISTS (SELECT 1 FROM service_technicians st WHERE st.service_id = services.id AND st.technician_id = auth.uid())))
);

CREATE POLICY "services_delete_unified" ON services
FOR DELETE
USING (
  (auth.uid() = created_by) OR 
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'super_admin'::text, 'owner'::text]))
);

-- Create new policies for service_technicians table
CREATE POLICY "service_technicians_select_unified" ON service_technicians
FOR SELECT
USING (
  -- Anyone authenticated can view technician assignments (needed for proper functioning)
  auth.uid() IS NOT NULL
);

CREATE POLICY "service_technicians_insert_unified" ON service_technicians
FOR INSERT
WITH CHECK (
  -- Managers/admins/owners can assign technicians to organization services
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.organization_id = get_current_user_organization_id()))) OR
  -- Service creators can self-assign (only themselves)
  ((EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.created_by = auth.uid())) 
   AND (technician_id = auth.uid()))
);

CREATE POLICY "service_technicians_update_unified" ON service_technicians
FOR UPDATE
USING (
  -- Managers/admins/owners can manage technician assignments
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.organization_id = get_current_user_organization_id())))
)
WITH CHECK (
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.organization_id = get_current_user_organization_id())))
);

CREATE POLICY "service_technicians_delete_unified" ON service_technicians
FOR DELETE
USING (
  -- Managers/admins/owners can remove technician assignments
  ((get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text, 'owner'::text, 'super_admin'::text])) 
   AND (EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.organization_id = get_current_user_organization_id()))) OR
  -- Service creators can remove their own assignment
  ((EXISTS (SELECT 1 FROM services s WHERE s.id = service_technicians.service_id AND s.created_by = auth.uid())) 
   AND (technician_id = auth.uid()))
);