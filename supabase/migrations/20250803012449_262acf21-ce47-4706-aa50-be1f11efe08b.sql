-- Primeiro, remover qualquer trigger existente que possa estar causando problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Criar função melhorada para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_robust()
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
BEGIN
    RAISE NOTICE '[REGISTRO] Processando novo usuário: %', NEW.id;
    
    -- Garantir que a organização padrão existe
    INSERT INTO public.organizations (id, name, slug, is_active)
    VALUES (default_org_id, 'Organização Padrão', 'organizacao-padrao', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Extrair dados do metadata com fallbacks seguros
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name', 
        split_part(NEW.email, '@', 1),
        'Usuário'
    );
    
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'tecnico'
    );
    
    -- Processar team_id com validação
    BEGIN
        IF NEW.raw_user_meta_data->>'team_id' IS NOT NULL AND NEW.raw_user_meta_data->>'team_id' != '' THEN
            user_team_id := (NEW.raw_user_meta_data->>'team_id')::UUID;
        ELSE
            user_team_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[REGISTRO] Erro ao processar team_id, usando NULL: %', SQLERRM;
        user_team_id := NULL;
    END;
    
    -- Inserir perfil com organization_id SEMPRE definido
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
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''), 
        user_team_id,
        default_org_id,  -- SEMPRE usar organização padrão
        now(),
        now()
    );
    
    -- Inserir role do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    -- Criar role organizacional
    INSERT INTO public.organization_roles (user_id, organization_id, role, assigned_by)
    VALUES (NEW.id, default_org_id, user_role, NEW.id)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE '[REGISTRO] Usuário % registrado com sucesso: nome=%, role=%, team=%, org=%', 
        NEW.id, user_name, user_role, user_team_id, default_org_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[REGISTRO ERROR] Erro crítico ao registrar usuário %: %', NEW.id, SQLERRM;
    -- Re-lançar o erro para falhar o signup se necessário
    RAISE;
END;
$$;

-- Criar o trigger que será executado APÓS o insert na tabela auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_robust();

-- Comentários para documentar
COMMENT ON FUNCTION public.handle_new_user_robust() IS 
'Função robusta para criar perfil de usuário com organização padrão sempre definida';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'Trigger que cria automaticamente perfil, roles e organização para novos usuários';