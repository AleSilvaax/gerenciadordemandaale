
-- Script Final de Reset de Políticas e Correção Completa (v2 - corrigido)

-- 1. Criar/Atualizar funções de ajuda
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$ 
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$ 
  SELECT team_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Limpeza agressiva de todas as políticas existentes (CORRIGIDO)
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.' || tablename || ';' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('teams', 'user_roles', 'profiles', 'services', 'service_technicians', 'service_messages')
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP; 
END; 
$$;

-- 3. Habilitação do RLS em todas as tabelas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para TEAMS (CRÍTICO: Permitir leitura pública para cadastro)
CREATE POLICY "Leitura Publica Para Cadastro de Equipes" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem gerenciar equipes" 
ON public.teams 
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

-- 5. Políticas para USER_ROLES
CREATE POLICY "Usuários podem ver seu próprio papel" 
ON public.user_roles 
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os papéis" 
ON public.user_roles 
FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'administrador');

CREATE POLICY "Sistema pode inserir papéis durante cadastro" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar papéis" 
ON public.user_roles 
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

-- 6. Políticas para PROFILES
CREATE POLICY "Usuários autenticados podem ver perfis" 
ON public.profiles 
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir perfis durante cadastro" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles 
FOR UPDATE TO authenticated
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins podem gerenciar perfis" 
ON public.profiles 
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

-- 7. Políticas para SERVICES
CREATE POLICY "Admins têm acesso total aos serviços" 
ON public.services 
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

CREATE POLICY "Gestores gerenciam serviços da sua equipe" 
ON public.services 
FOR ALL TO authenticated
USING (
  public.get_current_user_role() = 'gestor' AND
  public.get_current_user_team_id() = team_id
)
WITH CHECK (
  public.get_current_user_role() = 'gestor' AND
  public.get_current_user_team_id() = team_id
);

CREATE POLICY "Técnicos podem ver serviços atribuídos" 
ON public.services 
FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

CREATE POLICY "Técnicos podem atualizar serviços atribuídos" 
ON public.services 
FOR UPDATE TO authenticated
USING (
  public.get_current_user_role() = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
)
WITH CHECK (
  public.get_current_user_role() = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

-- 8. Verificar e corrigir a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    received_role TEXT;
    received_team_id UUID;
    user_name TEXT;
BEGIN
    -- Log para debug
    RAISE NOTICE '[CADASTRO] Novo usuário: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
    
    -- Extrair dados do metadata
    received_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    received_team_id := (NEW.raw_user_meta_data->>'team_id')::UUID;
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');
    
    RAISE NOTICE '[CADASTRO] Role: %, Team ID: %, Name: %', received_role, received_team_id, user_name;
    
    -- Validar papel
    IF received_role NOT IN ('tecnico', 'administrador', 'gestor') THEN
        received_role := 'tecnico';
        RAISE NOTICE '[CADASTRO] Role inválido, usando fallback: tecnico';
    END IF;
    
    -- Inserir perfil
    INSERT INTO public.profiles (id, name, avatar, team_id)
    VALUES (NEW.id, user_name, '', received_team_id);
    
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

-- 9. Recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Inserir equipe padrão se não existir
INSERT INTO public.teams (name, invite_code, created_by)
SELECT 'Equipe Padrão', 'DEFAULT1', '00000000-0000-0000-0000-000000000000'::UUID
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Equipe Padrão');
