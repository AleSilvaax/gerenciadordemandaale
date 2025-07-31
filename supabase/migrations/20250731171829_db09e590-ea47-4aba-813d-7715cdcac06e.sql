-- Plano A: Promover usuário para Super Admin e corrigir funções

-- 1. Identificar e promover usuário atual para super_admin
-- Assumindo que o usuário atual é o que está logado
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT id FROM public.profiles 
  WHERE name LIKE '%Revo%' OR name LIKE '%admin%' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- 2. Criar role organizacional como owner da organização Revo EV
INSERT INTO public.organization_roles (user_id, organization_id, role, assigned_by)
SELECT 
  p.id,
  o.id,
  'owner',
  p.id
FROM public.profiles p
CROSS JOIN public.organizations o
WHERE o.name = 'Revo EV'
AND p.id = (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'super_admin' 
  ORDER BY created_at DESC 
  LIMIT 1
)
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET 
  role = 'owner',
  is_active = true,
  updated_at = now();

-- 3. Corrigir função get_current_user_organization_id para não retornar NULL
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  org_id UUID;
BEGIN
  -- Primeiro tenta pegar da tabela profiles
  SELECT organization_id 
  INTO org_id 
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Se não encontrar ou for NULL, pega a primeira organização disponível
  IF org_id IS NULL THEN
    SELECT id 
    INTO org_id 
    FROM public.organizations 
    WHERE is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  -- Se ainda for NULL, retorna o UUID padrão
  RETURN COALESCE(org_id, '00000000-0000-0000-0000-000000000001'::uuid);
END;
$function$;

-- 4. Garantir que get_current_user_role funcione corretamente
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COALESCE(role, 'tecnico') 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$function$;