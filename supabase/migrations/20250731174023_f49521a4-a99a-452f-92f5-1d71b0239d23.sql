-- Correção: Promover Alessandro Santos para super_admin
-- O UPDATE anterior não funcionou, vamos fazer de forma mais direta

-- 1. Verificar Alessandro Santos Silva
SELECT p.id, p.name, ur.role 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.name ILIKE '%Alessandro%';

-- 2. Promover Alessandro Santos Silva para super_admin (usando ID específico se necessário)
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.name = 'Alessandro Santos'
  LIMIT 1
);

-- 3. Verificação final
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