-- PARTE 1: Reset e Construção do Novo Banco de Dados

-- 1. Simplificar estrutura - manter apenas tabelas essenciais
-- Remover dependências desnecessárias e simplificar RLS

-- 2. Corrigir função handle_new_user para novo fluxo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    user_team_id UUID;
    user_name TEXT;
    default_team_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
BEGIN
    RAISE NOTICE '[AUTH] Processando novo usuário: %', NEW.id;
    
    -- Extrair dados do metadata do formulário
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'tecnico'
    );
    
    -- Extrair team_id ou usar padrão
    user_team_id := COALESCE(
        (NEW.raw_user_meta_data->>'team_id')::UUID,
        default_team_id
    );
    
    RAISE NOTICE '[AUTH] Dados extraídos - Nome: %, Role: %, Team: %', user_name, user_role, user_team_id;
    
    -- Validar role
    IF user_role NOT IN ('tecnico', 'gestor', 'administrador') THEN
        user_role := 'tecnico';
        RAISE NOTICE '[AUTH] Role inválido, usando padrão: tecnico';
    END IF;
    
    -- Inserir perfil com organização padrão
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (
        NEW.id,
        user_name,
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
        user_team_id,
        '00000000-0000-0000-0000-000000000001'::uuid
    );
    
    -- Inserir papel do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RAISE NOTICE '[AUTH] Usuário criado com sucesso - ID: %, Role: %, Team: %', NEW.id, user_role, user_team_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[AUTH ERROR] Erro ao processar usuário: %', SQLERRM;
    -- Continuar mesmo com erro para não bloquear autenticação
    RETURN NEW;
END;
$$;

-- 3. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Simplificar políticas RLS para evitar conflitos
-- Remover políticas complexas e criar versões mais simples

-- Service Types - permissões mais abertas para desenvolvimento
DROP POLICY IF EXISTS "Allow all authenticated users to manage service types" ON public.service_types;
CREATE POLICY "authenticated_service_types_all"
ON public.service_types FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Technical Fields - permissões mais abertas
DROP POLICY IF EXISTS "Allow all authenticated users to manage technical fields" ON public.technical_fields;
CREATE POLICY "authenticated_technical_fields_all"
ON public.technical_fields FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Profiles - simplificar
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profiles;

CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "profiles_insert_all"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- User Roles - simplificar
DROP POLICY IF EXISTS "Allow registration role insert" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio papel" ON public.user_roles;
DROP POLICY IF EXISTS "user_can_view_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem ver todos os papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem gerenciar papéis" ON public.user_roles;

CREATE POLICY "user_roles_insert_auth"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "user_roles_select_own"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
ON public.user_roles FOR SELECT TO authenticated
USING (get_current_user_role() = 'administrador');

-- 5. Garantir dados básicos existem
-- Inserir equipe padrão adicional para seleção
INSERT INTO public.teams (id, name, invite_code, created_by, organization_id)
VALUES 
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Equipe Técnica', 'TECH001', '00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Equipe Gestão', 'MGMT001', '00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;