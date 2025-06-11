
-- Corrigir permissões para a função nextval_for_service
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO anon;

-- Corrigir as políticas RLS da tabela user_roles para evitar recursão infinita
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Criar função segura para verificar roles sem recursão
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Conceder permissões para a nova função
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- Criar políticas RLS mais simples para user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Garantir que as tabelas principais tenham as permissões corretas
GRANT SELECT, INSERT, UPDATE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_technicians TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.service_types TO authenticated;

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_technicians ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para as tabelas principais se não existirem
DROP POLICY IF EXISTS "Users can view all services" ON public.services;
CREATE POLICY "Users can view all services" ON public.services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert services" ON public.services;
CREATE POLICY "Users can insert services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update services" ON public.services;
CREATE POLICY "Users can update services" ON public.services
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage service technicians" ON public.service_technicians;
CREATE POLICY "Users can manage service technicians" ON public.service_technicians
  FOR ALL USING (auth.uid() IS NOT NULL);
