-- Corrigir todas as funções existentes para adicionar search_path

-- 1. get_user_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. get_user_role_safe
CREATE OR REPLACE FUNCTION public.get_user_role_safe(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role FROM public.user_roles WHERE user_id = target_user_id LIMIT 1;
$$;

-- 3. create_first_organization
CREATE OR REPLACE FUNCTION public.create_first_organization(org_name text, admin_email text, admin_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- 4. handle_new_user_simple
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
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
    
    -- Inserir perfil
    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (
        NEW.id, 
        user_name, 
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''), 
        NULL,
        NULL
    );
    
    -- Inserir papel do usuário
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RAISE NOTICE '[REGISTRO] Usuário registrado: % com papel %', NEW.id, user_role;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[REGISTRO ERROR] Erro: %', SQLERRM;
    RAISE;
END;
$$;

-- 5. get_user_complete_profile
CREATE OR REPLACE FUNCTION public.get_user_complete_profile(user_uuid uuid)
RETURNS TABLE(id uuid, name text, avatar text, team_id uuid, team_name text, organization_id uuid, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    SELECT 
        p.id,
        p.name,
        p.avatar,
        p.team_id,
        COALESCE(t.name, 'Sem Equipe') as team_name,
        COALESCE(p.organization_id, '00000000-0000-0000-0000-000000000001'::uuid) as organization_id,
        COALESCE(ur.role, 'tecnico') as role
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = user_uuid;
$$;

-- 6. create_notification
CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_message text, target_service_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (target_user_id, notification_message, target_service_id);
END;
$$;

-- 7. handle_technician_assignment
CREATE OR REPLACE FUNCTION public.handle_technician_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    service_title TEXT;
BEGIN
    SELECT title INTO service_title FROM public.services WHERE id = NEW.service_id;
    PERFORM public.create_notification(
        NEW.technician_id,
        'Você foi atribuído a uma nova demanda: "' || service_title || '"',
        NEW.service_id
    );
    RETURN NEW;
END;
$$;

-- 8. handle_service_completed
CREATE OR REPLACE FUNCTION public.handle_service_completed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM 'concluido' AND NEW.status = 'concluido' THEN
        IF OLD.created_by IS NOT NULL THEN
            PERFORM public.create_notification(
                OLD.created_by,
                'A demanda "' || NEW.title || '" que você criou foi marcada como concluída.',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 9. handle_new_user_corrected
CREATE OR REPLACE FUNCTION public.handle_new_user_corrected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- 10. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    user_role TEXT;
    user_team_id UUID;
    user_name TEXT;
    default_team_id UUID;
BEGIN
    SELECT id INTO default_team_id FROM public.teams WHERE name = 'Equipe Padrão' LIMIT 1;
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    user_team_id := COALESCE((NEW.raw_user_meta_data->>'team_id')::UUID, default_team_id);

    IF user_role NOT IN ('tecnico', 'administrador', 'gestor') THEN
        user_role := 'tecnico';
    END IF;

    INSERT INTO public.profiles (id, name, avatar, team_id, organization_id)
    VALUES (NEW.id, user_name, COALESCE(NEW.raw_user_meta_data->>'avatar', ''), user_team_id, '00000000-0000-0000-0000-000000000001'::uuid);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);

    RETURN NEW;
END;
$$;

-- 11. is_technician_for_service
CREATE OR REPLACE FUNCTION public.is_technician_for_service(service_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.service_technicians 
    WHERE service_id = service_uuid 
    AND technician_id = auth.uid()
  );
$$;

-- 12. get_user_organization_safe
CREATE OR REPLACE FUNCTION public.get_user_organization_safe()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid) 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- 13. get_current_user_organization_id
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid) 
  INTO org_id 
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN org_id;
END;
$$;

-- 14. get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(role, 'tecnico') FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 15. get_current_user_team_id
CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 16. get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- 17. has_permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
  
  IF user_role = 'administrador' THEN
    RETURN TRUE;
  ELSIF user_role = 'gestor' AND (required_role = 'gestor' OR required_role = 'tecnico') THEN
    RETURN TRUE;
  ELSIF user_role = required_role THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;