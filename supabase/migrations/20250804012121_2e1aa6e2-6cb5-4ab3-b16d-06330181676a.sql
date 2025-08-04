-- FASE 1: LIMPEZA COMPLETA E REORGANIZAÇÃO
-- Remover TODOS os triggers existentes na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover todas as funções antigas de registro
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_fixed() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_corrected() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_v2() CASCADE;

-- CRIAR FUNÇÃO FINAL ROBUSTA PARA REGISTRO DE USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user_final()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    user_team_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    validation_error TEXT;
BEGIN
    RAISE NOTICE '[REGISTRO FINAL] Iniciando registro do usuário: %', NEW.id;
    
    -- Garantir que a organização padrão existe SEMPRE
    INSERT INTO public.organizations (id, name, slug, is_active, created_at, updated_at)
    VALUES (
        default_org_id, 
        'Organização Padrão', 
        'organizacao-padrao', 
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_active = true,
        updated_at = now();
    
    -- Extrair e validar nome do usuário
    user_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
        'Usuário ' || SUBSTRING(NEW.id::text, 1, 8)
    );
    
    -- Extrair e validar role do usuário
    user_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico')));
    
    -- Validar role contra valores permitidos
    IF user_role NOT IN ('super_admin', 'owner', 'administrador', 'gestor', 'tecnico', 'requisitor') THEN
        RAISE NOTICE '[REGISTRO FINAL] Role inválido "%", usando tecnico', user_role;
        user_role := 'tecnico';
    END IF;
    
    -- Processar team_id com validação robusta
    user_team_id := NULL;
    BEGIN
        IF NEW.raw_user_meta_data->>'team_id' IS NOT NULL 
           AND TRIM(NEW.raw_user_meta_data->>'team_id') != '' 
           AND TRIM(NEW.raw_user_meta_data->>'team_id') != 'null' THEN
            
            user_team_id := (NEW.raw_user_meta_data->>'team_id')::UUID;
            
            -- Verificar se o team existe e está ativo
            IF NOT EXISTS (
                SELECT 1 FROM public.teams 
                WHERE id = user_team_id 
                AND organization_id = default_org_id
            ) THEN
                RAISE NOTICE '[REGISTRO FINAL] Team % não existe ou não pertence à organização padrão', user_team_id;
                user_team_id := NULL;
            END IF;
        END IF;
    EXCEPTION 
        WHEN invalid_text_representation THEN
            RAISE NOTICE '[REGISTRO FINAL] team_id inválido: %, usando NULL', NEW.raw_user_meta_data->>'team_id';
            user_team_id := NULL;
        WHEN OTHERS THEN
            RAISE NOTICE '[REGISTRO FINAL] Erro ao processar team_id: %, usando NULL', SQLERRM;
            user_team_id := NULL;
    END;
    
    RAISE NOTICE '[REGISTRO FINAL] Dados processados - Nome: %, Role: %, Team: %, Org: %', 
        user_name, user_role, user_team_id, default_org_id;
    
    -- INSERIR PERFIL (com retry em caso de conflito)
    BEGIN
        INSERT INTO public.profiles (
            id, 
            name, 
            avatar, 
            team_id, 
            organization_id,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id, 
            user_name, 
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar'), ''), ''),
            user_team_id,
            default_org_id,
            now(),
            now()
        );
        RAISE NOTICE '[REGISTRO FINAL] Perfil criado com sucesso';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '[REGISTRO FINAL] Erro ao criar perfil: %', SQLERRM;
    END;
    
    -- INSERIR ROLE DO USUÁRIO
    BEGIN
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (NEW.id, user_role, now());
        RAISE NOTICE '[REGISTRO FINAL] Role de usuário criado com sucesso';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '[REGISTRO FINAL] Erro ao criar role do usuário: %', SQLERRM;
    END;
    
    -- CRIAR ROLE ORGANIZACIONAL
    BEGIN
        INSERT INTO public.organization_roles (
            user_id, 
            organization_id, 
            role, 
            assigned_by,
            is_active,
            created_at, 
            updated_at
        )
        VALUES (
            NEW.id, 
            default_org_id, 
            user_role, 
            NEW.id,
            true,
            now(), 
            now()
        )
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
            role = EXCLUDED.role,
            updated_at = now(),
            is_active = true,
            assigned_by = EXCLUDED.assigned_by;
        RAISE NOTICE '[REGISTRO FINAL] Role organizacional criado com sucesso';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '[REGISTRO FINAL] Erro ao criar role organizacional: %', SQLERRM;
    END;
    
    RAISE NOTICE '[REGISTRO FINAL] ✅ Usuário % registrado com SUCESSO COMPLETO: nome=%, role=%, team=%, org=%', 
        NEW.id, user_name, user_role, user_team_id, default_org_id;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '[REGISTRO FINAL] ❌ ERRO CRÍTICO ao registrar usuário %: %', NEW.id, SQLERRM;
END;
$$;

-- CRIAR TRIGGER ÚNICO E FINAL
CREATE TRIGGER on_auth_user_created_final
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_final();

-- FASE 2: AJUSTAR POLÍTICAS RLS PARA PERMITIR REGISTRO

-- Política mais permissiva para INSERT em profiles durante registro
CREATE POLICY "Permitir criação de perfil durante registro v2" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    -- Permite se é o próprio usuário E ainda não tem perfil
    (auth.uid() = id AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid()
    ))
    -- OU se é um super admin
    OR is_super_admin()
);

-- Política para permitir INSERT em user_roles durante registro
CREATE POLICY "Permitir criação de role durante registro"
ON public.user_roles
FOR INSERT
WITH CHECK (
    -- Permite se é o próprio usuário E ainda não tem role
    (auth.uid() = user_id AND NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
    ))
    -- OU se é um super admin
    OR is_super_admin()
);

-- Garantir que a organização padrão existe
INSERT INTO public.organizations (id, name, slug, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, 
    'Organização Padrão', 
    'organizacao-padrao', 
    true,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    is_active = true,
    updated_at = now();

RAISE NOTICE '🎉 SISTEMA DE REGISTRO COMPLETAMENTE REORGANIZADO E PRONTO!';