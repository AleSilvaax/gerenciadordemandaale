
-- 1. Criar a sequência se não existir e dar permissão
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'service_number_seq') THEN
    CREATE SEQUENCE public.service_number_seq;
    GRANT USAGE, SELECT ON SEQUENCE public.service_number_seq TO authenticated, anon;
  END IF;
END $$;

-- 2. Recriar função corrigida
CREATE OR REPLACE FUNCTION public.nextval_for_service()
RETURNS bigint
LANGUAGE plpgsql
AS $function$
DECLARE
  new_val bigint;
BEGIN
  -- Confirma existência da sequência e permissões
  CREATE SEQUENCE IF NOT EXISTS service_number_seq;
  GRANT USAGE, SELECT ON SEQUENCE service_number_seq TO authenticated, anon;
  -- Gere o próximo valor da sequência
  SELECT nextval('service_number_seq') INTO new_val;
  RETURN new_val;
END;
$function$;

-- 3. Garantir permissão de EXECUTE na função para autenticados
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO anon;
