
-- Migração para permitir usuários legados (sem organization_id) funcionarem temporariamente

-- Atualizar política de profiles para permitir perfis sem organization_id
DROP POLICY IF EXISTS "Users can view profiles from same organization" ON public.profiles;
CREATE POLICY "Users can view profiles from same organization" 
ON public.profiles
FOR SELECT TO authenticated
USING (
  organization_id = get_user_organization_id() 
  OR organization_id IS NULL  -- Permite perfis legados
  OR get_user_organization_id() IS NULL  -- Permite usuários legados verem perfis
);

-- Atualizar política de atualização de perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir inserção de perfis básicos durante migração
DROP POLICY IF EXISTS "System can insert profiles during registration" ON public.profiles;
CREATE POLICY "System can insert profiles during registration"
ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Atualizar função get_user_organization_id para lidar com usuários sem organização
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;
