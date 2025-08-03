-- Verificar se a função existe
SELECT 'Função handle_new_user_v2 existe: ' || CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_v2'
) THEN 'SIM' ELSE 'NÃO' END as status;

-- Criar o trigger que estava faltando
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_v2();

-- Verificar se foi criado
SELECT 'Trigger criado: ' || CASE WHEN EXISTS (
  SELECT 1 
  FROM information_schema.triggers 
  WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users' 
  AND trigger_name = 'on_auth_user_created'
) THEN 'SIM' ELSE 'NÃO' END as trigger_status;

-- Garantir que a organização padrão existe
INSERT INTO public.organizations (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Organização Padrão', 'organizacao-padrao', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar se a organização foi criada
SELECT 'Organização padrão existe: ' || CASE WHEN EXISTS (
    SELECT 1 FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
) THEN 'SIM' ELSE 'NÃO' END as org_status;