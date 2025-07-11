
-- FASE 1: IMPLEMENTAÇÃO CRÍTICA DE MULTI-TENANCY E SEGURANÇA

-- 1. Criar tabela de organizações
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Adicionar organization_id a todas as tabelas principais
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.services ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.service_types ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.technical_fields ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. Criar função para obter organization_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 4. Criar tabela de convites para substituir registro público
CREATE TABLE public.user_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'tecnico',
  team_id UUID REFERENCES public.teams(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. REMOVER TODAS as políticas RLS existentes que são inseguras
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  -- Remove políticas da tabela profiles
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.profiles;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP; 

  -- Remove políticas da tabela services
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.services;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'services'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP; 

  -- Remove políticas da tabela teams
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.teams;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'teams'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP;

  -- Remove políticas da tabela service_types
  FOR r IN (
    SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON public.service_types;' AS q 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'service_types'
  ) 
  LOOP 
    EXECUTE r.q; 
  END LOOP;
END; 
$$;

-- 6. CRIAR POLÍTICAS RLS SEGURAS COM ISOLAMENTO POR ORGANIZAÇÃO

-- Políticas para organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT TO authenticated
USING (id = get_user_organization_id());

CREATE POLICY "Only system can create organizations"
ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (false); -- Apenas via função administrativa

-- Políticas SEGURAS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles from same organization" 
ON public.profiles
FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND organization_id = get_user_organization_id())
WITH CHECK (id = auth.uid() AND organization_id = get_user_organization_id());

CREATE POLICY "System can insert profiles during registration"
ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Políticas SEGURAS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services from same organization"
ON public.services
FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create services in their organization"
ON public.services
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND 
  organization_id = get_user_organization_id()
);

CREATE POLICY "Admins can manage all services in their organization"
ON public.services
FOR ALL TO authenticated
USING (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
)
WITH CHECK (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
);

CREATE POLICY "Technicians can update assigned services in their organization"
ON public.services
FOR UPDATE TO authenticated
USING (
  get_current_user_role() = 'tecnico' AND
  organization_id = get_user_organization_id() AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
)
WITH CHECK (
  get_current_user_role() = 'tecnico' AND
  organization_id = get_user_organization_id() AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

-- Políticas SEGURAS para teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams from same organization"
ON public.teams
FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage teams in their organization"
ON public.teams
FOR ALL TO authenticated
USING (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
)
WITH CHECK (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
);

-- Políticas SEGURAS para service_types
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service types from same organization"
ON public.service_types
FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage service types in their organization"
ON public.service_types
FOR ALL TO authenticated
USING (
  get_current_user_role() IN ('administrador', 'gestor') AND 
  organization_id = get_user_organization_id()
)
WITH CHECK (
  get_current_user_role() IN ('administrador', 'gestor') AND 
  organization_id = get_user_organization_id()
);

-- Políticas para user_invites
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites in their organization"
ON public.user_invites
FOR ALL TO authenticated
USING (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
)
WITH CHECK (
  get_current_user_role() = 'administrador' AND 
  organization_id = get_user_organization_id()
);

-- 7. Atualizar função handle_new_user para usar convites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    user_name TEXT;
BEGIN
    RAISE NOTICE '[REGISTRO] Processando novo usuário: %', NEW.id;
    
    -- Buscar convite válido pelo email
    SELECT * INTO invite_record 
    FROM public.user_invites 
    WHERE email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > now()
    LIMIT 1;
    
    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Registro não autorizado. Usuário deve ser convidado por um administrador.';
    END IF;
    
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', invite_record.email);
    
    -- Inserir perfil com dados do convite
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (
        NEW.id, 
        user_name, 
        '', 
        invite_record.team_id,
        invite_record.organization_id
    );
    
    -- Inserir papel do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invite_record.role);
    
    -- Marcar convite como usado
    UPDATE public.user_invites 
    SET used_at = now() 
    WHERE id = invite_record.id;
    
    RAISE NOTICE '[REGISTRO] Usuário registrado com sucesso: % (org: %, role: %)', 
                 NEW.id, invite_record.organization_id, invite_record.role;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[REGISTRO ERROR] Erro: %', SQLERRM;
    -- Re-raise the exception to prevent user creation
    RAISE;
END;
$$;

-- 8. Função administrativa para criar primeira organização
CREATE OR REPLACE FUNCTION public.create_first_organization(
    org_name TEXT,
    admin_email TEXT,
    admin_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    org_id UUID;
    invite_id UUID;
BEGIN
    -- Criar organização
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, lower(replace(org_name, ' ', '-')))
    RETURNING id INTO org_id;
    
    -- Criar convite para admin
    INSERT INTO public.user_invites (email, organization_id, role, invited_by)
    VALUES (admin_email, org_id, 'administrador', '00000000-0000-0000-0000-000000000000'::uuid)
    RETURNING id INTO invite_id;
    
    RETURN org_id;
END;
$$;
