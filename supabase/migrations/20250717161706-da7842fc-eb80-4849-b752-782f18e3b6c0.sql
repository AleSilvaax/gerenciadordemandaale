-- PARTE 1: Correção da migração anterior e refatoração completa

-- 1. Primeiro, obter um usuário existente para usar como created_by
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Buscar primeiro usuário existente
    SELECT id INTO existing_user_id 
    FROM auth.users 
    LIMIT 1;
    
    -- Se existe usuário, usar ele como created_by
    IF existing_user_id IS NOT NULL THEN
        INSERT INTO public.teams (id, name, invite_code, created_by, organization_id)
        VALUES 
          ('00000000-0000-0000-0000-000000000003'::uuid, 'Equipe Técnica', 'TECH001', existing_user_id, '00000000-0000-0000-0000-000000000001'::uuid),
          ('00000000-0000-0000-0000-000000000004'::uuid, 'Equipe Gestão', 'MGMT001', existing_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Se não há usuários, usar o primeiro admin da organização padrão
        SELECT created_by INTO existing_user_id 
        FROM public.teams 
        WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid
        LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            INSERT INTO public.teams (id, name, invite_code, created_by, organization_id)
            VALUES 
              ('00000000-0000-0000-0000-000000000003'::uuid, 'Equipe Técnica', 'TECH001', existing_user_id, '00000000-0000-0000-0000-000000000001'::uuid),
              ('00000000-0000-0000-0000-000000000004'::uuid, 'Equipe Gestão', 'MGMT001', existing_user_id, '00000000-0000-0000-0000-000000000001'::uuid)
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- 2. Função otimizada para buscar dados do usuário (para resolver loading infinito)
CREATE OR REPLACE FUNCTION public.get_user_complete_profile(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    avatar TEXT,
    team_id UUID,
    team_name TEXT,
    organization_id UUID,
    role TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        p.id,
        p.name,
        p.avatar,
        p.team_id,
        t.name as team_name,
        p.organization_id,
        ur.role
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = user_uuid;
$$;

-- 3. Simplificar ainda mais as políticas para evitar recursão
-- Teams
DROP POLICY IF EXISTS "Admins can manage teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams from same organization" ON public.teams;

CREATE POLICY "teams_select_all"
ON public.teams FOR SELECT TO authenticated
USING (true);

CREATE POLICY "teams_admin_manage"
ON public.teams FOR ALL TO authenticated
USING (get_current_user_role() = 'administrador')
WITH CHECK (get_current_user_role() = 'administrador');

-- Services - simplificar
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
DROP POLICY IF EXISTS "Anyone can create services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Technicians can update assigned services" ON public.services;

CREATE POLICY "services_select_all"
ON public.services FOR SELECT TO authenticated
USING (true);

CREATE POLICY "services_insert_all"
ON public.services FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "services_update_admin"
ON public.services FOR UPDATE TO authenticated
USING (get_current_user_role() = 'administrador')
WITH CHECK (get_current_user_role() = 'administrador');

CREATE POLICY "services_update_assigned"
ON public.services FOR UPDATE TO authenticated
USING (
    id IN (
        SELECT service_id 
        FROM service_technicians 
        WHERE technician_id = auth.uid()
    )
)
WITH CHECK (
    id IN (
        SELECT service_id 
        FROM service_technicians 
        WHERE technician_id = auth.uid()
    )
);