-- Correção Completa do Sistema de Permissões
-- Fase 1: Correção da Base de Dados

-- 1. Encontrar Alessandro Santos Silva e promover a super_admin
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.name ILIKE '%Alessandro Santos Silva%' 
  LIMIT 1
);

-- 2. Demover Luiz Felipe de super_admin para gestor
UPDATE public.user_roles 
SET role = 'gestor' 
WHERE user_id = '4c503d4d-6872-4be8-a580-5074898ff586';

-- 3. Corrigir função get_effective_user_role para trabalhar corretamente
CREATE OR REPLACE FUNCTION public.get_effective_user_role(check_org_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
    -- Primeiro verificar se é super_admin (maior prioridade)
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        ) THEN 'super_admin'
        ELSE (
            -- Senão, verificar role organizacional ou role global
            SELECT COALESCE(
                (SELECT or_role.role 
                 FROM public.organization_roles or_role 
                 WHERE or_role.user_id = auth.uid() 
                   AND or_role.organization_id = COALESCE(check_org_id, public.get_current_user_organization_id())
                   AND or_role.is_active = true
                 ORDER BY 
                   CASE or_role.role 
                     WHEN 'owner' THEN 1
                     WHEN 'administrador' THEN 2
                     WHEN 'gestor' THEN 3
                     WHEN 'tecnico' THEN 4
                     ELSE 5
                   END
                 LIMIT 1),
                (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid()),
                'tecnico'
            )
        )
    END;
$function$;

-- 4. Criar função simplificada para verificar super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = COALESCE(check_user_id, auth.uid()) 
        AND role = 'super_admin'
    );
$function$;

-- 5. Verificação final dos novos roles
SELECT 
    p.name,
    ur.role as user_role,
    CASE 
        WHEN ur.role = 'super_admin' THEN 'SUPER ADMIN - Controle Total'
        ELSE 'Usuário Normal'
    END as status_sistema
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.name ILIKE '%Alessandro%' OR p.name ILIKE '%Luiz%'
ORDER BY ur.role;