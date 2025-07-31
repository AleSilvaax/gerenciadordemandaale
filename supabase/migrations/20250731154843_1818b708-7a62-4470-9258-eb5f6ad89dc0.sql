-- FASE 1: Expansão da Hierarquia de Roles e Multi-empresa

-- 1. Primeiro, vamos expandir os tipos de roles para incluir super_admin e owner
-- Atualizar o enum user_role se ele existir, ou criar se não existir
DO $$ 
BEGIN
    -- Verificar se o tipo já existe e adicionar novos valores
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Adicionar novos roles se não existirem
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar se já existir
        END;
        
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'owner';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar se já existir
        END;
    ELSE
        -- Criar o tipo se não existir
        CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'administrador', 'gestor', 'tecnico', 'requisitor');
    END IF;
END $$;

-- 2. Criar tabela organization_roles para roles específicos por organização
CREATE TABLE IF NOT EXISTS public.organization_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'tecnico',
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Habilitar RLS na tabela organization_roles
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;

-- 3. Atualizar a tabela user_roles para usar o novo enum (se necessário)
-- Verificar se a coluna role precisa ser alterada
DO $$
BEGIN
    -- Tentar alterar o tipo da coluna role
    BEGIN
        ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;
    EXCEPTION WHEN others THEN
        -- Se der erro, a coluna provavelmente já é TEXT
        NULL;
    END;
END $$;

-- 4. Funções de segurança atualizadas para novos roles

-- Função para obter role organizacional
CREATE OR REPLACE FUNCTION public.get_user_organization_role(target_user_id UUID, target_org_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(or_role.role, ur.role, 'tecnico')
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    LEFT JOIN public.organization_roles or_role ON (p.id = or_role.user_id AND or_role.organization_id = target_org_id AND or_role.is_active = true)
    WHERE p.id = target_user_id
    LIMIT 1;
$$;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = COALESCE(check_user_id, auth.uid()) 
        AND role = 'super_admin'
    );
$$;

-- Função para verificar se é owner de uma organização
CREATE OR REPLACE FUNCTION public.is_organization_owner(check_user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
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

-- Função melhorada para obter role atual considerando hierarquia
CREATE OR REPLACE FUNCTION public.get_effective_user_role(check_org_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
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
            AND or_role.organization_id = COALESCE(check_org_id, get_current_user_organization_id())
            AND or_role.is_active = true
        )
        WHERE p.id = auth.uid()
    )
    SELECT effective_role FROM user_roles_hierarchy LIMIT 1;
$$;

-- 5. Atualizar RLS policies para suportar multi-empresa

-- Policy para organization_roles
CREATE POLICY "Super admins podem ver todos os roles organizacionais"
ON public.organization_roles
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Owners podem gerenciar roles em suas organizações"
ON public.organization_roles
FOR ALL
USING (is_organization_owner(auth.uid(), organization_id))
WITH CHECK (is_organization_owner(auth.uid(), organization_id));

CREATE POLICY "Usuários podem ver seus próprios roles organizacionais"
ON public.organization_roles
FOR SELECT
USING (user_id = auth.uid());

-- Atualizar policy de organizações para super_admin
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Only system can create organizations" ON public.organizations;

CREATE POLICY "Super admins podem ver todas as organizações"
ON public.organizations
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Users podem ver sua organização"
ON public.organizations
FOR SELECT
USING (id = get_user_organization_id());

CREATE POLICY "Super admins podem gerenciar organizações"
ON public.organizations
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Atualizar policies de profiles para melhor controle
DROP POLICY IF EXISTS "Acesso de leitura a perfis apenas dentro da própria organizaç" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Super admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Owners podem ver perfis de sua organização"
ON public.profiles
FOR SELECT
USING (
    is_organization_owner(auth.uid(), organization_id) OR
    get_current_user_organization_id() = organization_id
);

-- Atualizar policies de services para nova hierarquia
DROP POLICY IF EXISTS "Acesso total a serviços apenas dentro da própria organizaçã" ON public.services;
DROP POLICY IF EXISTS "Administradores podem ver TODAS as demandas da organização" ON public.services;
DROP POLICY IF EXISTS "Administradores podem ver todas as demandas da organização" ON public.services;

CREATE POLICY "Super admins podem ver todos os serviços"
ON public.services
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Acesso organizacional aos serviços"
ON public.services
FOR ALL
USING (
    is_super_admin() OR
    is_organization_owner(auth.uid(), organization_id) OR
    get_current_user_organization_id() = organization_id
)
WITH CHECK (
    is_super_admin() OR
    is_organization_owner(auth.uid(), organization_id) OR
    get_current_user_organization_id() = organization_id
);

-- 6. Função para migrar dados existentes e configurar estrutura inicial
CREATE OR REPLACE FUNCTION public.setup_initial_hierarchy()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
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

-- Executar a configuração inicial
SELECT public.setup_initial_hierarchy();

-- 7. Trigger para manter organization_roles atualizado
CREATE OR REPLACE FUNCTION public.sync_organization_roles()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
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

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS sync_organization_roles_trigger ON public.profiles;
CREATE TRIGGER sync_organization_roles_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_organization_roles();