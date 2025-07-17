-- PARTE 1: Correção completa - garantir estrutura básica existe

-- 1. Primeiro garantir que organização padrão existe
INSERT INTO public.organizations (id, name, slug, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Organização Padrão',
  'organizacao-padrao',
  '{}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active;

-- 2. Garantir equipe padrão existe
INSERT INTO public.teams (id, name, invite_code, created_by, organization_id)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Equipe Padrão',
  'DEFAULT123',
  (SELECT id FROM auth.users LIMIT 1), -- Usar primeiro usuário existente
  '00000000-0000-0000-0000-000000000001'::uuid
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization_id = EXCLUDED.organization_id;

-- 3. Função otimizada para buscar dados do usuário (resolver loading infinito)
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
        COALESCE(t.name, 'Sem Equipe') as team_name,
        COALESCE(p.organization_id, '00000000-0000-0000-0000-000000000001'::uuid) as organization_id,
        COALESCE(ur.role, 'tecnico') as role
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = user_uuid;
$$;

-- 4. Simplificar políticas RLS para evitar conflitos e recursão
-- Teams
DROP POLICY IF EXISTS "Admins can manage teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams from same organization" ON public.teams;
DROP POLICY IF EXISTS "teams_select_all" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_manage" ON public.teams;

CREATE POLICY "teams_all_authenticated"
ON public.teams FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Services
DROP POLICY IF EXISTS "services_select_all" ON public.services;
DROP POLICY IF EXISTS "services_insert_all" ON public.services;
DROP POLICY IF EXISTS "services_update_admin" ON public.services;
DROP POLICY IF EXISTS "services_update_assigned" ON public.services;

CREATE POLICY "services_all_authenticated"
ON public.services FOR ALL TO authenticated
USING (true)
WITH CHECK (true);