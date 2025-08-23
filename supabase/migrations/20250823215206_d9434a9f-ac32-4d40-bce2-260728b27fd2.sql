-- Add must_change_password column to profiles
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean DEFAULT false;

-- Update RLS policies for user_roles table
DROP POLICY IF EXISTS "Permitir criação de role durante registro" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios podem ver todos os roles" ON public.user_roles;

-- Allow super admins and org admins to manage user roles
CREATE POLICY "Super admins podem gerenciar todos os roles" 
ON public.user_roles 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Org admins podem gerenciar roles da organização" 
ON public.user_roles 
FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text])) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_roles.user_id 
    AND p.organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text])) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_roles.user_id 
    AND p.organization_id = get_current_user_organization_id()
  )
);

-- Allow users to see all roles (for display purposes)
CREATE POLICY "Usuários podem ver todos os roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

-- Allow profile creation during registration
CREATE POLICY "Permitir criação de role durante registro" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  ((auth.uid() = user_id) AND (NOT (EXISTS ( 
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()
  )))) OR is_super_admin()
);

-- Update RLS policies for teams table  
DROP POLICY IF EXISTS "teams_all_authenticated" ON public.teams;
DROP POLICY IF EXISTS "Acesso de leitura a equipes apenas dentro da própria organiza" ON public.teams;

-- Teams policies
CREATE POLICY "Super admins podem gerenciar todas as equipes" 
ON public.teams 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Usuários podem ver equipes da organização" 
ON public.teams 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins podem gerenciar equipes da organização" 
ON public.teams 
FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text, 'gestor'::text])) 
  AND (organization_id = get_current_user_organization_id())
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text, 'gestor'::text])) 
  AND (organization_id = get_current_user_organization_id())
);

-- Update RLS policies for organizations table
CREATE POLICY "Owners podem editar sua organização" 
ON public.organizations 
FOR UPDATE 
USING (
  (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text])) 
  AND (id = get_current_user_organization_id())
);

-- Create helper function for admin user creation
CREATE OR REPLACE FUNCTION public.can_manage_user_in_organization(target_user_id uuid, target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    is_super_admin() OR 
    (
      (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text])) 
      AND (get_current_user_organization_id() = target_org_id)
    );
$$;