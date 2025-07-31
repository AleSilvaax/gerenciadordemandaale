-- MIGRAÇÃO PARA CORRIGIR PROBLEMAS DE RLS E ORGANIZAÇÕES

-- 1. Criar organização padrão se não existir
INSERT INTO public.organizations (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Organização Padrão', 'organizacao-padrao', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Atualizar todos os perfis sem organização para usar a organização padrão
UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- 3. Atualizar todos os serviços sem organização para usar a organização padrão
UPDATE public.services 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- 4. Atualizar todos os tipos de serviço sem organização
UPDATE public.service_types 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- 5. Atualizar todas as equipes sem organização
UPDATE public.teams 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- 6. Corrigir a função que busca o role do perfil (estava buscando na tabela errada)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 7. Remover as políticas conflitantes em service_technicians que causam recursão
DROP POLICY IF EXISTS "Usuarios autenticados podem gerenciar tecnicos" ON public.service_technicians;

-- 8. Criar políticas mais simples para service_technicians
CREATE POLICY "Admins e gestores podem gerenciar atribuições" 
ON public.service_technicians
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]));

CREATE POLICY "Técnicos podem ver suas atribuições" 
ON public.service_technicians
FOR SELECT
USING (technician_id = auth.uid());

-- 9. Simplificar a política de serviços para evitar recursão
DROP POLICY IF EXISTS "Usuarios autenticados podem ver todas as demandas" ON public.services;

-- 10. Manter apenas as políticas específicas por role
-- (as outras políticas já existem e funcionam bem)

-- 11. Garantir que organization_id seja obrigatório em novos registros
ALTER TABLE public.profiles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.service_types ALTER COLUMN organization_id SET NOT NULL;

-- 12. Atualizar triggers para incluir organization_id automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_corrected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    RAISE NOTICE '[REGISTRO] Processando novo usuário: %', NEW.id;
    
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
    
    -- Inserir perfil com organização padrão
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (
        NEW.id, 
        user_name, 
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''), 
        NULL,
        default_org_id
    );
    
    -- Inserir papel do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RAISE NOTICE '[REGISTRO] Usuário registrado: % com papel % na organização %', NEW.id, user_role, default_org_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[REGISTRO ERROR] Erro: %', SQLERRM;
    RAISE;
END;
$$;

-- 13. Substituir o trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_corrected();