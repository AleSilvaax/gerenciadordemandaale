
-- Primeiro, vamos verificar quais valores de role existem atualmente
SELECT role, COUNT(*) as count 
FROM public.user_roles 
GROUP BY role;

-- Atualizar valores incorretos para valores válidos
UPDATE public.user_roles 
SET role = CASE 
    WHEN role = 'admin' THEN 'administrador'
    WHEN role = 'manager' THEN 'gestor'
    WHEN role = 'tech' THEN 'tecnico'
    WHEN role = 'user' THEN 'tecnico'
    WHEN role NOT IN ('tecnico', 'administrador', 'gestor') THEN 'tecnico'
    ELSE role
END
WHERE role NOT IN ('tecnico', 'administrador', 'gestor');

-- Agora adicionar a constraint com os dados limpos
DO $$ 
BEGIN
    -- Verificar se já existe constraint e remover se necessário
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_role_check' 
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
    END IF;
    
    -- Adicionar constraint permitindo todos os tipos de papel
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN ('tecnico', 'administrador', 'gestor'));
END $$;

-- Atualizar a função handle_new_user para usar o papel do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Extrair o papel do metadata do usuário, com fallback para 'tecnico'
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    
    -- Garantir que o papel é válido
    IF user_role NOT IN ('tecnico', 'administrador', 'gestor') THEN
        user_role := 'tecnico';
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
    
    RETURN NEW;
END;
$$;

-- Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar e corrigir a política para permitir inserção de qualquer papel
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
CREATE POLICY "Authenticated users can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Adicionar política para permitir atualização de papéis
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
CREATE POLICY "Users can update their own roles" ON public.user_roles
    FOR UPDATE USING (user_id = auth.uid());
