-- Primeiro, garantir que existe uma organização padrão
INSERT INTO public.organizations (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Organização Padrão', 'organizacao-padrao', true)
ON CONFLICT (id) DO NOTHING;

-- Remover trigger problemático se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar função corrigida para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_fixed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    user_name TEXT;
    user_role TEXT;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    user_team_id UUID;
BEGIN
    RAISE NOTICE '[REGISTRO] Processando novo usuário: %', NEW.id;
    
    -- Garantir que a organização padrão existe
    INSERT INTO public.organizations (id, name, slug, is_active)
    VALUES (default_org_id, 'Organização Padrão', 'organizacao-padrao', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Obter nome do metadata ou email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Obter papel do metadata ou usar técnico como padrão
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'tecnico'
    );
    
    -- Obter team_id do metadata se fornecido
    user_team_id := (NEW.raw_user_meta_data->>'team_id')::UUID;
    
    -- Inserir perfil com organização padrão SEMPRE
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (
        NEW.id, 
        user_name, 
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''), 
        user_team_id,
        default_org_id
    );
    
    -- Inserir papel do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    -- Criar role organizacional padrão
    INSERT INTO public.organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, default_org_id, user_role)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE '[REGISTRO] Usuário registrado: % com papel % na organização %', NEW.id, user_role, default_org_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[REGISTRO ERROR] Erro: %', SQLERRM;
    RAISE;
END;
$function$;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fixed();

-- Atualizar políticas RLS para permitir inserção durante registro
DROP POLICY IF EXISTS "Gestão hierárquica de perfis" ON public.profiles;

CREATE POLICY "Gestão hierárquica de perfis"
ON public.profiles
FOR ALL
USING (
    is_super_admin() OR 
    (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text, 'gestor'::text]) AND get_current_user_organization_id() = organization_id) OR 
    (auth.uid() = id)
)
WITH CHECK (
    is_super_admin() OR 
    (get_current_user_role() = ANY (ARRAY['owner'::text, 'administrador'::text, 'gestor'::text]) AND get_current_user_organization_id() = organization_id) OR 
    (auth.uid() = id)
);

-- Política adicional para permitir inserção durante registro (quando o usuário ainda não tem perfil)
CREATE POLICY "Permitir criação de perfil durante registro"
ON public.profiles
FOR INSERT
WITH CHECK (
    auth.uid() = id AND 
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);