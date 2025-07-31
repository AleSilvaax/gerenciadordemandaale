-- Correção SQL Específica para Luiz Felipe
-- Promover para Super Admin e Owner da Revo EV

-- 1. Atualizar role do Luiz Felipe para super_admin
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '4c503d4d-6872-4be8-a580-5074898ff586';

-- 2. Criar role organizacional como owner da Revo EV para Luiz Felipe
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

-- 3. Verificação: Listar roles do Luiz Felipe
SELECT 'Verificação User Roles:' as tipo, ur.role, ur.user_id, p.name
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.user_id = '4c503d4d-6872-4be8-a580-5074898ff586';

-- 4. Verificação: Listar roles organizacionais do Luiz Felipe
SELECT 'Verificação Organization Roles:' as tipo, or_r.role, or_r.organization_id, o.name
FROM public.organization_roles or_r
JOIN public.organizations o ON or_r.organization_id = o.id
WHERE or_r.user_id = '4c503d4d-6872-4be8-a580-5074898ff586';