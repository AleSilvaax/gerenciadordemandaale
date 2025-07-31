-- Corrigir warnings de segurança: adicionar search_path às funções

-- 1. Corrigir função get_user_organization_role
CREATE OR REPLACE FUNCTION public.get_user_organization_role(target_user_id UUID, target_org_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    SELECT COALESCE(or_role.role, ur.role, 'tecnico')
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    LEFT JOIN public.organization_roles or_role ON (p.id = or_role.user_id AND or_role.organization_id = target_org_id AND or_role.is_active = true)
    WHERE p.id = target_user_id
    LIMIT 1;
$$;

-- 2. Corrigir função is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = COALESCE(check_user_id, auth.uid()) 
        AND role = 'super_admin'
    );
$$;

-- 3. Corrigir função is_organization_owner
CREATE OR REPLACE FUNCTION public.is_organization_owner(check_user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_roles 
        WHERE user_id = check_user_id 
        AND organization_id = org_id 
        AND role = 'owner' 
        AND is_active = true
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = check_user_id 
        AND role = 'super_admin'
    );
$$;

-- 4. Corrigir função get_effective_user_role
CREATE OR REPLACE FUNCTION public.get_effective_user_role(check_org_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    WITH user_roles_hierarchy AS (
        SELECT 
            CASE 
                WHEN ur.role = 'super_admin' THEN 'super_admin'
                WHEN or_role.role = 'owner' THEN 'owner'
                WHEN or_role.role IS NOT NULL THEN or_role.role
                ELSE COALESCE(ur.role, 'tecnico')
            END as effective_role
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON p.id = ur.user_id
        LEFT JOIN public.organization_roles or_role ON (
            p.id = or_role.user_id 
            AND or_role.organization_id = COALESCE(check_org_id, public.get_current_user_organization_id())
            AND or_role.is_active = true
        )
        WHERE p.id = auth.uid()
    )
    SELECT effective_role FROM user_roles_hierarchy LIMIT 1;
$$;

-- 5. Corrigir função setup_initial_hierarchy
CREATE OR REPLACE FUNCTION public.setup_initial_hierarchy()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    org_record RECORD;
    profile_record RECORD;
BEGIN
    -- Garantir que existe pelo menos uma organização padrão
    INSERT INTO public.organizations (id, name, slug, is_active)
    VALUES (default_org_id, 'Organização Padrão', 'organizacao-padrao', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Para cada organização, verificar se tem um owner
    FOR org_record IN SELECT * FROM public.organizations LOOP
        -- Se não tem owner, buscar o primeiro admin da organização
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_roles 
            WHERE organization_id = org_record.id AND role = 'owner'
        ) THEN
            -- Procurar primeiro administrador desta organização
            FOR profile_record IN 
                SELECT p.id 
                FROM public.profiles p 
                JOIN public.user_roles ur ON p.id = ur.user_id 
                WHERE p.organization_id = org_record.id 
                AND ur.role = 'administrador' 
                LIMIT 1 
            LOOP
                -- Fazer este admin ser owner da organização
                INSERT INTO public.organization_roles (user_id, organization_id, role, assigned_by)
                VALUES (profile_record.id, org_record.id, 'owner', profile_record.id)
                ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner';
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Configuração inicial da hierarquia concluída';
END;
$$;

-- 6. Corrigir função sync_organization_roles
CREATE OR REPLACE FUNCTION public.sync_organization_roles()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Quando um perfil é criado, criar role organizacional padrão
    IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL THEN
        INSERT INTO public.organization_roles (user_id, organization_id, role)
        VALUES (NEW.id, NEW.organization_id, 'tecnico')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
    
    -- Quando organização do perfil muda, atualizar roles
    IF TG_OP = 'UPDATE' AND OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
        -- Desativar role antiga se existir
        IF OLD.organization_id IS NOT NULL THEN
            UPDATE public.organization_roles 
            SET is_active = false 
            WHERE user_id = NEW.id AND organization_id = OLD.organization_id;
        END IF;
        
        -- Criar/ativar role na nova organização
        IF NEW.organization_id IS NOT NULL THEN
            INSERT INTO public.organization_roles (user_id, organization_id, role)
            VALUES (NEW.id, NEW.organization_id, 'tecnico')
            ON CONFLICT (user_id, organization_id) DO UPDATE SET is_active = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;