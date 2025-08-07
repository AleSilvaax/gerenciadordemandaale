-- CORREÇÃO CRÍTICA: Garantir que todos os usuários tenham organização e role

-- 1. Atualizar usuários sem organização para a organização padrão
UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- 2. Criar roles para usuários que não têm
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT p.id, 'tecnico', now()
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL;

-- 3. Criar roles organizacionais para usuários que não têm
INSERT INTO public.organization_roles (user_id, organization_id, role, assigned_by, is_active, created_at, updated_at)
SELECT p.id, p.organization_id, COALESCE(ur.role, 'tecnico'), p.id, true, now(), now()
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.organization_roles orr ON (p.id = orr.user_id AND p.organization_id = orr.organization_id)
WHERE orr.user_id IS NULL AND p.organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 4. Atualizar serviços sem organização para a organização padrão
UPDATE public.services 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;