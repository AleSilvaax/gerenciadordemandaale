-- REVERTENDO SISTEMA DE MULTI-TENANCY PARA SISTEMA SIMPLES
-- Removendo restrictions de organization_id e permitindo registro livre

-- 1. Remover políticas restritivas de organization_id
DROP POLICY IF EXISTS "Users can view profiles from same organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles during registration" ON public.profiles;

-- 2. Criar políticas simples para profiles
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone can insert profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- 3. Remover políticas restritivas de services
DROP POLICY IF EXISTS "Users can view services from same organization" ON public.services;
DROP POLICY IF EXISTS "Users can create services in their organization" ON public.services;
DROP POLICY IF EXISTS "Admins can manage all services in their organization" ON public.services;
DROP POLICY IF EXISTS "Technicians can update assigned services in their organization" ON public.services;

-- 4. Criar políticas simples para services
CREATE POLICY "Anyone can view services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create services" 
ON public.services 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all services" 
ON public.services 
FOR ALL 
USING (get_current_user_role() = 'administrador')
WITH CHECK (get_current_user_role() = 'administrador');

CREATE POLICY "Technicians can update assigned services" 
ON public.services 
FOR UPDATE 
USING (
  get_current_user_role() = 'tecnico' AND 
  id IN (
    SELECT service_id FROM service_technicians 
    WHERE technician_id = auth.uid()
  )
)
WITH CHECK (
  get_current_user_role() = 'tecnico' AND 
  id IN (
    SELECT service_id FROM service_technicians 
    WHERE technician_id = auth.uid()
  )
);

-- 5. Remover políticas restritivas de user_roles
DROP POLICY IF EXISTS "Sistema pode inserir papéis durante cadastro" ON public.user_roles;

-- 6. Criar política simples para user_roles
CREATE POLICY "Allow registration role insert" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

-- 7. Tornar organization_id opcional em profiles (já está, mas garantindo)
ALTER TABLE public.profiles ALTER COLUMN organization_id DROP NOT NULL;

-- 8. Remover trigger de registro restritivo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 9. Criar função simples para criar perfil na hora do registro
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 10. Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();