
-- Garantir permissão total na sequence para todos os papéis usados pela API Supabase
GRANT USAGE, SELECT ON SEQUENCE public.service_number_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.service_number_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.service_number_seq TO postgres;
-- Garantir permissão de EXECUTAR a função nextval_for_service para authenticated, anon, service_role
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO anon;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO service_role;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO postgres;
