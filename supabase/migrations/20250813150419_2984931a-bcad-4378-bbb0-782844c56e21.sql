-- Fix security vulnerability: Restrict access to report_data table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all users to delete report_data" ON public.report_data;
DROP POLICY IF EXISTS "Allow all users to insert report_data" ON public.report_data;
DROP POLICY IF EXISTS "Allow all users to select report_data" ON public.report_data;
DROP POLICY IF EXISTS "Allow all users to update report_data" ON public.report_data;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.report_data;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.report_data;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.report_data;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.report_data;

-- Create secure RLS policies based on organization membership and user roles

-- Super admins can access all report data
CREATE POLICY "Super admins can manage all report data"
ON public.report_data
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Organization admins and managers can access report data for services in their organization
CREATE POLICY "Org admins can manage org report data"
ON public.report_data
FOR ALL
TO authenticated
USING (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = report_data.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = report_data.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
);

-- Technicians can only access report data for services they are assigned to
CREATE POLICY "Technicians can access assigned service report data"
ON public.report_data
FOR SELECT
TO authenticated
USING (
  (get_current_user_role() = 'tecnico')
  AND EXISTS (
    SELECT 1 FROM public.service_technicians st
    JOIN public.services s ON st.service_id = s.id
    WHERE st.service_id = report_data.service_id
    AND st.technician_id = auth.uid()
  )
);

-- Technicians can update report data for services they are assigned to
CREATE POLICY "Technicians can update assigned service report data"
ON public.report_data
FOR UPDATE
TO authenticated
USING (
  (get_current_user_role() = 'tecnico')
  AND EXISTS (
    SELECT 1 FROM public.service_technicians st
    JOIN public.services s ON st.service_id = s.id
    WHERE st.service_id = report_data.service_id
    AND st.technician_id = auth.uid()
  )
);

-- Service creators can access report data for services they created
CREATE POLICY "Service creators can access their service report data"
ON public.report_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = report_data.service_id 
    AND s.created_by = auth.uid()
  )
);

-- Only authorized users can insert report data (admins, managers, assigned technicians)
CREATE POLICY "Authorized users can insert report data"
ON public.report_data
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin() 
  OR (
    (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']))
    AND EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = report_data.service_id 
      AND s.organization_id = get_current_user_organization_id()
    )
  )
  OR (
    (get_current_user_role() = 'tecnico')
    AND EXISTS (
      SELECT 1 FROM public.service_technicians st
      WHERE st.service_id = report_data.service_id
      AND st.technician_id = auth.uid()
    )
  )
);