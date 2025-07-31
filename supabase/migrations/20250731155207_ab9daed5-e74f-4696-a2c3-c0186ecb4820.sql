-- Corrigir as últimas funções que ainda não têm search_path

-- 1. nextval_for_service
CREATE OR REPLACE FUNCTION public.nextval_for_service()
RETURNS bigint
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  new_val bigint;
BEGIN
  -- Confirma existência da sequência e permissões
  CREATE SEQUENCE IF NOT EXISTS service_number_seq;
  GRANT USAGE, SELECT ON SEQUENCE service_number_seq TO authenticated, anon;
  -- Gere o próximo valor da sequência
  SELECT nextval('service_number_seq') INTO new_val;
  RETURN new_val;
END;
$$;

-- 2. join_team_by_code
CREATE OR REPLACE FUNCTION public.join_team_by_code(user_id uuid, code text)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  found_team_id UUID;
BEGIN
  -- Buscar o ID da equipe pelo código
  SELECT teams.id INTO found_team_id FROM public.teams WHERE teams.invite_code = code;
  
  IF found_team_id IS NULL THEN
    RAISE EXCEPTION 'Código de convite inválido';
  END IF;
  
  -- Atualizar o perfil do usuário para associá-lo à equipe
  UPDATE public.profiles 
  SET team_id = found_team_id 
  WHERE id = user_id;
  
  RETURN found_team_id;
END;
$$;

-- 3. generate_random_code
CREATE OR REPLACE FUNCTION public.generate_random_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 4. create_service_messages_if_not_exists
CREATE OR REPLACE FUNCTION public.create_service_messages_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  -- Esta função agora é apenas um placeholder, já que estamos criando a tabela diretamente
  -- Mantida por compatibilidade com código existente
  RETURN;
END;
$$;

-- 5. get_service_messages
CREATE OR REPLACE FUNCTION public.get_service_messages()
RETURNS SETOF service_messages
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT * FROM public.service_messages;
$$;

-- 6. create_team
CREATE OR REPLACE FUNCTION public.create_team(name text, creator_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  team_id UUID;
  invite_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Gerar código de convite único
  LOOP
    invite_code := generate_random_code();
    SELECT EXISTS (SELECT 1 FROM public.teams WHERE teams.invite_code = invite_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Inserir nova equipe
  INSERT INTO public.teams (name, invite_code, created_by)
  VALUES (name, invite_code, creator_id)
  RETURNING id INTO team_id;
  
  -- Atualizar o perfil do criador para associá-lo à equipe
  UPDATE public.profiles 
  SET team_id = team_id 
  WHERE id = creator_id;
  
  RETURN team_id;
END;
$$;