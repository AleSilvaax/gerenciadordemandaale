-- Verificar e corrigir constraint de roles para permitir super_admin

-- 1. Primeiro, verificar constraint atual
SELECT conname, pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'user_roles' AND contype = 'c';

-- 2. Dropar constraint antiga e criar nova com super_admin
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 3. Criar nova constraint incluindo super_admin
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('tecnico', 'gestor', 'administrador', 'super_admin', 'owner'));

-- 4. Agora promover Luiz Felipe para super_admin
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '4c503d4d-6872-4be8-a580-5074898ff586';

-- 5. Criar role organizacional como owner da Revo EV
INSERT INTO public.organization_roles (user_id, organization_id, role, assigned_by)
VALUES (
  '4c503d4d-6872-4be8-a580-5074898ff586', 
  '3386b186-c6b1-4951-8571-3d67dd2046d2', 
  'owner',
  '4c503d4d-6872-4be8-a580-5074898ff586'
)
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET 
  role = 'owner',
  is_active = true,
  updated_at = now();

-- 6. Verificação final
SELECT 'Luiz Felipe - User Role' as tipo, ur.role 
FROM public.user_roles ur 
WHERE ur.user_id = '4c503d4d-6872-4be8-a580-5074898ff586'
UNION ALL
SELECT 'Luiz Felipe - Org Role' as tipo, or_r.role 
FROM public.organization_roles or_r 
WHERE or_r.user_id = '4c503d4d-6872-4be8-a580-5074898ff586';