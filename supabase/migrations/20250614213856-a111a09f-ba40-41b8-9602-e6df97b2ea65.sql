
-- 1. Garantir permissão de uso na sequence (caso não exista ainda, ignore erro)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_class WHERE relname = 'service_number_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE public.service_number_seq TO authenticated, anon;
  END IF;
END $$;

-- 2. Corrigir/criar a função para garantir permissões e evitar erros:
CREATE OR REPLACE FUNCTION public.nextval_for_service()
RETURNS bigint
LANGUAGE plpgsql
AS $function$
DECLARE
  new_val bigint;
BEGIN
  -- Cria a sequência se não existir (safe!)
  CREATE SEQUENCE IF NOT EXISTS service_number_seq;
  -- Garanta que usuários autenticados podem usar a sequência após a criação
  GRANT USAGE, SELECT ON SEQUENCE service_number_seq TO authenticated, anon;
  -- Retorne o próximo valor
  SELECT nextval('service_number_seq') INTO new_val;
  RETURN new_val;
END;
$function$;

-- 3. Reaplicar o grant na função (caso ainda não exista)
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_for_service() TO anon;
