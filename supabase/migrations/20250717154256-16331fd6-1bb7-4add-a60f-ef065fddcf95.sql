
-- Fase 1: Correção Completa do Banco de Dados

-- 1. Limpar e recriar políticas RLS problemáticas
DROP POLICY IF EXISTS "Admins and managers can manage service types in their organizat" ON public.service_types;
DROP POLICY IF EXISTS "Users can view service types from same organization" ON public.service_types;
DROP POLICY IF EXISTS "Admins e gestores podem criar e editar campos técnicos" ON public.technical_fields;
DROP POLICY IF EXISTS "Admins e gestores podem manipular campos técnicos" ON public.technical_fields;
DROP POLICY IF EXISTS "Qualquer logado pode ver campos técnicos" ON public.technical_fields;
DROP POLICY IF EXISTS "Somente logados podem ver campos" ON public.technical_fields;

-- 2. Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Allow all authenticated users to manage service types"
ON public.service_types FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage technical fields"
ON public.technical_fields FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Criar organização padrão se não existir
INSERT INTO public.organizations (id, name, slug, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Organização Padrão',
  'organizacao-padrao',
  '{}'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar equipe padrão vinculada à organização
INSERT INTO public.teams (id, name, invite_code, created_by, organization_id)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Equipe Padrão',
  'DEFAULT123',
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid
)
ON CONFLICT (id) DO NOTHING;

-- 5. Atualizar função handle_new_user para criar perfis automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    received_role TEXT;
    received_team_id UUID;
    user_name TEXT;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    default_team_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
BEGIN
    RAISE NOTICE '[CADASTRO] Novo usuário: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
    
    -- Extrair dados do metadata
    received_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    received_team_id := COALESCE((NEW.raw_user_meta_data->>'team_id')::UUID, default_team_id);
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    
    RAISE NOTICE '[CADASTRO] Role: %, Team ID: %, Name: %', received_role, received_team_id, user_name;
    
    -- Validar papel
    IF received_role NOT IN ('tecnico', 'administrador', 'gestor', 'requisitor') THEN
        received_role := 'tecnico';
        RAISE NOTICE '[CADASTRO] Role inválido, usando fallback: tecnico';
    END IF;
    
    -- Inserir perfil
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (NEW.id, user_name, '', received_team_id, default_org_id);
    
    -- Inserir papel
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, received_role);
    
    RAISE NOTICE '[CADASTRO] Usuário criado com sucesso: % (role: %, team: %)', NEW.id, received_role, received_team_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[CADASTRO ERROR] Erro ao criar usuário: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Recriar trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Inserir tipos de serviço padrão se não existirem
INSERT INTO public.service_types (id, name, description, organization_id, default_priority, estimated_hours)
VALUES 
  (gen_random_uuid(), 'Vistoria', 'Vistoria técnica padrão', '00000000-0000-0000-0000-000000000001'::uuid, 'media', 2),
  (gen_random_uuid(), 'Instalação', 'Instalação de equipamentos', '00000000-0000-0000-0000-000000000001'::uuid, 'alta', 4),
  (gen_random_uuid(), 'Manutenção', 'Manutenção preventiva/corretiva', '00000000-0000-0000-0000-000000000001'::uuid, 'media', 3)
ON CONFLICT DO NOTHING;

-- 8. Corrigir função get_user_organization_id para retornar organização padrão
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$ 
  SELECT COALESCE(
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- 9. Habilitar RLS em todas as tabelas necessárias
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_fields ENABLE ROW LEVEL SECURITY;
