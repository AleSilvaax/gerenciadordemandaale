
-- Primeiro, vamos verificar o estado atual da tabela user_roles e suas políticas
SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- Verificar se há alguma constraint ou default na tabela
SELECT column_name, column_default, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- Verificar a função handle_new_user atual
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- Verificar se há dados na tabela user_roles
SELECT user_id, role FROM public.user_roles ORDER BY created_at DESC LIMIT 10;

-- Vamos corrigir as políticas RLS que estão causando recursão infinita
-- Primeiro, removemos as políticas problemáticas
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Criar políticas mais simples que não causem recursão
CREATE POLICY "Enable read access for authenticated users" ON public.user_roles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_roles
    FOR INSERT WITH CHECK (true);

-- Criar uma função segura para obter o papel do usuário sem causar recursão
CREATE OR REPLACE FUNCTION public.get_user_role_safe(target_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = target_user_id LIMIT 1;
$$;

-- Atualizar a função handle_new_user para garantir que está funcionando corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Log para debug
    RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
    RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
    
    -- Extrair o papel do metadata do usuário, com fallback para 'tecnico'
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    
    -- Log do papel extraído
    RAISE LOG 'Extracted role: %', user_role;
    
    -- Garantir que o papel é válido
    IF user_role NOT IN ('tecnico', 'administrador', 'gestor') THEN
        user_role := 'tecnico';
        RAISE LOG 'Invalid role, defaulting to tecnico';
    END IF;
    
    -- Inserir perfil
    INSERT INTO public.profiles (id, name, avatar)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
        ''
    );
    
    -- Inserir papel do usuário usando o valor correto
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RAISE LOG 'User role inserted: % for user: %', user_role, NEW.id;
    
    RETURN NEW;
END;
$$;

-- Verificar se o trigger existe e está ativo
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
